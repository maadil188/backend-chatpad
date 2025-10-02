const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    minlength: [1, 'Comment must have at least 1 character']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
    required: [true, 'Story is required']
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    default: null // null means comment is on story, not specific chapter
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null // for reply comments
  },
  likes: {
    type: Number,
    default: 0
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  paragraphIndex: {
    type: Number,
    default: null // for inline comments on specific paragraphs
  },
  textSelection: {
    start: {
      type: Number,
      default: null
    },
    end: {
      type: Number,
      default: null
    },
    selectedText: {
      type: String,
      default: null
    }
  },
  isSpam: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for comment likes
commentSchema.virtual('likedBy', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'comment'
});

// Virtual for nested replies
commentSchema.virtual('nestedReplies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  options: { sort: { createdAt: 1 } }
});

// Pre-save middleware
commentSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

// Post-save middleware to update counters
commentSchema.post('save', async function() {
  if (this.isNew && !this.isDeleted) {
    // Update story comment count
    const Story = mongoose.model('Story');
    await Story.findByIdAndUpdate(this.story, { $inc: { totalComments: 1 } });
    
    // Update chapter comment count if chapter-specific comment
    if (this.chapter) {
      const Chapter = mongoose.model('Chapter');
      await Chapter.findByIdAndUpdate(this.chapter, { $inc: { commentsCount: 1 } });
    }
    
    // Add to parent comment's replies if it's a reply
    if (this.parentComment) {
      await mongoose.model('Comment').findByIdAndUpdate(
        this.parentComment,
        { $push: { replies: this._id } }
      );
    }
  }
});

// Post-remove middleware to update counters
commentSchema.post('remove', async function() {
  // Update story comment count
  const Story = mongoose.model('Story');
  await Story.findByIdAndUpdate(this.story, { $inc: { totalComments: -1 } });
  
  // Update chapter comment count if chapter-specific comment
  if (this.chapter) {
    const Chapter = mongoose.model('Chapter');
    await Chapter.findByIdAndUpdate(this.chapter, { $inc: { commentsCount: -1 } });
  }
  
  // Remove from parent comment's replies if it's a reply
  if (this.parentComment) {
    await mongoose.model('Comment').findByIdAndUpdate(
      this.parentComment,
      { $pull: { replies: this._id } }
    );
  }
});

// Method to soft delete comment
commentSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = '[This comment has been deleted]';
  return this.save();
};

// Method to restore deleted comment
commentSchema.methods.restore = function(originalContent) {
  this.isDeleted = false;
  this.deletedAt = null;
  this.content = originalContent;
  return this.save();
};

// Method to increment likes
commentSchema.methods.incrementLikes = function() {
  this.likes += 1;
  return this.save();
};

// Method to decrement likes
commentSchema.methods.decrementLikes = function() {
  this.likes = Math.max(0, this.likes - 1);
  return this.save();
};

// Static method to get comments with replies
commentSchema.statics.getCommentsWithReplies = function(storyId, chapterId = null, limit = 20, skip = 0) {
  const query = {
    story: storyId,
    parentComment: null, // Only get top-level comments
    isDeleted: false
  };
  
  if (chapterId) {
    query.chapter = chapterId;
  } else {
    query.chapter = null; // Story-level comments
  }
  
  return this.find(query)
    .populate('user', 'username fullName profilePicture')
    .populate({
      path: 'nestedReplies',
      populate: {
        path: 'user',
        select: 'username fullName profilePicture'
      },
      match: { isDeleted: false },
      options: { sort: { createdAt: 1 }, limit: 5 } // Limit nested replies
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Indexes for better query performance
commentSchema.index({ story: 1, chapter: 1 });
commentSchema.index({ user: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ likes: -1 });
commentSchema.index({ isDeleted: 1 });
commentSchema.index({ story: 1, createdAt: -1 });
commentSchema.index({ chapter: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);