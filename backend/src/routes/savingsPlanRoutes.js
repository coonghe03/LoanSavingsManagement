const express = require('express');
const router = express.Router();
const {
    getPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan,
} = require('../controllers/savingsPlanController');
const { getPaymentsByPlan } = require('../controllers/savingsPaymentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getPlans)
    .post(protect, createPlan);

router.route('/:id')
    .get(protect, getPlanById)
    .put(protect, updatePlan)
    .delete(protect, deletePlan);

router.get('/:id/payments', protect, getPaymentsByPlan);

module.exports = router;