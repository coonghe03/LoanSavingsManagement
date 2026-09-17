const express = require('express');
const router = express.Router();
const {
    getPayments,
    createPayment,
    deletePayment,
} = require('../controllers/savingsPaymentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getPayments)
    .post(protect, createPayment);

router.route('/:id')
    .delete(protect, deletePayment);

module.exports = router;