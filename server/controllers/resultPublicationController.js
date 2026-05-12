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
        const { departmentId, year, examType, sectionId } = req.body;

        if (!departmentId || !year || !examType) {
            return res.status(400).json({ message: 'Department, Year and Exam Type are required' });
        }

        // 1. Check if already published
        const query = { departmentId, year, examType, sectionId: sectionId || null };
        const existing = await ResultPublication.findOne(query);
        if (existing) {
            return res.status(400).json({ message: 'Results for this selection are already published' });
        }

        // 2. Validate that marks exist
        const semesters = getSemestersFromYear(year);
        
        let sectionIds;
        if (sectionId) {
            sectionIds = [sectionId];
        } else {
            const sections = await Section.find({ departmentId, semester: { $in: semesters } });
            sectionIds = sections.map(s => s._id);
        }

        if (sectionIds.length === 0) {
            return res.status(404).json({ message: `No active sections found for this selection` });
        }

        // Find all subjects assigned to these department & semesters
        const expectedSubjects = await Subject.find({ 
            $or: [
                { departmentId },
                { isCommon: true }
            ],
            semester: { $in: semesters } 
        });

        // Find marks ready to be published
        const readyMarks = await Mark.find({
            examType,
            sectionId: { $in: sectionIds },
            semester: { $in: semesters },
            status: 'ready_to_publish'
        });

        const readySubjectIds = readyMarks.map(m => m.subjectId.toString());
        const missingSubjects = expectedSubjects.filter(sub => !readySubjectIds.includes(sub._id.toString()));

        // If we are publishing for a specific section, we only care about marks for THAT section
        // If we are publishing for a whole year, we care about ALL sections.
        // The current logic is a bit strict: it requires ALL subjects for ALL sections to be ready if sectionId is not provided.

        if (missingSubjects.length > 0 && !sectionId) {
             return res.status(400).json({ 
                 message: `Publication blocked. Missing or unapproved marks for some subjects in the year.`,
                 missingCount: missingSubjects.length
             });
        }

        // Check if there are any marks that are not ready
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
            sectionId: sectionId || null,
            publishedBy: req.user._id,
            isPublished: true
        });

        // Audit Log
        await logAction({
            action: 'PUBLISH_RESULTS',
            actorId: req.user._id,
            actorName: req.user.name,
            targetEntity: 'ResultPublication',
            details: { departmentId, year, examType, sectionId },
            req
        });

        res.status(201).json({
            message: `Results published successfully`,
            publication
        });

    } catch (error) {
        console.error("Publish Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get preview of marks status before publishing
// @route   GET /api/result-publications/preview
// @access  Private/Admin
const getPublicationPreview = async (req, res) => {
    try {
        const { departmentId, year, examType, sectionId } = req.query;

        if (!departmentId || !year || !examType) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        const semesters = getSemestersFromYear(year);
        
        let sectionIds;
        if (sectionId) {
            sectionIds = [sectionId];
        } else {
            const sections = await Section.find({ departmentId, semester: { $in: semesters } });
            sectionIds = sections.map(s => s._id);
        }

        // Get all subjects for these semesters
        const subjects = await Subject.find({ 
            $or: [
                { departmentId },
                { isCommon: true }
            ],
            semester: { $in: semesters } 
        }).select('name code semester');

        // Get marks status for these subjects/sections
        const marks = await Mark.find({
            examType,
            sectionId: { $in: sectionIds },
            semester: { $in: semesters }
        }).select('subjectId sectionId status');

        // Map subjects to their status per section
        const preview = subjects.map(sub => {
            const subjectMarks = marks.filter(m => m.subjectId.toString() === sub._id.toString());
            
            // If sectionId is provided, we only have one section to worry about
            // If not, we check if ALL sections for this year have this subject ready
            
            return {
                _id: sub._id,
                name: sub.name,
                code: sub.code,
                semester: sub.semester,
                statusSummary: {
                    total: sectionIds.length,
                    ready: subjectMarks.filter(m => m.status === 'ready_to_publish').length,
                    published: subjectMarks.filter(m => m.status === 'published').length,
                    pending: subjectMarks.filter(m => ['draft', 'submitted_to_hod'].includes(m.status)).length,
                    missing: sectionIds.length - subjectMarks.length
                }
            };
        });

        res.status(200).json(preview);
    } catch (error) {
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
    getPublicationsSorted,
    getPublicationPreview
};
