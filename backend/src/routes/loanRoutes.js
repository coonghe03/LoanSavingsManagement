const express = require('express');
const router = express.Router();
const {
    getLoans,
    getLoanById,
    createLoan,
    updateLoan,
    deleteLoan,
} = require('../controllers/loanController');
const { getPaymentsByLoan } = require('../controllers/loanPaymentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getLoans)
    .post(protect, createLoan);

router.route('/:id')
    .get(protect, getLoanById)
    .put(protect, updateLoan)
    .delete(protect, deleteLoan);

router.get('/:id/payments', protect, getPaymentsByLoan);

module.exports = router;