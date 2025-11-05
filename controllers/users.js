const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Rank = require('../models/rank');

// GET /users - Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

// GET /users/:userId/ranks - Get all ranks for a specific user
router.get('/:userId/ranks', async (req, res) => {
    try {
        // Find all ranks where the author matches the userId in the URL
        const userRanks = await Rank.find({ author: req.params.userId })
            .sort({ createdAt: -1 })
            .populate('author', 'username');
        res.status(200).json(userRanks);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

module.exports = router;
