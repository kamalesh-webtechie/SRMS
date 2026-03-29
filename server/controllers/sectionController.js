const Section = require('../models/Section');
const Department = require('../models/Department');
const mongoose = require('mongoose');

// Helper to resolve department name/ID/code to ObjectId
const resolveDeptId = async (param) => {
    if (!param || param === 'undefined') return null;
    if (mongoose.Types.ObjectId.isValid(param)) return new mongoose.Types.ObjectId(param);
    
    const dept = await Department.findOne({
        $or: [
            { name: new RegExp(`^${param}$`, 'i') },
            { code: new RegExp(`^${param}$`, 'i') }
        ]
    });
    return dept ? dept._id : null;
};

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
        const { departmentId: deptParam, semester } = req.params;
        const resolvedId = await resolveDeptId(deptParam);
        
        let query;
        if (resolvedId) {
            query = { departmentId: resolvedId };
        } else {
            // Fallback for legacy data if resolution fails
            query = { department: new RegExp(`^${deptParam}$`, 'i') };
        }

        if (semester) {
            const semNum = Number(semester);
            // Mapping semester to Year (I, II, III, IV)
            let mappedYear = 'I';
            if (semNum > 6) mappedYear = 'IV';
            else if (semNum > 4) mappedYear = 'III';
            else if (semNum > 2) mappedYear = 'II';
            else mappedYear = 'I';

            // Query by BOTH semester OR year for robust matching
            query.$or = [
                { semester: semNum },
                { year: mappedYear }
            ];
        }

        const sections = await Section.find(query).sort({ name: 1 });
        console.log(`Sections Search for Dept: ${deptParam}, Sem: ${semester} -> Found ${sections.length}`);
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
