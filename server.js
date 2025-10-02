const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const storyRoutes = require('./routes/stories');
const chapterRoutes = require('./routes/chapters');
const commentRoutes = require('./routes/comments');
const likeRoutes = require('./routes/likes');
const followRoutes = require('./routes/follows');
const notificationRoutes = require('./routes/notifications');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { specs, swaggerUi } = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Storytelling Platform API Documentation"
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/storytelling-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Storytelling API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '📚 Welcome to Storytelling Platform API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      stories: '/api/stories',
      chapters: '/api/chapters',
      comments: '/api/comments',
      likes: '/api/likes',
      follows: '/api/follows',
      notifications: '/api/notifications'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/notifications', notificationRoutes);

// Handle 404 routes - Fixed the route pattern
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📖 Storytelling API is ready at http://localhost:${PORT}`);
  console.log(`📋 API Documentation available at http://localhost:${PORT}/api-docs`);
});

module.exports = app;