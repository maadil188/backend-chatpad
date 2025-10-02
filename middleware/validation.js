const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),
  
  body('role')
    .optional()
    .isIn(['reader', 'writer', 'both'])
    .withMessage('Role must be reader, writer, or both'),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const validateUserUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('role')
    .optional()
    .isIn(['reader', 'writer', 'both'])
    .withMessage('Role must be reader, writer, or both'),
  
  handleValidationErrors
];

// Story validation rules
const validateStoryCreation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('genre')
    .isIn([
      'Romance', 'Fantasy', 'Mystery', 'Thriller', 'Horror', 'Adventure',
      'Sci-Fi', 'Drama', 'Comedy', 'Action', 'Historical', 'Young Adult',
      'Poetry', 'Non-Fiction', 'Biography', 'Other'
    ])
    .withMessage('Please select a valid genre'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'other'])
    .withMessage('Please select a valid language'),
  
  body('ageRating')
    .optional()
    .isIn(['everyone', 'teen', 'mature'])
    .withMessage('Age rating must be everyone, teen, or mature'),
  
  handleValidationErrors
];

const validateStoryUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('genre')
    .optional()
    .isIn([
      'Romance', 'Fantasy', 'Mystery', 'Thriller', 'Horror', 'Adventure',
      'Sci-Fi', 'Drama', 'Comedy', 'Action', 'Historical', 'Young Adult',
      'Poetry', 'Non-Fiction', 'Biography', 'Other'
    ])
    .withMessage('Please select a valid genre'),
  
  body('status')
    .optional()
    .isIn(['draft', 'ongoing', 'completed', 'on-hold', 'discontinued'])
    .withMessage('Invalid status'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'premium'])
    .withMessage('Visibility must be public, private, or premium'),
  
  handleValidationErrors
];

// Chapter validation rules
const validateChapterCreation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Chapter title must be between 1 and 200 characters'),
  
  body('content')
    .trim()
    .isLength({ min: 100 })
    .withMessage('Chapter content must be at least 100 characters long'),
  
  body('chapterNumber')
    .isInt({ min: 1 })
    .withMessage('Chapter number must be a positive integer'),
  
  body('authorNote')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Author note cannot exceed 500 characters'),
  
  handleValidationErrors
];

const validateChapterUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Chapter title must be between 1 and 200 characters'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 100 })
    .withMessage('Chapter content must be at least 100 characters long'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'scheduled'])
    .withMessage('Status must be draft, published, or scheduled'),
  
  handleValidationErrors
];

// Comment validation rules
const validateCommentCreation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  
  body('paragraphIndex')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Paragraph index must be a non-negative integer'),
  
  handleValidationErrors
];

// Rating validation rules
const validateRating = [
  body('value')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('review')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Review cannot exceed 1000 characters'),
  
  handleValidationErrors
];

// General validation rules
const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('genre')
    .optional()
    .isIn([
      'Romance', 'Fantasy', 'Mystery', 'Thriller', 'Horror', 'Adventure',
      'Sci-Fi', 'Drama', 'Comedy', 'Action', 'Historical', 'Young Adult',
      'Poetry', 'Non-Fiction', 'Biography', 'Other'
    ])
    .withMessage('Invalid genre filter'),
  
  query('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'other'])
    .withMessage('Invalid language filter'),
  
  query('sortBy')
    .optional()
    .isIn(['newest', 'oldest', 'popular', 'trending', 'rating'])
    .withMessage('Invalid sort option'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateStoryCreation,
  validateStoryUpdate,
  validateChapterCreation,
  validateChapterUpdate,
  validateCommentCreation,
  validateRating,
  validateMongoId,
  validatePagination,
  validateSearch
};