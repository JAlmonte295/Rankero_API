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
router.get('/:id', async (req, res) => {
  // Logic to get a single rank
});

// PUT /ranks/:id - Update a rank by ID
router.put('/:id', async (req, res) => {
  // Logic to update a rank
});

// DELETE /ranks/:id - Delete a rank by ID
router.delete('/:id', async (req, res) => {
  // Logic to delete a rank
});

module.exports = router;
