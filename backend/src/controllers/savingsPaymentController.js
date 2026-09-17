const SavingsPlan = require('../models/SavingsPlan');
const SavingsPayment = require('../models/SavingsPayment');
const generateId = require('../utils/generateId');

// Helper: Recalculate plan totals
const recalculatePlan = async (planId) => {
    const plan = await SavingsPlan.findById(planId);
    if (!plan) return;

    const payments = await SavingsPayment.find({ plan: planId, isDeleted: false });

    let totalContributed = 0;
    payments.forEach((p) => {
        totalContributed += p.amount;
    });

    const monthsPaid = payments.length;
    const monthsPending = Math.max((plan.totalMonths || 12) - monthsPaid, 0);

    plan.totalContributed = totalContributed;
    plan.monthsPaid = monthsPaid;
    plan.monthsPending = monthsPending;

    // Next payment month calculation (simple)
    if (monthsPaid > 0) {
        const lastPayment = payments.sort((a, b) => b.paymentMonth.localeCompare(a.paymentMonth))[0];
        const [year, month] = lastPayment.paymentMonth.split('-').map(Number);
        let nextMonth = month + 1;
        let nextYear = year;
        if (nextMonth > 12) {
            nextMonth = 1;
            nextYear += 1;
        }
        plan.nextPaymentMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
    }

    if (monthsPending <= 0) {
        plan.status = 'Completed';
    }

    await plan.save();
    return plan;
};

// @desc    Get all savings payments
// @route   GET /api/savings-payments
const getPayments = async (req, res) => {
    try {
        const payments = await SavingsPayment.find({ isDeleted: false })
            .populate('plan', 'planId planName monthlyAmount')
            .sort({ paymentDate: -1 });

        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get payments of a plan
// @route   GET /api/savings-plans/:id/payments
const getPaymentsByPlan = async (req, res) => {
    try {
        const payments = await SavingsPayment.find({
            plan: req.params.id,
            isDeleted: false,
        }).sort({ paymentMonth: 1 });

        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add monthly savings payment
// @route   POST /api/savings-payments
const createPayment = async (req, res) => {
    try {
        const { planId, paymentMonth, paymentDate, amount, paymentMethod, reference, notes } = req.body;

        if (!planId || !paymentMonth || !amount) {
            return res.status(400).json({
                message: 'Plan, Payment Month and Amount are required',
            });
        }

        const plan = await SavingsPlan.findOne({ _id: planId, isDeleted: false });
        if (!plan) {
            return res.status(404).json({ message: 'Savings plan not found' });
        }

        // Prevent duplicate month
        const existing = await SavingsPayment.findOne({
            plan: planId,
            paymentMonth,
            isDeleted: false,
        });

        if (existing) {
            return res.status(400).json({
                message: `Payment for ${paymentMonth} already exists for this plan`,
            });
        }

        const count = await SavingsPayment.countDocuments();
        const paymentId = generateId('SPAY', count);

        const payment = await SavingsPayment.create({
            paymentId,
            plan: planId,
            paymentMonth,
            paymentDate: paymentDate || new Date(),
            amount,
            paymentMethod: paymentMethod || 'Cash',
            reference: reference || '',
            notes: notes || '',
            status: 'Paid',
        });

        // Recalculate
        const updatedPlan = await recalculatePlan(planId);

        res.status(201).json({
            message: 'Savings payment recorded successfully',
            payment,
            updatedPlan,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Soft delete payment
// @route   DELETE /api/savings-payments/:id
const deletePayment = async (req, res) => {
    try {
        const payment = await SavingsPayment.findOne({ _id: req.params.id, isDeleted: false });
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        payment.isDeleted = true;
        await payment.save();

        await recalculatePlan(payment.plan);

        res.json({ message: 'Savings payment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getPayments,
    getPaymentsByPlan,
    createPayment,
    deletePayment,
};