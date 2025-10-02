const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Story title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Story description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  coverImage: {
    type: String,
    default: null
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    enum: [
      'Romance', 'Fantasy', 'Mystery', 'Thriller', 'Horror', 'Adventure',
      'Sci-Fi', 'Drama', 'Comedy', 'Action', 'Historical', 'Young Adult',
      'Poetry', 'Non-Fiction', 'Biography', 'Other'
    ]
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'other']
  },
  status: {
    type: String,
    enum: ['draft', 'ongoing', 'completed', 'on-hold', 'discontinued'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'premium'],
    default: 'public'
  },
  ageRating: {
    type: String,
    enum: ['everyone', 'teen', 'mature'],
    default: 'everyone'
  },
  chaptersCount: {
    type: Number,
    default: 0
  },
  totalViews: {
    type: Number,
    default: 0
  },
  totalReads: {
    type: Number,
    default: 0
  },
  totalLikes: {
    type: Number,
    default: 0
  },
  totalComments: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  readingTime: {
    type: Number,
    default: 0 // in minutes
  },
  warnings: [{
    type: String,
    enum: ['violence', 'mature-content', 'strong-language', 'sensitive-topics']
  }],
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    estimatedReadingTime: {
      type: Number,
      default: 0
    },
    lastChapterDate: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for story chapters
storySchema.virtual('chapters', {
  ref: 'Chapter',
  localField: '_id',
  foreignField: 'story',
  options: { sort: { chapterNumber: 1 } }
});

// Virtual for story likes
storySchema.virtual('likes', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'story'
});

// Virtual for story comments
storySchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'story'
});

// Virtual for story ratings
storySchema.virtual('ratings', {
  ref: 'Rating',
  localField: '_id',
  foreignField: 'story'
});

// Pre-save middleware to update publishedAt when status changes to published
storySchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'draft' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  if (this.isModified('status') && this.status === 'completed') {
    this.isCompleted = true;
  }
  
  this.lastUpdated = new Date();
  next();
});

// Method to increment view count
storySchema.methods.incrementViews = function() {
  this.totalViews += 1;
  return this.save();
};

// Method to increment read count
storySchema.methods.incrementReads = function() {
  this.totalReads += 1;
  return this.save();
};

// Method to update reading time estimate
storySchema.methods.updateReadingTime = function() {
  // Assuming average reading speed of 200 words per minute
  const wordsPerMinute = 200;
  this.readingTime = Math.ceil(this.metadata.wordCount / wordsPerMinute);
  this.metadata.estimatedReadingTime = this.readingTime;
  return this.save();
};

// Method to calculate average rating
storySchema.methods.calculateAverageRating = async function() {
  const Rating = mongoose.model('Rating');
  const ratings = await Rating.find({ story: this._id });
  
  if (ratings.length === 0) {
    this.averageRating = 0;
    this.ratingCount = 0;
  } else {
    const sum = ratings.reduce((acc, rating) => acc + rating.value, 0);
    this.averageRating = Math.round((sum / ratings.length) * 10) / 10;
    this.ratingCount = ratings.length;
  }
  
  return this.save();
};

// Static method to get trending stories
storySchema.statics.getTrending = function(limit = 10) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return this.find({
    status: { $ne: 'draft' },
    visibility: 'public',
    publishedAt: { $gte: oneWeekAgo }
  })
  .sort({ totalViews: -1, totalLikes: -1 })
  .limit(limit)
  .populate('author', 'username fullName profilePicture');
};

// Static method to get featured stories
storySchema.statics.getFeatured = function(limit = 5) {
  return this.find({
    isFeatured: true,
    status: { $ne: 'draft' },
    visibility: 'public'
  })
  .sort({ publishedAt: -1 })
  .limit(limit)
  .populate('author', 'username fullName profilePicture');
};

// Indexes for better query performance
storySchema.index({ author: 1 });
storySchema.index({ genre: 1 });
storySchema.index({ tags: 1 });
storySchema.index({ status: 1 });
storySchema.index({ visibility: 1 });
storySchema.index({ publishedAt: -1 });
storySchema.index({ totalViews: -1 });
storySchema.index({ totalLikes: -1 });
storySchema.index({ averageRating: -1 });
storySchema.index({ isFeatured: 1 });
storySchema.index({ 'metadata.wordCount': -1 });

// Compound indexes
storySchema.index({ genre: 1, status: 1, visibility: 1 });
storySchema.index({ author: 1, status: 1 });
storySchema.index({ publishedAt: -1, totalViews: -1 });

module.exports = mongoose.model('Story', storySchema);