# 📚 Storytelling Platform Backend

A comprehensive Node.js/Express backend API for a Wattpad-style storytelling platform where users
can read, write, and share stories.

## 🚀 Features

### Core Functionality

- **User Management**: Registration, authentication, profile management
- **Story Creation**: Rich story creation with chapters, genres, and tags
- **Reading Experience**: Story discovery, bookmarking, offline reading support
- **Social Features**: Following, likes, comments, and notifications
- **Content Management**: Story categorization, search, and filtering
- **Analytics**: Author insights and story performance metrics

### Technical Features

- **RESTful API** with comprehensive documentation
- **JWT Authentication** with role-based access control
- **File Upload** support for profile pictures and cover images
- **Real-time Features** ready (Socket.io integrated)
- **Input Validation** and error handling
- **Rate Limiting** and security middleware
- **Swagger Documentation** for all endpoints

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Documentation**: Swagger UI
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js 18.x or higher
- MongoDB 5.x or higher
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd storytelling-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/storytelling-app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/jpg,image/png,image/gif

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On Windows (if MongoDB is installed as a service)
net start MongoDB

# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod
```

### 5. Run the application

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:5000`

## 📚 API Documentation

Once the server is running, you can access the interactive API documentation at:

- **Swagger UI**: `http://localhost:5000/api-docs`
- **API Root**: `http://localhost:5000/api/health`

## 🏗️ Project Structure

```
storytelling-backend/
├── config/
│   └── swagger.js              # Swagger configuration
├── controllers/
│   ├── authController.js       # Authentication logic
│   ├── storyController.js      # Story management
│   └── likeController.js       # Like functionality
├── middleware/
│   ├── auth.js                 # Authentication middleware
│   ├── errorHandler.js         # Error handling
│   ├── upload.js               # File upload handling
│   └── validation.js           # Input validation
├── models/
│   ├── User.js                 # User schema
│   ├── Story.js                # Story schema
│   ├── Chapter.js              # Chapter schema
│   ├── Comment.js              # Comment schema
│   ├── Like.js                 # Like schema
│   ├── Follow.js               # Follow relationship schema
│   ├── Notification.js         # Notification schema
│   └── Rating.js               # Rating schema
├── routes/
│   ├── auth.js                 # Authentication routes
│   ├── stories.js              # Story routes
│   ├── likes.js                # Like routes
│   ├── users.js                # User routes
│   ├── chapters.js             # Chapter routes
│   ├── comments.js             # Comment routes
│   ├── follows.js              # Follow routes
│   └── notifications.js        # Notification routes
├── uploads/                    # File uploads directory
│   ├── profiles/               # Profile pictures
│   ├── covers/                 # Story cover images
│   └── misc/                   # Miscellaneous files
├── utils/                      # Utility functions
├── .env                        # Environment variables
├── server.js                   # Main application file
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization
header:

```bash
Authorization: Bearer <your-jwt-token>
```

### User Roles

- **Reader**: Can read stories, comment, and like
- **Writer**: Can create and manage stories + reader permissions
- **Both**: Full reader and writer permissions (default)
- **Admin**: Full system access

## 📊 Database Schema

### Core Models

- **User**: User accounts and profiles
- **Story**: Main story information
- **Chapter**: Individual story chapters
- **Comment**: User comments on stories/chapters
- **Like**: Like relationships
- **Follow**: User following relationships
- **Notification**: System notifications
- **Rating**: Story ratings (1-5 stars)

## 🔧 API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `POST /refresh` - Refresh JWT token
- `POST /logout` - User logout
- `DELETE /deactivate` - Deactivate account

### Stories (`/api/stories`)

- `GET /` - Get stories with filtering
- `GET /trending` - Get trending stories
- `GET /featured` - Get featured stories
- `GET /:id` - Get single story
- `POST /` - Create new story
- `PUT /:id` - Update story
- `DELETE /:id` - Delete story
- `GET /user/:userId` - Get user's stories
- `GET /:id/analytics` - Get story analytics

### Likes (`/api/likes`)

- `POST /:targetType/:targetId` - Toggle like
- `GET /stories` - Get user's liked stories
- `GET /check/:targetType/:targetId` - Check like status

### Additional Endpoints

- Chapters, Comments, Follows, Notifications, Users

## 🔍 Search & Filtering

Stories can be filtered by:

- **Genre**: Romance, Fantasy, Mystery, etc.
- **Language**: English, Spanish, French, etc.
- **Status**: Draft, Ongoing, Completed
- **Tags**: Custom story tags
- **Sort**: Newest, Popular, Trending, Rating

## 📁 File Upload

Supports image uploads for:

- Profile pictures (max 5MB)
- Story cover images (max 5MB)
- Supported formats: JPEG, JPG, PNG, GIF

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Sanitize user input
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication
- **File Upload Security**: Type and size validation

## 🚦 Error Handling

Comprehensive error handling with:

- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

All errors return JSON with `success: false` and descriptive messages.

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Check API health
curl http://localhost:5000/api/health
```

## 📊 Performance Features

- **Indexing**: Optimized database queries
- **Pagination**: Efficient data loading
- **Caching Ready**: Redis integration possible
- **File Optimization**: Image processing ready
- **Rate Limiting**: Prevent API abuse

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-secret-key
FRONTEND_URL=https://your-frontend-domain.com
```

### Docker Support (Optional)

```dockerfile
# Add Dockerfile for containerization
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the API documentation at `/api-docs`
- Review the error messages in responses
- Check MongoDB connection and environment variables

## 🔮 Future Enhancements

- [ ] Real-time chat between users
- [ ] Advanced analytics dashboard
- [ ] Content recommendation engine
- [ ] Multi-language support
- [ ] Push notifications
- [ ] Payment integration for premium features
- [ ] Story collaboration features
- [ ] Advanced search with Elasticsearch
- [ ] Automated content moderation
- [ ] Mobile app API optimization

---

**Happy Coding! 📖✨**