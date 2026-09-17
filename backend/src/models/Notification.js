const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
        },
        loan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Loan',
        },
        type: {
            type: String,
            enum: ['LoanCreated', 'PaymentReminder', 'PaymentReceived', 'Overdue', 'Custom'],
            required: true,
        },
        channel: {
            type: String,
            enum: ['SMS', 'WhatsApp', 'Email', 'InApp'],
            default: 'InApp',
        },
        message: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['Pending', 'Sent', 'Failed'],
            default: 'Pending',
        },
        sentAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);