const Section = require('../models/Section');
const Department = require('../models/Department');

const createSection = async (req, res) => {
    try {
        const { departmentId, semester, name, batch, year } = req.body;

        // Find department
        const dept = await Department.findById(departmentId);
        if (!dept) return res.status(404).json({ message: 'Department not found' });

        // Enforce HOD scoping
        if (req.user && req.user.role === 'hod' && String(req.user.departmentId) !== String(departmentId)) {
            return res.status(403).json({ message: 'Unauthorized: You can only create sections for your own department.' });
        }

        const section = await Section.create({
            departmentId,
            department: dept.name, // Storing name for easier display
            semester,
            name,
            batch,
            year
        });
        res.status(201).json(section);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Section already exists for this batch/semester' });
        }
        res.status(400).json({ message: error.message });
    }
};

const getSections = async (req, res) => {
    try {
        let filter = {};
        // If HOD, only show sections for their department
        if (req.user && req.user.role === 'hod') {
            filter.departmentId = req.user.departmentId;
        }

        const sections = await Section.find(filter)
            .populate('departmentId', 'name code')
            .sort({ batch: -1, department: 1, semester: 1, name: 1 });
        res.json(sections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSectionsByDepartment = async (req, res) => {
    try {
        const { departmentId, semester } = req.params;
        const query = { departmentId };
        if (semester) query.semester = semester;

        const sections = await Section.find(query).sort({ name: 1 });
        res.json(sections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateSection = async (req, res) => {
    try {
        const section = await Section.findById(req.params.id);
        if (!section) return res.status(404).json({ message: 'Section not found' });

        // Enforce HOD scoping
        if (req.user && req.user.role === 'hod' && String(req.user.departmentId) !== String(section.departmentId)) {
            return res.status(403).json({ message: 'Unauthorized: You can only update sections in your own department.' });
        }

        // Apply updates
        Object.assign(section, req.body);
        await section.save();
        res.json(section);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteSection = async (req, res) => {
    try {
        const section = await Section.findById(req.params.id);
        if (!section) return res.status(404).json({ message: 'Section not found' });

        // Enforce HOD scoping
        if (req.user && req.user.role === 'hod' && String(req.user.departmentId) !== String(section.departmentId)) {
            return res.status(403).json({ message: 'Unauthorized: You can only delete sections in your own department.' });
        }

        await section.deleteOne();
        res.json({ message: 'Section removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createSection,
    getSections,
    getSectionsByDepartment,
    updateSection,
    deleteSection
};
