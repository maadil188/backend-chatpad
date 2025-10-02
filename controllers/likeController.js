const Like = require('../models/Like');
const Story = require('../models/Story');
const Chapter = require('../models/Chapter');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

// @desc    Toggle like on story/chapter/comment
// @route   POST /api/likes/:targetType/:targetId
// @access  Private
const toggleLike = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.params;
    const userId = req.userId;
    
    // Validate target type
    if (!['story', 'chapter', 'comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type. Must be story, chapter, or comment'
      });
    }
    
    // Check if target exists
    let target;
    let targetOwnerId;
    
    switch (targetType) {
      case 'story':
        target = await Story.findById(targetId).populate('author');
        targetOwnerId = target?.author._id;
        break;
      case 'chapter':
        target = await Chapter.findById(targetId).populate({
          path: 'story',
          populate: { path: 'author' }
        });
        targetOwnerId = target?.story.author._id;
        break;
      case 'comment':
        target = await Comment.findById(targetId).populate('user');
        targetOwnerId = target?.user._id;
        break;
    }
    
    if (!target) {
      return res.status(404).json({
        success: false,
        message: `${targetType} not found`
      });
    }
    
    // Toggle like
    const result = await Like.toggleLike(userId, targetId, targetType);
    
    // Create notification if liked (not unliked) and not own content
    if (result.liked && targetOwnerId && targetOwnerId.toString() !== userId) {
      await Notification.createLikeNotification(
        userId,
        targetId,
        targetType,
        targetOwnerId
      );
    }
    
    res.json({
      success: true,
      message: result.message,
      liked: result.liked
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's liked stories
// @route   GET /api/likes/stories
// @access  Private
const getUserLikedStories = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const likedStories = await Like.getUserLikedStories(
      req.userId,
      parseInt(limit),
      skip
    );
    
    const total = await Like.countDocuments({
      user: req.userId,
      type: 'story'
    });
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: {
        stories: likedStories.map(like => like.story),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if user liked a target
// @route   GET /api/likes/check/:targetType/:targetId
// @access  Private
const checkLikeStatus = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.params;
    const userId = req.userId;
    
    if (!['story', 'chapter', 'comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type'
      });
    }
    
    const isLiked = await Like.isLikedBy(userId, targetId, targetType);
    
    res.json({
      success: true,
      data: {
        isLiked: !!isLiked
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleLike,
  getUserLikedStories,
  checkLikeStatus
};