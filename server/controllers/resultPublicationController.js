const ResultPublication = require('../models/ResultPublication');
const Mark = require('../models/Mark');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const logAction = require('../utils/logger');
const { getSemestersFromYear } = require('../utils/academicUtils');

// ... semToYear helpers ...

// @desc    Publish results for a department/year/examType
// @route   POST /api/result-publications
// @access  Private/Admin
const publishResultYearly = async (req, res) => {
    try {
        const { departmentId, year, examType } = req.body;

        if (!departmentId || !year || !examType) {
            return res.status(400).json({ message: 'Department, Year and Exam Type are required' });
        }

        // 1. Check if already published
        const existing = await ResultPublication.findOne({ departmentId, year, examType });
        if (existing) {
            return res.status(400).json({ message: 'Results for this batch/exam are already published' });
        }

        // 2. Validate that marks exist for all sections and semesters in this year
        const semesters = getSemestersFromYear(year);
        const sections = await Section.find({ departmentId, semester: { $in: semesters } });
        const sectionIds = sections.map(s => s._id);

        if (sectionIds.length === 0) {
            return res.status(404).json({ message: `No active sections found for Year ${year} in this department` });
        }

        // STRICT VALIDATION: Verify that every subject assigned to these batches has been submitted
        // A. Find all subjects assigned to these department & semesters
        const expectedSubjects = await Subject.find({ 
            departmentId, 
            semester: { $in: semesters } 
        });

        // B. Find marks that are actually ready to be published for this exam
        const readyMarks = await Mark.find({
            examType,
            sectionId: { $in: sectionIds },
            semester: { $in: semesters },
            status: 'ready_to_publish'
        });

        // C. Check for missing or incomplete subjects
        const readySubjectIds = readyMarks.map(m => m.subjectId.toString());
        const missingSubjects = expectedSubjects.filter(sub => !readySubjectIds.includes(sub._id.toString()));

        if (missingSubjects.length > 0) {
            return res.status(400).json({ 
                message: `Publication blocked. Missing or unapproved marks for: ${missingSubjects.map(s => s.code).join(', ')}`,
                missingCount: missingSubjects.length,
                missingSubjects: missingSubjects.map(s => s.code)
            });
        }

        // Check if there are any marks that are not ready (extra safety)
        const pendingMarksCount = await Mark.countDocuments({
            examType,
            sectionId: { $in: sectionIds },
            semester: { $in: semesters },
            status: { $in: ['draft', 'submitted_to_hod'] }
        });

        if (pendingMarksCount > 0) {
            return res.status(400).json({ message: 'Some subjects have entries but haven\'t been approved by the HOD yet.' });
        }

        // Update marks to published
        await Mark.updateMany(
            {
                examType,
                sectionId: { $in: sectionIds },
                semester: { $in: semesters },
                status: 'ready_to_publish'
            },
            { $set: { status: 'published' } }
        );

        // 3. Create publication record
        const publication = await ResultPublication.create({
            departmentId,
            year,
            examType,
            publishedBy: req.user._id,
            isPublished: true
        });

        // Audit Log
        await logAction({
            action: 'PUBLISH_RESULTS_YEARLY',
            actorId: req.user._id,
            actorName: req.user.name,
            targetEntity: 'ResultPublication',
            details: { departmentId, year, examType },
            req
        });

        res.status(201).json({
            message: `Results for Year ${year} (${examType}) published successfully`,
            publication
        });

    } catch (error) {
        console.error("Publish Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Unpublish results
// @route   PUT /api/result-publications/:id/unpublish
// @access  Private/Admin
const unpublishResult = async (req, res) => {
    try {
        const publication = await ResultPublication.findById(req.params.id);
        if (!publication) {
            return res.status(404).json({ message: 'Publication record not found' });
        }

        publication.isPublished = false;
        await publication.save();

        // Find sections for this department and year
        const semesters = getSemestersFromYear(publication.year);
        const sections = await Section.find({ departmentId: publication.departmentId, semester: { $in: semesters } });
        const sectionIds = sections.map(s => s._id);

        // Revert marks to ready_to_publish
        await Mark.updateMany(
            {
                examType: publication.examType,
                sectionId: { $in: sectionIds },
                semester: { $in: semesters },
                status: 'published'
            },
            { $set: { status: 'ready_to_publish' } }
        );

        // Audit Log
        await logAction({
            action: 'UNPUBLISH_RESULTS',
            actorId: req.user._id,
            actorName: req.user.name,
            targetEntity: 'ResultPublication',
            details: { id: req.params.id },
            req
        });

        res.status(200).json({ message: 'Results unpublished' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    List all publications
// @route   GET /api/result-publications
// @access  Private/Admin/HOD
const getPublicationsSorted = async (req, res) => {
    try {
        let filter = {};
        if (req.user && req.user.role === 'hod') {
            filter.departmentId = req.user.departmentId;
        }

        const publications = await ResultPublication.find(filter)
            .populate('departmentId', 'name code')
            .populate('publishedBy', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(publications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    publishResultYearly,
    unpublishResult,
    getPublicationsSorted
};
