const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for system notifications
  },
  type: {
    type: String,
    enum: [
      'follow', 'unfollow', 'like_story', 'like_chapter', 'like_comment',
      'comment_story', 'comment_chapter', 'reply_comment', 'new_chapter',
      'story_published', 'story_featured', 'mention', 'system'
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  data: {
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  actionUrl: {
    type: String,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Mark as read method
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Check if notification is expired
notificationSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  return await notification.save();
};

// Static method to create follow notification
notificationSchema.statics.createFollowNotification = async function(followerId, followingId) {
  const User = mongoose.model('User');
  const follower = await User.findById(followerId).select('username fullName');
  
  return this.createNotification({
    recipient: followingId,
    sender: followerId,
    type: 'follow',
    title: 'New Follower',
    message: `${follower.fullName || follower.username} started following you`,
    data: { user: followerId },
    actionUrl: `/profile/${follower.username}`
  });
};

// Static method to create like notification
notificationSchema.statics.createLikeNotification = async function(userId, targetId, targetType, targetOwnerId) {
  if (userId === targetOwnerId) return; // Don't notify if user likes their own content
  
  const User = mongoose.model('User');
  const user = await User.findById(userId).select('username fullName');
  
  let title, message, actionUrl;
  const data = {};
  
  switch (targetType) {
    case 'story':
      const Story = mongoose.model('Story');
      const story = await Story.findById(targetId).select('title');
      title = 'Story Liked';
      message = `${user.fullName || user.username} liked your story "${story.title}"`;
      actionUrl = `/story/${targetId}`;
      data.story = targetId;
      break;
      
    case 'chapter':
      const Chapter = mongoose.model('Chapter');
      const chapter = await Chapter.findById(targetId).select('title').populate('story', 'title');
      title = 'Chapter Liked';
      message = `${user.fullName || user.username} liked your chapter "${chapter.title}"`;
      actionUrl = `/story/${chapter.story._id}/chapter/${targetId}`;
      data.chapter = targetId;
      data.story = chapter.story._id;
      break;
      
    case 'comment':
      title = 'Comment Liked';
      message = `${user.fullName || user.username} liked your comment`;
      data.comment = targetId;
      break;
  }
  
  return this.createNotification({
    recipient: targetOwnerId,
    sender: userId,
    type: `like_${targetType}`,
    title,
    message,
    data,
    actionUrl
  });
};

// Static method to create comment notification
notificationSchema.statics.createCommentNotification = async function(userId, storyId, chapterId = null, storyOwnerId) {
  if (userId === storyOwnerId) return; // Don't notify if user comments on their own content
  
  const User = mongoose.model('User');
  const Story = mongoose.model('Story');
  const user = await User.findById(userId).select('username fullName');
  const story = await Story.findById(storyId).select('title');
  
  let title, message, actionUrl;
  const data = { story: storyId, user: userId };
  
  if (chapterId) {
    const Chapter = mongoose.model('Chapter');
    const chapter = await Chapter.findById(chapterId).select('title');
    title = 'New Chapter Comment';
    message = `${user.fullName || user.username} commented on your chapter "${chapter.title}"`;
    actionUrl = `/story/${storyId}/chapter/${chapterId}`;
    data.chapter = chapterId;
  } else {
    title = 'New Story Comment';
    message = `${user.fullName || user.username} commented on your story "${story.title}"`;
    actionUrl = `/story/${storyId}`;
  }
  
  return this.createNotification({
    recipient: storyOwnerId,
    sender: userId,
    type: chapterId ? 'comment_chapter' : 'comment_story',
    title,
    message,
    data,
    actionUrl
  });
};

// Static method to create new chapter notification for followers
notificationSchema.statics.createNewChapterNotification = async function(authorId, storyId, chapterId) {
  const Follow = mongoose.model('Follow');
  const User = mongoose.model('User');
  const Story = mongoose.model('Story');
  const Chapter = mongoose.model('Chapter');
  
  const [author, story, chapter, followers] = await Promise.all([
    User.findById(authorId).select('username fullName'),
    Story.findById(storyId).select('title'),
    Chapter.findById(chapterId).select('title chapterNumber'),
    Follow.find({ following: authorId }).select('follower')
  ]);
  
  const notifications = followers.map(follow => ({
    recipient: follow.follower,
    sender: authorId,
    type: 'new_chapter',
    title: 'New Chapter',
    message: `${author.fullName || author.username} published Chapter ${chapter.chapterNumber}: "${chapter.title}" in "${story.title}"`,
    data: {
      story: storyId,
      chapter: chapterId,
      user: authorId
    },
    actionUrl: `/story/${storyId}/chapter/${chapterId}`
  }));
  
  return this.insertMany(notifications);
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, limit = 20, skip = 0, unreadOnly = false) {
  const query = { recipient: userId };
  if (unreadOnly) query.isRead = false;
  
  return this.find(query)
    .populate('sender', 'username fullName profilePicture')
    .populate('data.story', 'title')
    .populate('data.chapter', 'title chapterNumber')
    .populate('data.user', 'username fullName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to mark all notifications as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

// Static method to cleanup expired notifications
notificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Indexes for better query performance
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ sender: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ priority: 1 });

module.exports = mongoose.model('Notification', notificationSchema);