const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
    {
        loanId: {
            type: String,
            unique: true,
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
        },
        loanAmount: {
            type: Number,
            required: [true, 'Loan amount is required'],
            min: [1, 'Loan amount must be greater than 0'],
        },
        interestRate: {
            type: Number,
            required: [true, 'Interest rate is required'],
            min: 0,
        },
        interestType: {
            type: String,
            enum: ['Flat', 'Reducing', 'Monthly Fixed'],
            default: 'Monthly Fixed',
        },
        startDate: {
            type: Date,
            required: true,
        },
        dueDate: {
            type: Date,
        },
        monthlyPayment: {
            type: Number,
            default: 0,
        },
        monthlyInterest: {
            type: Number,
            default: 0,
        },
        purpose: {
            type: String,
            default: '',
        },
        notes: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['Active', 'Completed', 'Overdue', 'Cancelled'],
            default: 'Active',
        },
        // Calculated fields (server-side update)
        totalPaid: {
            type: Number,
            default: 0,
        },
        totalInterestPaid: {
            type: Number,
            default: 0,
        },
        principalPaid: {
            type: Number,
            default: 0,
        },
        outstandingPrincipal: {
            type: Number,
            default: 0,
        },
        outstandingInterest: {
            type: Number,
            default: 0,
        },
        totalOutstanding: {
            type: Number,
            default: 0,
        },
        nextPaymentDate: {
            type: Date,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Indexes
loanSchema.index({ loanId: 1, status: 1, customer: 1 });

module.exports = mongoose.model('Loan', loanSchema);