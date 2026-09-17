const mongoose = require('mongoose');

const loanPaymentSchema = new mongoose.Schema(
    {
        paymentId: {
            type: String,
            unique: true,
            required: true,
        },
        loan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Loan',
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
        },
        paymentDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        paymentMonth: {
            type: String, // Example: "2026-09"
            required: true,
        },
        principalAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        interestAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: [1, 'Payment amount must be greater than 0'],
        },
        paymentMethod: {
            type: String,
            enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other'],
            default: 'Cash',
        },
        reference: {
            type: String,
            default: '',
        },
        notes: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['Paid', 'Partial', 'Pending'],
            default: 'Paid',
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Indexes
loanPaymentSchema.index({ loan: 1, paymentMonth: 1 });
loanPaymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model('LoanPayment', loanPaymentSchema);