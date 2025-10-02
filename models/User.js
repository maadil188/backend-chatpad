const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [50, 'Full name cannot exceed 50 characters']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  profilePicture: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['reader', 'writer', 'both', 'admin'],
    default: 'both'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followersCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  storiesCount: {
    type: Number,
    default: 0
  },
  readingList: [{
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'en'
    },
    genres: [{
      type: String
    }]
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  totalReads: {
    type: Number,
    default: 0
  },
  totalLikes: {
    type: Number,
    default: 0
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user's stories
userSchema.virtual('stories', {
  ref: 'Story',
  localField: '_id',
  foreignField: 'author'
});

// Virtual for user's comments
userSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'user'
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last active timestamp
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Indexes for better query performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'preferences.genres': 1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ followersCount: -1 });
userSchema.index({ totalReads: -1 });

module.exports = mongoose.model('User', userSchema);