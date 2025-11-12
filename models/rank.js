const mongoose = require('mongoose') ;



const listItemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
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
    default: [] 
  },
  downvotes: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [] 
  },
  comments: [commentSchema],
}, {
  timestamps: true,
});


rankSchema.virtual('score').get(function() {
    const upvotes = this.upvotes || [];
    const downvotes = this.downvotes || [];
    return upvotes.length - downvotes.length;
});


rankSchema.set('toJSON', { virtuals: true });
rankSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Rank', rankSchema);
