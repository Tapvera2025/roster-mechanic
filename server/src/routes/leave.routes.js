const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  getAllLeaves,
  getLeaveStats,
  createLeave,
  approveLeave,
  declineLeave,
  cancelLeave,
  getMyLeaves,
  submitMyLeave,
  cancelMyLeave,
} = require('../controllers/leave.controller');

// All routes require authentication
router.use(auth);

// ── Employee self-service ─────────────────────────────────────────────────────
router.get('/my', getMyLeaves);
router.post('/my', submitMyLeave);
router.put('/my/:id/cancel', cancelMyLeave);

// ── Admin / Manager ───────────────────────────────────────────────────────────
router.get('/stats', authorize('ADMIN', 'MANAGER'), getLeaveStats);
router.get('/', authorize('ADMIN', 'MANAGER'), getAllLeaves);
router.post('/', authorize('ADMIN', 'MANAGER'), createLeave);
router.put('/:id/approve', authorize('ADMIN', 'MANAGER'), approveLeave);
router.put('/:id/decline', authorize('ADMIN', 'MANAGER'), declineLeave);
router.put('/:id/cancel', authorize('ADMIN', 'MANAGER'), cancelLeave);

module.exports = router;
