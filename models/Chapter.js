const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Chapter title is required'],
    trim: true,
    maxlength: [200, 'Chapter title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Chapter content is required'],
    minlength: [100, 'Chapter content must be at least 100 characters long']
  },
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
    required: [true, 'Story reference is required']
  },
  chapterNumber: {
    type: Number,
    required: [true, 'Chapter number is required'],
    min: [1, 'Chapter number must be at least 1']
  },
  wordCount: {
    type: Number,
    default: 0
  },
  readingTime: {
    type: Number,
    default: 0 // in minutes
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft'
  },
  publishedAt: {
    type: Date,
    default: null
  },
  scheduledFor: {
    type: Date,
    default: null
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  authorNote: {
    type: String,
    maxlength: [500, 'Author note cannot exceed 500 characters'],
    default: ''
  },
  isPreview: {
    type: Boolean,
    default: false
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  metadata: {
    characterCount: {
      type: Number,
      default: 0
    },
    paragraphCount: {
      type: Number,
      default: 0
    },
    estimatedReadingTime: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for chapter comments
chapterSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'chapter',
  options: { sort: { createdAt: -1 } }
});

// Pre-save middleware to calculate word count and reading time
chapterSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Calculate word count
    this.wordCount = this.content.trim().split(/\s+/).length;
    
    // Calculate character count
    this.metadata.characterCount = this.content.length;
    
    // Calculate paragraph count
    this.metadata.paragraphCount = this.content.split(/\n\s*\n/).length;
    
    // Calculate reading time (assuming 200 words per minute)
    const wordsPerMinute = 200;
    this.readingTime = Math.ceil(this.wordCount / wordsPerMinute);
    this.metadata.estimatedReadingTime = this.readingTime;
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Post-save middleware to update story metadata
chapterSchema.post('save', async function() {
  if (this.isModified('content') || this.isModified('status')) {
    const Story = mongoose.model('Story');
    const story = await Story.findById(this.story);
    
    if (story) {
      // Update story's chapter count
      const publishedChapters = await mongoose.model('Chapter').countDocuments({
        story: this.story,
        status: 'published'
      });
      
      story.chaptersCount = publishedChapters;
      
      // Update story's total word count
      const chapters = await mongoose.model('Chapter').find({
        story: this.story,
        status: 'published'
      });
      
      const totalWordCount = chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);
      story.metadata.wordCount = totalWordCount;
      
      // Update story's last chapter date
      if (this.status === 'published') {
        story.metadata.lastChapterDate = this.publishedAt || new Date();
      }
      
      // Update story's reading time
      await story.updateReadingTime();
    }
  }
});

// Method to increment view count
chapterSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to get next chapter
chapterSchema.methods.getNextChapter = function() {
  return mongoose.model('Chapter').findOne({
    story: this.story,
    chapterNumber: this.chapterNumber + 1,
    status: 'published'
  });
};

// Method to get previous chapter
chapterSchema.methods.getPreviousChapter = function() {
  return mongoose.model('Chapter').findOne({
    story: this.story,
    chapterNumber: this.chapterNumber - 1,
    status: 'published'
  });
};

// Static method to get chapter with navigation
chapterSchema.statics.getChapterWithNavigation = async function(chapterId, userId = null) {
  const chapter = await this.findById(chapterId)
    .populate('story', 'title author status visibility isPremium')
    .populate({
      path: 'story',
      populate: {
        path: 'author',
        select: 'username fullName profilePicture'
      }
    });
  
  if (!chapter) return null;
  
  const [nextChapter, prevChapter] = await Promise.all([
    chapter.getNextChapter(),
    chapter.getPreviousChapter()
  ]);
  
  return {
    chapter,
    navigation: {
      next: nextChapter ? { _id: nextChapter._id, title: nextChapter.title, chapterNumber: nextChapter.chapterNumber } : null,
      previous: prevChapter ? { _id: prevChapter._id, title: prevChapter.title, chapterNumber: prevChapter.chapterNumber } : null
    }
  };
};

// Compound indexes for better query performance
chapterSchema.index({ story: 1, chapterNumber: 1 }, { unique: true });
chapterSchema.index({ story: 1, status: 1 });
chapterSchema.index({ publishedAt: -1 });
chapterSchema.index({ views: -1 });
chapterSchema.index({ likes: -1 });
chapterSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model('Chapter', chapterSchema);