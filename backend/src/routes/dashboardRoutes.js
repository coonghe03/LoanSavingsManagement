const express = require('express');
const router = express.Router();
const {
    getMainSummary,
    getLoanDashboard,
    getSavingsDashboard,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', protect, getMainSummary);
router.get('/loans', protect, getLoanDashboard);
router.get('/savings', protect, getSavingsDashboard);

module.exports = router;