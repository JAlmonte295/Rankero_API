const express = require('express');
const verifyToken = require('../middleware/verify-token');
const Rank = require('../models/rank');
const router = express.Router();

// GET /ranks - Get all ranks
router.get('/', async (req, res) => {
  try {
    const { search, sortBy, page = 1, limit = 10 } = req.query;

    let query = {};
    if (search) {
      // Create a case-insensitive regex for searching title and description
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      };
    }

    let sortQuery = { createdAt: -1 }; // Default sort: newest first
    if (sortBy === 'upvotes') {
      // To sort by upvotes, we use the aggregation pipeline to calculate the size of the upvotes array.
      const ranks = await Rank.aggregate([
        { $match: query },
        { $addFields: { upvoteCount: { $size: '$upvotes' } } },
        { $sort: { upvoteCount: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: parseInt(limit) },
      ]);
      // We need to populate the author manually after aggregation
      await Rank.populate(ranks, { path: 'author', select: 'username' });
      return res.status(200).json(ranks);
    }

    // Standard find query for other sorting methods
    const ranks = await Rank.find(query)
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
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
        await newRank.populate('author', 'username');
        res.status(201).json(newRank);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

// GET /ranks/:id - Get a single rank by ID
router.get('/:rankId', async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.rankId)
      .populate('author', 'username')
      .populate('comments.author', 'username');
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
    if (!rank) return res.status(404).json({ err: 'Rank not found.' });
    
    if (!rank.author.equals(req.user._id)) {
      return res.status(403).json({ err: 'Unauthorized to update this rank.' });
    }
    const updatedRank = await Rank.findByIdAndUpdate(
      req.params.rankId,
      req.body,
      { new: true }
    );

    await updatedRank.populate('author', 'username');
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
    if (!rank) return res.status(404).json({ err: 'Rank not found.' });

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
    if (!rank) return res.status(404).json({ err: 'Rank not found.' });

    const userId = req.user._id;
    rank.downvotes.pull(userId);

    const upvoteIndex = rank.upvotes.indexOf(userId);
    if (upvoteIndex === -1) {
      rank.upvotes.push(userId);
    } else {
      rank.upvotes.pull(userId);
    }

    await rank.save();
    await rank.populate('author', 'username');
    await rank.populate('comments.author', 'username');
    res.status(200).json(rank);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.post('/:rankId/downvote', verifyToken, async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.rankId);
    if (!rank) return res.status(404).json({ err: 'Rank not found.' });

    const userId = req.user._id;
    rank.upvotes.pull(userId);

    const downvoteIndex = rank.downvotes.indexOf(userId);
    if (downvoteIndex === -1) {
      rank.downvotes.push(userId);
    } else {
      rank.downvotes.pull(userId);
    }

    await rank.save();
    await rank.populate('author', 'username');
    await rank.populate('comments.author', 'username');
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

router.put('/:rankId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.rankId);
    if (!rank) return res.status(404).json({ err: 'Rank not found.' });

    const comment = rank.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ err: 'Comment not found.' });

    if (!comment.author.equals(req.user._id)) {
      return res
        .status(403)
        .json({ err: 'Unauthorized to update this comment.' });
    }

    comment.text = req.body.text;
    await rank.save();
    await rank.populate('comments.author', 'username');
    res.status(200).json(rank);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.delete('/:rankId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.rankId);
    if (!rank) return res.status(404).json({ err: 'Rank not found.' });

    const comment = rank.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ err: 'Comment not found.' });

    if (!comment.author.equals(req.user._id)) {
      return res
        .status(403)
        .json({ err: 'Unauthorized to delete this comment.' });
    }

    comment.deleteOne();
    await rank.save();
    await rank.populate('comments.author', 'username');
    res.status(200).json(rank);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
