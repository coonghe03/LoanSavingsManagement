const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const LoanPayment = require('../models/LoanPayment');
const SavingsPlan = require('../models/SavingsPlan');
const SavingsPayment = require('../models/SavingsPayment');

// Helper: Get start & end of current month
const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
};

// @desc    Main Dashboard Summary
// @route   GET /api/dashboard/summary
const getMainSummary = async (req, res) => {
    try {
        const { start, end } = getCurrentMonthRange();

        // Customers
        const totalCustomers = await Customer.countDocuments({ isDeleted: false });

        // Loans
        const activeLoans = await Loan.countDocuments({ status: 'Active', isDeleted: false });
        const completedLoans = await Loan.countDocuments({ status: 'Completed', isDeleted: false });
        const overdueLoans = await Loan.countDocuments({ status: 'Overdue', isDeleted: false });

        const loanStats = await Loan.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    totalMoneyGiven: { $sum: '$loanAmount' },
                    totalCollected: { $sum: '$totalPaid' },
                    totalInterestCollected: { $sum: '$totalInterestPaid' },
                    totalOutstanding: { $sum: '$totalOutstanding' },
                },
            },
        ]);

        // This month loan collections
        const thisMonthPayments = await LoanPayment.aggregate([
            {
                $match: {
                    isDeleted: false,
                    paymentDate: { $gte: start, $lte: end },
                },
            },
            {
                $group: {
                    _id: null,
                    totalCollection: { $sum: '$totalAmount' },
                    totalInterest: { $sum: '$interestAmount' },
                },
            },
        ]);

        // Savings
        const activePlans = await SavingsPlan.countDocuments({ status: 'Active', isDeleted: false });
        const savingsStats = await SavingsPlan.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    totalSaved: { $sum: '$totalContributed' },
                },
            },
        ]);

        const thisMonthSavings = await SavingsPayment.aggregate([
            {
                $match: {
                    isDeleted: false,
                    paymentDate: { $gte: start, $lte: end },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                },
            },
        ]);

        res.json({
            customers: {
                total: totalCustomers,
            },
            loans: {
                active: activeLoans,
                completed: completedLoans,
                overdue: overdueLoans,
                totalMoneyGiven: loanStats[0]?.totalMoneyGiven || 0,
                totalCollected: loanStats[0]?.totalCollected || 0,
                totalInterestCollected: loanStats[0]?.totalInterestCollected || 0,
                totalOutstanding: loanStats[0]?.totalOutstanding || 0,
                thisMonthCollection: thisMonthPayments[0]?.totalCollection || 0,
                thisMonthInterest: thisMonthPayments[0]?.totalInterest || 0,
            },
            savings: {
                activePlans,
                totalSaved: savingsStats[0]?.totalSaved || 0,
                thisMonthContribution: thisMonthSavings[0]?.total || 0,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Loan Dashboard (detailed)
// @route   GET /api/dashboard/loans
const getLoanDashboard = async (req, res) => {
    try {
        const { start, end } = getCurrentMonthRange();

        const totalCustomers = await Customer.countDocuments({ isDeleted: false });
        const activeLoans = await Loan.countDocuments({ status: 'Active', isDeleted: false });
        const completedLoans = await Loan.countDocuments({ status: 'Completed', isDeleted: false });

        const stats = await Loan.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    totalMoneyGiven: { $sum: '$loanAmount' },
                    totalCollected: { $sum: '$totalPaid' },
                    totalInterestCollected: { $sum: '$totalInterestPaid' },
                    totalOutstanding: { $sum: '$totalOutstanding' },
                },
            },
        ]);

        const thisMonth = await LoanPayment.aggregate([
            {
                $match: {
                    isDeleted: false,
                    paymentDate: { $gte: start, $lte: end },
                },
            },
            {
                $group: {
                    _id: null,
                    collection: { $sum: '$totalAmount' },
                    interest: { $sum: '$interestAmount' },
                },
            },
        ]);

        // Recent Loans
        const recentLoans = await Loan.find({ isDeleted: false })
            .populate('customer', 'name mobile customerId')
            .sort({ createdAt: -1 })
            .limit(5);

        // Recent Payments
        const recentPayments = await LoanPayment.find({ isDeleted: false })
            .populate('loan', 'loanId')
            .populate('customer', 'name mobile')
            .sort({ paymentDate: -1 })
            .limit(5);

        // Overdue Loans (simple version - status based)
        const overdueLoans = await Loan.find({ status: 'Overdue', isDeleted: false })
            .populate('customer', 'name mobile customerId')
            .sort({ nextPaymentDate: 1 })
            .limit(10);

        res.json({
            summary: {
                totalCustomers,
                activeLoans,
                completedLoans,
                totalMoneyGiven: stats[0]?.totalMoneyGiven || 0,
                totalCollected: stats[0]?.totalCollected || 0,
                totalInterestCollected: stats[0]?.totalInterestCollected || 0,
                totalOutstanding: stats[0]?.totalOutstanding || 0,
                thisMonthCollection: thisMonth[0]?.collection || 0,
                thisMonthInterest: thisMonth[0]?.interest || 0,
            },
            recentLoans,
            recentPayments,
            overdueLoans,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Savings Dashboard
// @route   GET /api/dashboard/savings
const getSavingsDashboard = async (req, res) => {
    try {
        const { start, end } = getCurrentMonthRange();

        const activePlans = await SavingsPlan.countDocuments({ status: 'Active', isDeleted: false });
        const completedPlans = await SavingsPlan.countDocuments({ status: 'Completed', isDeleted: false });

        const stats = await SavingsPlan.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    totalSaved: { $sum: '$totalContributed' },
                    totalMonthsPaid: { $sum: '$monthsPaid' },
                    totalMonthsPending: { $sum: '$monthsPending' },
                },
            },
        ]);

        const thisMonth = await SavingsPayment.aggregate([
            {
                $match: {
                    isDeleted: false,
                    paymentDate: { $gte: start, $lte: end },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                },
            },
        ]);

        // Recent contributions
        const recentContributions = await SavingsPayment.find({ isDeleted: false })
            .populate('plan', 'planId planName')
            .sort({ paymentDate: -1 })
            .limit(8);

        // Active plans list
        const activePlansList = await SavingsPlan.find({ status: 'Active', isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            summary: {
                activePlans,
                completedPlans,
                totalSaved: stats[0]?.totalSaved || 0,
                totalMonthsPaid: stats[0]?.totalMonthsPaid || 0,
                totalMonthsPending: stats[0]?.totalMonthsPending || 0,
                thisMonthContribution: thisMonth[0]?.total || 0,
            },
            recentContributions,
            activePlansList,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getMainSummary,
    getLoanDashboard,
    getSavingsDashboard,
};