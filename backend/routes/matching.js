const express = require('express');
const auth = require('../middleware/auth');
const MatchingRequest = require('../models/MatchingRequest');
const MatchingService = require('../services/MatchingService');
const Session = require('../models/Session');
const router = express.Router();

/**
 * @route   POST /api/matching/instant
 * @desc    Create an instant interview matching request
 * @access  Private
 */
router.post('/instant', auth, async (req, res) => {
  try {
    const { interviewType, difficulty, targetCompany, preferredLanguage, identityPreference, rolePreference } = req.body;

    // Validate required fields
    if (!interviewType || !difficulty || !preferredLanguage) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }

    // Create the matching request
    const matchingRequest = new MatchingRequest({
      userId: req.user.id,
      type: 'instant',
      interviewType,
      difficulty,
      targetCompany,
      preferredLanguage,
      identityPreference: identityPreference || 'Named',
      rolePreference: rolePreference || 'candidate',
      status: 'waiting'
    });

    await matchingRequest.save();

    res.json({
      requestId: matchingRequest._id,
      status: 'waiting',
      message: 'Searching for a peer...'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   POST /api/matching/scheduled
 * @desc    Create a scheduled interview matching request
 * @access  Private
 */
router.post('/scheduled', auth, async (req, res) => {
  try {
    const {
      interviewType,
      difficulty,
      targetCompany,
      preferredLanguage,
      identityPreference,
      rolePreference,
      scheduledDate,
      startTime,
      endTime
    } = req.body;

    // Validate required fields
    if (!interviewType || !difficulty || !preferredLanguage || !scheduledDate || !startTime || !endTime) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }

    // Parse dates
    const scheduled = new Date(scheduledDate);
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const scheduledStartTime = new Date(scheduled);
    scheduledStartTime.setHours(startHour, startMin, 0, 0);

    const scheduledEndTime = new Date(scheduled);
    scheduledEndTime.setHours(endHour, endMin, 0, 0);

    // Calculate fallback eligible time (120 minutes before start)
    const fallbackEligibleAt = new Date(scheduledStartTime.getTime() - 120 * 60 * 1000);

    // Validate times
    if (scheduledStartTime >= scheduledEndTime) {
      return res.status(400).json({ msg: 'Start time must be before end time' });
    }

    if (scheduledStartTime < new Date()) {
      return res.status(400).json({ msg: 'Scheduled time must be in the future' });
    }

    // Create the scheduled matching request
    const matchingRequest = new MatchingRequest({
      userId: req.user.id,
      type: 'scheduled',
      interviewType,
      difficulty,
      targetCompany,
      preferredLanguage,
      identityPreference: identityPreference || 'Named',
      rolePreference: rolePreference || 'candidate',
      scheduledDate: scheduled,
      scheduledStartTime,
      scheduledEndTime,
      fallbackEligibleAt,
      status: 'waiting'
    });

    await matchingRequest.save();

    res.json({
      requestId: matchingRequest._id,
      status: 'waiting',
      scheduledStartTime,
      scheduledEndTime,
      fallbackEligibleAt,
      message: 'Waiting for an interviewer'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   POST /api/matching/try-match/:requestId
 * @desc    Try to find a match for a request
 * @access  Private
 */
router.post('/try-match/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;

    const matchingRequest = await MatchingRequest.findById(requestId);
    if (!matchingRequest) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    // Verify ownership
    if (!matchingRequest.userId.equals(req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    if (matchingRequest.status !== 'waiting') {
      return res.status(400).json({ msg: 'Request is not waiting' });
    }

    // Try to match
    let result;
    if (matchingRequest.type === 'instant') {
      result = await MatchingService.matchInstantInterview(requestId);
    } else if (matchingRequest.type === 'scheduled') {
      // For scheduled, check if fallback is eligible
      const now = new Date();
      if (now >= matchingRequest.fallbackEligibleAt) {
        result = await MatchingService.applyScheduledFallback(requestId);
      } else {
        // Try interviewer match first
        const interviewerMatch = await MatchingService.findInterviewerMatch(matchingRequest);
        if (interviewerMatch) {
          result = await MatchingService.matchRequests(requestId, interviewerMatch._id, 'interviewer');
          result.matchType = 'interviewer';
          result.matched = true;
        } else {
          result = { matched: false, message: 'Still waiting for an interviewer' };
        }
      }
    }

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    if (result.matched) {
      const session = result.result.session;
      const partner = result.result.request2;

      return res.json({
        matched: true,
        matchType: result.matchType,
        sessionId: session._id,
        partnerUserId: partner.userId,
        message: result.matchType === 'interviewer' ? 'Interview matched successfully' : 'Peer matched successfully'
      });
    }

    res.json({
      matched: false,
      message: result.message || 'No match found yet'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET /api/matching/request/:requestId
 * @desc    Get a matching request details
 * @access  Private
 */
router.get('/request/:requestId', auth, async (req, res) => {
  try {
    const matchingRequest = await MatchingRequest.findById(req.params.requestId).populate('matchedWith', 'name');

    if (!matchingRequest) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    // Verify ownership
    if (!matchingRequest.userId.equals(req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    res.json(matchingRequest);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   POST /api/matching/cancel/:requestId
 * @desc    Cancel a matching request
 * @access  Private
 */
router.post('/cancel/:requestId', auth, async (req, res) => {
  try {
    const matchingRequest = await MatchingRequest.findById(req.params.requestId);

    if (!matchingRequest) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    // Verify ownership
    if (!matchingRequest.userId.equals(req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const success = await MatchingService.cancelRequest(matchingRequest._id);

    if (success) {
      res.json({ msg: 'Request cancelled' });
    } else {
      res.status(400).json({ error: 'Failed to cancel request' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET /api/matching/active
 * @desc    Get user's active matching requests
 * @access  Private
 */
router.get('/active', auth, async (req, res) => {
  try {
    const requests = await MatchingRequest.find({
      userId: req.user.id,
      status: { $in: ['waiting', 'matched'] }
    }).sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET /api/matching/scheduled-list
 * @desc    Get all user's scheduled interviews
 * @access  Private
 */
router.get('/scheduled-list', auth, async (req, res) => {
  try {
    const now = new Date();
    const requests = await MatchingRequest.find({
      userId: req.user.id,
      type: 'scheduled',
      scheduledStartTime: { $gte: now },
      status: { $in: ['waiting', 'matched'] }
    }).sort({ scheduledStartTime: 1 });

    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
