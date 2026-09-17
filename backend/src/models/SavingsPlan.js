const mongoose = require('mongoose');

const savingsPlanSchema = new mongoose.Schema(
    {
        planId: {
            type: String,
            unique: true,
            required: true,
        },
        planName: {
            type: String,
            required: [true, 'Plan name is required'],
            trim: true,
        },
        monthlyAmount: {
            type: Number,
            required: [true, 'Monthly amount is required'],
            min: [1, 'Amount must be greater than 0'],
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
        },
        totalMonths: {
            type: Number,
            default: 12,
        },
        notes: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['Active', 'Completed', 'Cancelled'],
            default: 'Active',
        },
        // Calculated
        totalContributed: {
            type: Number,
            default: 0,
        },
        monthsPaid: {
            type: Number,
            default: 0,
        },
        monthsPending: {
            type: Number,
            default: 0,
        },
        nextPaymentMonth: {
            type: String, // "2026-10"
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('SavingsPlan', savingsPlanSchema);