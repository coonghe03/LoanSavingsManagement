const Loan = require('../models/Loan');
const LoanPayment = require('../models/LoanPayment');
const Customer = require('../models/Customer');
const generateId = require('../utils/generateId');

// Helper: Recalculate loan balances from all payments
const recalculateLoanBalances = async (loanId) => {
    const loan = await Loan.findById(loanId);
    if (!loan) return;

    const payments = await LoanPayment.find({ loan: loanId, isDeleted: false });

    let totalPaid = 0;
    let totalInterestPaid = 0;
    let principalPaid = 0;

    payments.forEach((p) => {
        totalPaid += p.totalAmount;
        totalInterestPaid += p.interestAmount;
        principalPaid += p.principalAmount;
    });

    const outstandingPrincipal = Math.max(loan.loanAmount - principalPaid, 0);
    const outstandingInterest = Math.max((loan.monthlyInterest || 0) - totalInterestPaid, 0); // simple version
    const totalOutstanding = outstandingPrincipal + outstandingInterest;

    // Update loan
    loan.totalPaid = totalPaid;
    loan.totalInterestPaid = totalInterestPaid;
    loan.principalPaid = principalPaid;
    loan.outstandingPrincipal = outstandingPrincipal;
    loan.outstandingInterest = outstandingInterest;
    loan.totalOutstanding = totalOutstanding;

    // Status update
    if (outstandingPrincipal <= 0) {
        loan.status = 'Completed';
    } else if (loan.status === 'Completed') {
        loan.status = 'Active';
    }

    await loan.save();
    return loan;
};

// @desc    Get all payments
// @route   GET /api/loan-payments
const getPayments = async (req, res) => {
    try {
        const payments = await LoanPayment.find({ isDeleted: false })
            .populate('loan', 'loanId loanAmount')
            .populate('customer', 'name mobile customerId')
            .sort({ paymentDate: -1 });

        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get payments of a specific loan
// @route   GET /api/loans/:id/payments
const getPaymentsByLoan = async (req, res) => {
    try {
        const payments = await LoanPayment.find({
            loan: req.params.id,
            isDeleted: false,
        }).sort({ paymentDate: -1 });

        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Record a new loan payment
// @route   POST /api/loan-payments
const createPayment = async (req, res) => {
    try {
        const {
            loanId,
            paymentDate,
            paymentMonth,
            principalAmount,
            interestAmount,
            totalAmount,
            paymentMethod,
            reference,
            notes,
        } = req.body;

        if (!loanId || !paymentMonth || !totalAmount) {
            return res.status(400).json({
                message: 'Loan, Payment Month and Total Amount are required',
            });
        }

        const loan = await Loan.findOne({ _id: loanId, isDeleted: false });
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        // Check duplicate month (optional warning)
        const existingPayment = await LoanPayment.findOne({
            loan: loanId,
            paymentMonth,
            isDeleted: false,
        });

        if (existingPayment) {
            return res.status(400).json({
                message: `Payment for month ${paymentMonth} already exists`,
            });
        }

        // Generate Payment ID
        const count = await LoanPayment.countDocuments();
        const paymentId = generateId('PAY', count);

        const payment = await LoanPayment.create({
            paymentId,
            loan: loanId,
            customer: loan.customer,
            paymentDate: paymentDate || new Date(),
            paymentMonth,
            principalAmount: principalAmount || 0,
            interestAmount: interestAmount || 0,
            totalAmount,
            paymentMethod: paymentMethod || 'Cash',
            reference: reference || '',
            notes: notes || '',
            status: 'Paid',
        });

        // Recalculate balances (very important)
        const updatedLoan = await recalculateLoanBalances(loanId);

        res.status(201).json({
            message: 'Payment recorded successfully',
            payment,
            updatedLoan,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Soft delete payment
// @route   DELETE /api/loan-payments/:id
const deletePayment = async (req, res) => {
    try {
        const payment = await LoanPayment.findOne({ _id: req.params.id, isDeleted: false });
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        payment.isDeleted = true;
        await payment.save();

        // Recalculate after delete
        await recalculateLoanBalances(payment.loan);

        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getPayments,
    getPaymentsByLoan,
    createPayment,
    deletePayment,
    recalculateLoanBalances,
};