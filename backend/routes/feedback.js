const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Session = require('../models/Session');
const router = express.Router();

// @route   POST /api/feedback
// @desc    Submit feedback for a session partner
router.post('/', auth, async (req, res) => {
  try {
    const { sessionId, communication, technical, overall, note } = req.body;

    // Validate session
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ msg: 'Session not found' });

    // Ensure user is a participant
    const participant = session.participants.find(
      p => p.user.toString() === req.user.id
    );
    if (!participant) return res.status(403).json({ msg: 'Not a participant' });

    // Determine the target user (the partner)
    const partner = session.participants.find(
      p => p.user.toString() !== req.user.id
    );
    if (!partner) return res.status(400).json({ msg: 'Partner not found' });

    // Check if feedback already submitted for this session by this user
    const existing = await Feedback.findOne({
      session: sessionId,
      fromUser: req.user.id
    });
    if (existing) return res.status(400).json({ msg: 'Feedback already submitted' });

    // Create feedback
    const feedback = new Feedback({
      session: sessionId,
      fromUser: req.user.id,
      toUser: partner.user,
      communication,
      technical,
      overall,
      note: note || ''
    });

    await feedback.save();
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Feedback already submitted' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET /api/feedback/stats
// @desc    Get average ratings for the logged‑in user
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      { $match: { toUser: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: null,
          avgCommunication: { $avg: '$communication' },
          avgTechnical: { $avg: '$technical' },
          avgOverall: { $avg: '$overall' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        avgCommunication: 0,
        avgTechnical: 0,
        avgOverall: 0,
        count: 0
      });
    }

    const s = stats[0];
    res.json({
      avgCommunication: Math.round(s.avgCommunication * 10) / 10,
      avgTechnical: Math.round(s.avgTechnical * 10) / 10,
      avgOverall: Math.round(s.avgOverall * 10) / 10,
      count: s.count
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;