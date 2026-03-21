const Department = require('../models/Department');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Public (or Private)
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        res.status(200).json(departments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = async (req, res) => {
    try {
        const { name, hodName, description } = req.body;

        const deptExists = await Department.findOne({ name });
        if (deptExists) {
            return res.status(400).json({ message: 'Department already exists' });
        }

        const department = await Department.create({
            name,
            hodName,
            description
        });

        res.status(201).json(department);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        const updatedDepartment = await Department.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedDepartment);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
const deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        await department.deleteOne();

        res.status(200).json({ message: 'Department removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
};
