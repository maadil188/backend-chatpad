const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Follower is required']
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Following user is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure user cannot follow themselves and cannot follow same user twice
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Validate that user cannot follow themselves
followSchema.pre('save', function(next) {
  if (this.follower.toString() === this.following.toString()) {
    return next(new Error('User cannot follow themselves'));
  }
  next();
});

// Post-save middleware to update follower/following counts
followSchema.post('save', async function() {
  if (this.isActive) {
    const User = mongoose.model('User');
    
    // Update follower's following count
    await User.findByIdAndUpdate(this.follower, { 
      $inc: { followingCount: 1 },
      $addToSet: { following: this.following }
    });
    
    // Update following user's followers count
    await User.findByIdAndUpdate(this.following, { 
      $inc: { followersCount: 1 },
      $addToSet: { followers: this.follower }
    });
  }
});

// Post-remove middleware to update follower/following counts
followSchema.post('remove', async function() {
  const User = mongoose.model('User');
  
  // Update follower's following count
  await User.findByIdAndUpdate(this.follower, { 
    $inc: { followingCount: -1 },
    $pull: { following: this.following }
  });
  
  // Update following user's followers count
  await User.findByIdAndUpdate(this.following, { 
    $inc: { followersCount: -1 },
    $pull: { followers: this.follower }
  });
});

// Static method to toggle follow
followSchema.statics.toggleFollow = async function(followerId, followingId) {
  if (followerId === followingId) {
    throw new Error('User cannot follow themselves');
  }
  
  const existingFollow = await this.findOne({
    follower: followerId,
    following: followingId
  });
  
  if (existingFollow) {
    // Unfollow
    await existingFollow.remove();
    return { following: false, message: 'Unfollowed successfully' };
  } else {
    // Follow
    const newFollow = new this({
      follower: followerId,
      following: followingId
    });
    await newFollow.save();
    return { following: true, message: 'Followed successfully' };
  }
};

// Static method to check if user is following another user
followSchema.statics.isFollowing = function(followerId, followingId) {
  return this.exists({
    follower: followerId,
    following: followingId,
    isActive: true
  });
};

// Static method to get user's followers
followSchema.statics.getFollowers = function(userId, limit = 20, skip = 0) {
  return this.find({ following: userId, isActive: true })
    .populate('follower', 'username fullName profilePicture followersCount')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get users that a user is following
followSchema.statics.getFollowing = function(userId, limit = 20, skip = 0) {
  return this.find({ follower: userId, isActive: true })
    .populate('following', 'username fullName profilePicture followersCount')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get mutual follows (friends)
followSchema.statics.getMutualFollows = async function(userId) {
  const following = await this.find({ follower: userId }).select('following');
  const followingIds = following.map(f => f.following);
  
  return this.find({
    follower: { $in: followingIds },
    following: userId
  })
  .populate('follower', 'username fullName profilePicture followersCount')
  .sort({ createdAt: -1 });
};

// Static method to get suggested users to follow
followSchema.statics.getSuggestedUsers = async function(userId, limit = 10) {
  const User = mongoose.model('User');
  
  // Get users that current user's followers are following
  const userFollowers = await this.find({ following: userId }).select('follower');
  const followerIds = userFollowers.map(f => f.follower);
  
  if (followerIds.length === 0) {
    // If no followers, suggest popular users
    return User.find({ 
      _id: { $ne: userId },
      isActive: true 
    })
    .sort({ followersCount: -1 })
    .limit(limit)
    .select('username fullName profilePicture followersCount');
  }
  
  const suggested = await this.find({ 
    follower: { $in: followerIds },
    following: { $ne: userId }
  })
  .populate('following', 'username fullName profilePicture followersCount')
  .limit(limit * 2); // Get more to filter out already following
  
  // Filter out users already followed
  const alreadyFollowing = await this.find({ follower: userId }).select('following');
  const alreadyFollowingIds = alreadyFollowing.map(f => f.following.toString());
  
  const filtered = suggested
    .filter(s => !alreadyFollowingIds.includes(s.following._id.toString()))
    .slice(0, limit);
  
  return filtered.map(s => s.following);
};

// Indexes for better query performance
followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });
followSchema.index({ createdAt: -1 });
followSchema.index({ isActive: 1 });

module.exports = mongoose.model('Follow', followSchema);