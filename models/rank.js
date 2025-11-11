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
    votes: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        default: [],
    },
    score: {
        type: Number,
        default: 0,
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

const rankSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
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
  list: [listItemSchema],
  upvotes: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [] // Add this default value
  },
  downvotes: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [] // And add this default value
  },
  comments: [commentSchema],
}, {
  timestamps: true,
});

// Add a virtual field for the overall score
rankSchema.virtual('score').get(function() {
    // Ensure upvotes and downvotes are treated as empty arrays if they don't exist
    const upvotes = this.upvotes || [];
    const downvotes = this.downvotes || [];
    return upvotes.length - downvotes.length;
});

// Ensure virtuals are included when converting to JSON or object
rankSchema.set('toJSON', { virtuals: true });
rankSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Rank', rankSchema);
