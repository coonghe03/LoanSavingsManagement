const SavingsPlan = require('../models/SavingsPlan');
const SavingsPayment = require('../models/SavingsPayment');
const generateId = require('../utils/generateId');

// @desc    Get all savings plans
// @route   GET /api/savings-plans
const getPlans = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = { isDeleted: false };

        if (status) query.status = status;

        if (search) {
            query.$or = [
                { planName: { $regex: search, $options: 'i' } },
                { planId: { $regex: search, $options: 'i' } },
            ];
        }

        const plans = await SavingsPlan.find(query).sort({ createdAt: -1 });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get single plan with payments
// @route   GET /api/savings-plans/:id
const getPlanById = async (req, res) => {
    try {
        const plan = await SavingsPlan.findOne({ _id: req.params.id, isDeleted: false });
        if (!plan) {
            return res.status(404).json({ message: 'Savings plan not found' });
        }

        const payments = await SavingsPayment.find({ plan: plan._id, isDeleted: false })
            .sort({ paymentMonth: 1 });

        res.json({ plan, payments });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create new savings plan
// @route   POST /api/savings-plans
const createPlan = async (req, res) => {
    try {
        const { planName, monthlyAmount, startDate, endDate, totalMonths, notes } = req.body;

        if (!planName || !monthlyAmount || !startDate) {
            return res.status(400).json({
                message: 'Plan Name, Monthly Amount and Start Date are required',
            });
        }

        const count = await SavingsPlan.countDocuments();
        const planId = generateId('SAV', count);

        // Calculate next payment month (YYYY-MM)
        const start = new Date(startDate);
        const nextPaymentMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

        const plan = await SavingsPlan.create({
            planId,
            planName,
            monthlyAmount,
            startDate,
            endDate: endDate || null,
            totalMonths: totalMonths || 12,
            notes: notes || '',
            status: 'Active',
            totalContributed: 0,
            monthsPaid: 0,
            monthsPending: totalMonths || 12,
            nextPaymentMonth,
        });

        res.status(201).json({
            message: 'Savings plan created successfully',
            plan,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update plan
// @route   PUT /api/savings-plans/:id
const updatePlan = async (req, res) => {
    try {
        const plan = await SavingsPlan.findOne({ _id: req.params.id, isDeleted: false });
        if (!plan) {
            return res.status(404).json({ message: 'Savings plan not found' });
        }

        const allowed = ['planName', 'monthlyAmount', 'endDate', 'totalMonths', 'notes', 'status'];
        allowed.forEach((field) => {
            if (req.body[field] !== undefined) {
                plan[field] = req.body[field];
            }
        });

        const updated = await plan.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Soft delete plan
// @route   DELETE /api/savings-plans/:id
const deletePlan = async (req, res) => {
    try {
        const plan = await SavingsPlan.findOne({ _id: req.params.id, isDeleted: false });
        if (!plan) {
            return res.status(404).json({ message: 'Savings plan not found' });
        }

        plan.isDeleted = true;
        plan.status = 'Cancelled';
        await plan.save();

        res.json({ message: 'Savings plan deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan,
};