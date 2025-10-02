const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Storytelling Platform API',
      version: '1.0.0',
      description: 'A comprehensive API for a Wattpad-style storytelling platform where users can read, write, and share stories.',
      contact: {
        name: 'API Support',
        email: 'support@storytelling-platform.com'
      },
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.storytelling-platform.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'email', 'fullName'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Unique username',
              minLength: 3,
              maxLength: 30
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            fullName: {
              type: 'string',
              description: 'User full name',
              maxLength: 50
            },
            bio: {
              type: 'string',
              description: 'User biography',
              maxLength: 500
            },
            profilePicture: {
              type: 'string',
              description: 'Profile picture URL'
            },
            role: {
              type: 'string',
              enum: ['reader', 'writer', 'both', 'admin'],
              description: 'User role'
            },
            followersCount: {
              type: 'number',
              description: 'Number of followers'
            },
            followingCount: {
              type: 'number',
              description: 'Number of users being followed'
            },
            storiesCount: {
              type: 'number',
              description: 'Number of stories created'
            },
            joinedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date'
            }
          }
        },
        Story: {
          type: 'object',
          required: ['title', 'description', 'genre', 'author'],
          properties: {
            _id: {
              type: 'string',
              description: 'Story ID'
            },
            title: {
              type: 'string',
              description: 'Story title',
              maxLength: 200
            },
            description: {
              type: 'string',
              description: 'Story description',
              maxLength: 1000
            },
            coverImage: {
              type: 'string',
              description: 'Cover image URL'
            },
            author: {
              $ref: '#/components/schemas/User'
            },
            genre: {
              type: 'string',
              enum: ['Romance', 'Fantasy', 'Mystery', 'Thriller', 'Horror', 'Adventure', 'Sci-Fi', 'Drama', 'Comedy', 'Action', 'Historical', 'Young Adult', 'Poetry', 'Non-Fiction', 'Biography', 'Other'],
              description: 'Story genre'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Story tags'
            },
            language: {
              type: 'string',
              enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'other'],
              default: 'en',
              description: 'Story language'
            },
            status: {
              type: 'string',
              enum: ['draft', 'ongoing', 'completed', 'on-hold', 'discontinued'],
              default: 'draft',
              description: 'Story status'
            },
            visibility: {
              type: 'string',
              enum: ['public', 'private', 'premium'],
              default: 'public',
              description: 'Story visibility'
            },
            ageRating: {
              type: 'string',
              enum: ['everyone', 'teen', 'mature'],
              default: 'everyone',
              description: 'Age rating'
            },
            chaptersCount: {
              type: 'number',
              description: 'Number of chapters'
            },
            totalViews: {
              type: 'number',
              description: 'Total views'
            },
            totalLikes: {
              type: 'number',
              description: 'Total likes'
            },
            totalComments: {
              type: 'number',
              description: 'Total comments'
            },
            averageRating: {
              type: 'number',
              minimum: 0,
              maximum: 5,
              description: 'Average rating'
            },
            publishedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Publication date'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            }
          }
        },
        Chapter: {
          type: 'object',
          required: ['title', 'content', 'story', 'chapterNumber'],
          properties: {
            _id: {
              type: 'string',
              description: 'Chapter ID'
            },
            title: {
              type: 'string',
              description: 'Chapter title',
              maxLength: 200
            },
            content: {
              type: 'string',
              description: 'Chapter content',
              minLength: 100
            },
            story: {
              type: 'string',
              description: 'Story ID'
            },
            chapterNumber: {
              type: 'number',
              minimum: 1,
              description: 'Chapter number'
            },
            wordCount: {
              type: 'number',
              description: 'Word count'
            },
            readingTime: {
              type: 'number',
              description: 'Estimated reading time in minutes'
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'scheduled'],
              default: 'draft',
              description: 'Chapter status'
            },
            views: {
              type: 'number',
              description: 'Chapter views'
            },
            likes: {
              type: 'number',
              description: 'Chapter likes'
            },
            publishedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Publication date'
            }
          }
        },
        Comment: {
          type: 'object',
          required: ['content', 'user', 'story'],
          properties: {
            _id: {
              type: 'string',
              description: 'Comment ID'
            },
            content: {
              type: 'string',
              description: 'Comment content',
              maxLength: 1000
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            story: {
              type: 'string',
              description: 'Story ID'
            },
            chapter: {
              type: 'string',
              description: 'Chapter ID (optional)'
            },
            parentComment: {
              type: 'string',
              description: 'Parent comment ID for replies'
            },
            likes: {
              type: 'number',
              description: 'Comment likes'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Items per page'
            },
            total: {
              type: 'integer',
              description: 'Total number of items'
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages'
            },
            hasNext: {
              type: 'boolean',
              description: 'Whether there is a next page'
            },
            hasPrev: {
              type: 'boolean',
              description: 'Whether there is a previous page'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js', './controllers/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi
};