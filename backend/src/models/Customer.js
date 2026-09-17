const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        customerId: {
            type: String,
            unique: true,
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true,
        },
        nic: {
            type: String,
            required: [true, 'NIC / ID Number is required'],
            unique: true,
            trim: true,
        },
        mobile: {
            type: String,
            required: [true, 'Mobile number is required'],
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: null,
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive', 'Blocked'],
            default: 'Active',
        },
        notes: {
            type: String,
            default: '',
        },
        isDeleted: {
            type: Boolean,
            default: false, // soft delete
        },
    },
    { timestamps: true }
);

// Indexes for fast search
customerSchema.index({ name: 'text', nic: 1, mobile: 1, customerId: 1 });

module.exports = mongoose.model('Customer', customerSchema);