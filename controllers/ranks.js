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
router.delete('/:rankId', verifyToken, async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.rankId);

    if (!rank.author.equals(req.user._id)) {
      return res.status(403).json({ err: 'Unauthorized to delete this rank.' });
    }
    const deleteRank = await Rank.findByIdAndDelete(req.params.rankId);

    res.status(200).json(deleteRank);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.post('/:rankId/upvote', verifyToken, async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.rankId);
    rank.upvotes++;
    await rank.save();
    res.status(200).json(rank);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.post('/:rankId/downvote', verifyToken, async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.rankId);
    rank.downvotes++;
    await rank.save();
    res.status(200).json(rank);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.post('/:rankId/comments', verifyToken, async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.rankId);
    if (!rank) return res.status(404).json({ err: 'Rank not found.' });

    req.body.author = req.user._id;
    rank.comments.push(req.body);
    await rank.save();

    await rank.populate('comments.author', 'username');
    res.status(200).json(rank);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// router.delete('/:rankId/comment/:commentId', verifyToken, async (req, res) => {
//   try {
//     const rank = await Rank.findById(req.params.rankId);
//     const comment = rank.comments.id(req.params.commentId);

//     if (!comment) {
//       return res.status(404).json({ err: 'Comment not found.' });
//     }
//     if (!comment.author.equals(req.user._id)) {

//     }

module.exports = router;
