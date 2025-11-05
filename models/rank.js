const mongoose = require('mongoose') ;

const listItemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        // Not required, as users may not want to add an image for every item.
    },
});

const commentSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const rankSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            enum: ["Games", "Movies", "Television", "Music", "Books", "Food", "Sports", "Travel", "Other"]
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        list: {
            type: [listItemSchema],
            required: true,
            validate: [
                (val) => val.length > 0 && val.length <= 20,
                'The list must have between 1 and 20 items.'
            ]
        },
        upvotes: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            default: [],
        },
        downvotes: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            default: [],
        },
        comments: [commentSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Rank', rankSchema);