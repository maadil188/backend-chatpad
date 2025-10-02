const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
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
  value: {
    type: Number,
    required: [true, 'Rating value is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  review: {
    type: String,
    maxlength: [1000, 'Review cannot exceed 1000 characters'],
    default: ''
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure user can only rate each story once
ratingSchema.index({ user: 1, story: 1 }, { unique: true });

// Post-save and post-remove middleware to update story average rating
ratingSchema.post(['save', 'remove'], async function() {
  const Story = mongoose.model('Story');
  const story = await Story.findById(this.story);
  if (story) {
    await story.calculateAverageRating();
  }
});

// Static method to get story ratings with reviews
ratingSchema.statics.getStoryRatings = function(storyId, limit = 20, skip = 0) {
  return this.find({ story: storyId, review: { $ne: '' } })
    .populate('user', 'username fullName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get user's rating for a story
ratingSchema.statics.getUserRating = function(userId, storyId) {
  return this.findOne({ user: userId, story: storyId });
};

// Static method to get rating distribution
ratingSchema.statics.getRatingDistribution = async function(storyId) {
  const distribution = await this.aggregate([
    { $match: { story: mongoose.Types.ObjectId(storyId) } },
    { $group: { _id: '$value', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  
  // Initialize all ratings to 0
  const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach(item => {
    result[item._id] = item.count;
  });
  
  const total = Object.values(result).reduce((sum, count) => sum + count, 0);
  
  return {
    distribution: result,
    total,
    percentages: {
      1: total > 0 ? Math.round((result[1] / total) * 100) : 0,
      2: total > 0 ? Math.round((result[2] / total) * 100) : 0,
      3: total > 0 ? Math.round((result[3] / total) * 100) : 0,
      4: total > 0 ? Math.round((result[4] / total) * 100) : 0,
      5: total > 0 ? Math.round((result[5] / total) * 100) : 0
    }
  };
};

// Indexes for better query performance
ratingSchema.index({ story: 1, value: 1 });
ratingSchema.index({ user: 1 });
ratingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Rating', ratingSchema);