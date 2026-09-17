const mongoose = require('mongoose');

const savingsPaymentSchema = new mongoose.Schema(
    {
        paymentId: {
            type: String,
            unique: true,
            required: true,
        },
        plan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SavingsPlan',
            required: true,
        },
        paymentMonth: {
            type: String, // "2026-09"
            required: true,
        },
        paymentDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        amount: {
            type: Number,
            required: true,
            min: [1, 'Amount must be greater than 0'],
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
            enum: ['Paid', 'Pending'],
            default: 'Paid',
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Prevent duplicate month for same plan
savingsPaymentSchema.index({ plan: 1, paymentMonth: 1 }, { unique: true });

module.exports = mongoose.model('SavingsPayment', savingsPaymentSchema);