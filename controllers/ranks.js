const express = require('express');
const verifyToken = require('../middleware/verify-token');
const Rank = require('../models/rank');
const router = express.Router();

// GET /ranks - Get all ranks
router.get('/', async (req, res) => {
  try {
    const ranks = await Rank.find({})
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(10) // Get only the top 10
      .populate('author', 'username'); // Populate author's username
    res.status(200).json(ranks);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// POST /ranks - Create a new rank
router.post('/', verifyToken, async (req, res) => {
    try {
        req.body.author = req.user._id;
        const newRank = await Rank.create(req.body);
        newRank._doc.author = req.user;
        res.status(201).json(newRank);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

// GET /ranks/:id - Get a single rank by ID
router.get('/:rankId', verifyToken, async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.rankId)
      .populate('author', 'username');
    if (!rank) {
      return res.status(404).json({ err: 'Rank not found.' });
    }
    res.status(200).json(rank);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// PUT /ranks/:id - Update a rank by ID
router.put('/:rankId', verifyToken, async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.rankId);
    
    if (!rank.author.equals(req.user._id)) {
      return res.status(403).json({ err: 'Unauthorized to update this rank.' });
    }
    const updatedRank = await Rank.findByIdAndUpdate(
      req.params.rankId,
      req.body,
      { new: true }
    );

    updatedRank._doc.author = req.user;
    res.status(200).json(updatedRank);
  } catch (err) {
    res.status(500).json(
      { err: err.message }
    )
  }
});

// DELETE /ranks/:id - Delete a rank by ID
router.delete('/:id', async (req, res) => {
  // Logic to delete a rank
});

module.exports = router;
