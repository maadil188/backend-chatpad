const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
    default: null
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    default: null
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  type: {
    type: String,
    enum: ['story', 'chapter', 'comment'],
    required: [true, 'Like type is required']
  }
}, {
  timestamps: true
});

// Ensure user can only like each item once
likeSchema.index({ user: 1, story: 1 }, { unique: true, sparse: true });
likeSchema.index({ user: 1, chapter: 1 }, { unique: true, sparse: true });
likeSchema.index({ user: 1, comment: 1 }, { unique: true, sparse: true });

// Validate that only one target field is set
likeSchema.pre('save', function(next) {
  const targets = [this.story, this.chapter, this.comment].filter(Boolean);
  if (targets.length !== 1) {
    return next(new Error('Like must target exactly one item (story, chapter, or comment)'));
  }
  
  // Set type based on target
  if (this.story) this.type = 'story';
  else if (this.chapter) this.type = 'chapter';
  else if (this.comment) this.type = 'comment';
  
  next();
});

// Post-save middleware to update like counts
likeSchema.post('save', async function() {
  if (this.type === 'story' && this.story) {
    const Story = mongoose.model('Story');
    await Story.findByIdAndUpdate(this.story, { $inc: { totalLikes: 1 } });
  } else if (this.type === 'chapter' && this.chapter) {
    const Chapter = mongoose.model('Chapter');
    await Chapter.findByIdAndUpdate(this.chapter, { $inc: { likes: 1 } });
  } else if (this.type === 'comment' && this.comment) {
    const Comment = mongoose.model('Comment');
    await Comment.findByIdAndUpdate(this.comment, { $inc: { likes: 1 } });
  }
});

// Post-remove middleware to update like counts
likeSchema.post('remove', async function() {
  if (this.type === 'story' && this.story) {
    const Story = mongoose.model('Story');
    await Story.findByIdAndUpdate(this.story, { $inc: { totalLikes: -1 } });
  } else if (this.type === 'chapter' && this.chapter) {
    const Chapter = mongoose.model('Chapter');
    await Chapter.findByIdAndUpdate(this.chapter, { $inc: { likes: -1 } });
  } else if (this.type === 'comment' && this.comment) {
    const Comment = mongoose.model('Comment');
    await Comment.findByIdAndUpdate(this.comment, { $inc: { likes: -1 } });
  }
});

// Static method to toggle like
likeSchema.statics.toggleLike = async function(userId, targetId, targetType) {
  const query = { user: userId };
  query[targetType] = targetId;
  
  const existingLike = await this.findOne(query);
  
  if (existingLike) {
    // Unlike
    await existingLike.remove();
    return { liked: false, message: 'Unliked successfully' };
  } else {
    // Like
    const newLike = new this({
      user: userId,
      [targetType]: targetId,
      type: targetType
    });
    await newLike.save();
    return { liked: true, message: 'Liked successfully' };
  }
};

// Static method to check if user liked an item
likeSchema.statics.isLikedBy = function(userId, targetId, targetType) {
  const query = { user: userId };
  query[targetType] = targetId;
  return this.exists(query);
};

// Static method to get user's liked stories
likeSchema.statics.getUserLikedStories = function(userId, limit = 20, skip = 0) {
  return this.find({ user: userId, type: 'story' })
    .populate({
      path: 'story',
      populate: {
        path: 'author',
        select: 'username fullName profilePicture'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Indexes for better query performance
likeSchema.index({ user: 1, type: 1 });
likeSchema.index({ story: 1 });
likeSchema.index({ chapter: 1 });
likeSchema.index({ comment: 1 });
likeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Like', likeSchema);