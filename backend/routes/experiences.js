const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Experience = require('../models/Experience');
const router = express.Router();

// @route   POST /api/experiences
// @desc    Submit a new interview experience
router.post('/', auth, async (req, res) => {
  try {
    const { company, role, interviewType, difficulty, outcome, mode, location, content } = req.body;

    const experience = new Experience({
      user: req.user.id,
      company,
      role,
      interviewType,
      difficulty,
      outcome: outcome || '',
      mode: mode || '',
      location: location || '',
      content
    });

    await experience.save();
    const populated = await Experience.findById(experience._id)
      .populate('user', 'name college degree branch year graduationYear');
    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/experiences
// @desc    Get all experiences with optional filters & sorting
router.get('/', async (req, res) => {
  try {
    const { company, interviewType, difficulty, sort } = req.query;
    const filter = {};
    if (company) filter.company = company;
    if (interviewType) filter.interviewType = interviewType;
    if (difficulty) filter.difficulty = difficulty;

    let sortOption = { createdAt: -1 };
    const experiences = await Experience.find(filter)
      .populate('user', 'name college degree branch year graduationYear')
      .sort(sortOption)
      .lean();

    const result = experiences.map(exp => ({
      ...exp,
      upvotesCount: exp.upvotes.length
    }));

    if (sort === 'upvotes') {
      result.sort((a, b) => b.upvotesCount - a.upvotesCount);
    } else if (sort === 'oldest') {
      result.sort((a, b) => a.createdAt - b.createdAt);
    }

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/experiences/:id
// @desc    Get a single experience (increments reads)
router.get('/:id', async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id)
      .populate('user', 'name college degree branch year graduationYear');
    if (!experience) return res.status(404).json({ msg: 'Experience not found' });

    // increment reads
    experience.reads = (experience.reads || 0) + 1;
    await experience.save();

    res.json(experience);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/experiences/:id/upvote
// @desc    Toggle upvote
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);
    if (!experience) return res.status(404).json({ msg: 'Experience not found' });

    const userId = req.user.id;
    const alreadyUpvoted = experience.upvotes.some(id => id.toString() === userId);

    if (alreadyUpvoted) {
      experience.upvotes = experience.upvotes.filter(id => id.toString() !== userId);
    } else {
      experience.upvotes.push(userId);
    }

    await experience.save();
    const populated = await Experience.findById(experience._id)
      .populate('user', 'name college degree branch year graduationYear');
    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;