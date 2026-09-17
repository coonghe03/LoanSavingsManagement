const Loan = require('../models/Loan');
const Customer = require('../models/Customer');
const LoanPayment = require('../models/LoanPayment');
const Notification = require('../models/Notification');
const generateId = require('../utils/generateId');

// @desc    Get all loans
// @route   GET /api/loans
const getLoans = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = { isDeleted: false };

        if (status) query.status = status;

        let loans = await Loan.find(query)
            .populate('customer', 'name mobile customerId nic')
            .sort({ createdAt: -1 });

        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            loans = loans.filter((loan) => {
                return (
                    loan.loanId.toLowerCase().includes(searchLower) ||
                    (loan.customer?.name && loan.customer.name.toLowerCase().includes(searchLower)) ||
                    (loan.customer?.mobile && loan.customer.mobile.includes(search)) ||
                    (loan.customer?.customerId && loan.customer.customerId.toLowerCase().includes(searchLower))
                );
            });
        }

        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get single loan with payments
// @route   GET /api/loans/:id
const getLoanById = async (req, res) => {
    try {
        const loan = await Loan.findOne({ _id: req.params.id, isDeleted: false })
            .populate('customer', 'name mobile customerId nic address email');

        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        const payments = await LoanPayment.find({ loan: loan._id, isDeleted: false })
            .sort({ paymentDate: -1 });

        res.json({ loan, payments });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create new loan
// @route   POST /api/loans
const createLoan = async (req, res) => {
    try {
        const {
            customerId,
            loanAmount,
            interestRate,
            interestType,
            startDate,
            dueDate,
            monthlyPayment,
            monthlyInterest,
            purpose,
            notes,
        } = req.body;

        if (!customerId || !loanAmount || !interestRate || !startDate) {
            return res.status(400).json({
                message: 'Customer, Loan Amount, Interest Rate and Start Date are required',
            });
        }

        const customer = await Customer.findOne({ _id: customerId, isDeleted: false });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Generate Loan ID
        const count = await Loan.countDocuments();
        const loanId = generateId('LN', count);

        const loan = await Loan.create({
            loanId,
            customer: customerId,
            loanAmount,
            interestRate,
            interestType: interestType || 'Monthly Fixed',
            startDate,
            dueDate: dueDate || null,
            monthlyPayment: monthlyPayment || 0,
            monthlyInterest: monthlyInterest || 0,
            purpose: purpose || '',
            notes: notes || '',
            status: 'Active',
            outstandingPrincipal: loanAmount,
            outstandingInterest: 0,
            totalOutstanding: loanAmount,
            nextPaymentDate: startDate,
        });

        // Create Notification (ready for SMS/WhatsApp/Email later)
        const message = `Dear ${customer.name},
Your loan has been successfully registered.
Loan ID: ${loanId}
Loan Amount: Rs. ${loanAmount.toLocaleString()}
Interest Rate: ${interestRate}%
Monthly Payment: Rs. ${(monthlyPayment || 0).toLocaleString()}
Loan Date: ${new Date(startDate).toLocaleDateString('en-GB')}
Thank you.`;

        await Notification.create({
            customer: customerId,
            loan: loan._id,
            type: 'LoanCreated',
            channel: 'InApp',
            message,
            status: 'Pending',
        });

        // Populate customer for response
        const populatedLoan = await Loan.findById(loan._id).populate(
            'customer',
            'name mobile customerId'
        );

        res.status(201).json({
            message: 'Loan created successfully',
            loan: populatedLoan,
            notificationMessage: message,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update loan
// @route   PUT /api/loans/:id
const updateLoan = async (req, res) => {
    try {
        const loan = await Loan.findOne({ _id: req.params.id, isDeleted: false });
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        const allowedUpdates = [
            'interestRate',
            'interestType',
            'dueDate',
            'monthlyPayment',
            'monthlyInterest',
            'purpose',
            'notes',
            'status',
        ];

        allowedUpdates.forEach((field) => {
            if (req.body[field] !== undefined) {
                loan[field] = req.body[field];
            }
        });

        const updatedLoan = await loan.save();
        res.json(updatedLoan);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Soft delete loan
// @route   DELETE /api/loans/:id
const deleteLoan = async (req, res) => {
    try {
        const loan = await Loan.findOne({ _id: req.params.id, isDeleted: false });
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        loan.isDeleted = true;
        loan.status = 'Cancelled';
        await loan.save();

        res.json({ message: 'Loan deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getLoans,
    getLoanById,
    createLoan,
    updateLoan,
    deleteLoan,
};