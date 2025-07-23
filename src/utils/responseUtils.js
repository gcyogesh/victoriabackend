import slugify from 'slugify';

// Success responses
export const successResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data
  });
};

// Error responses
export const errorResponse = (res, message, statusCode = 500, error = null) => {
  const response = {
    success: false,
    message
  };

  if (error && process.env.NODE_ENV === 'development') {
    response.error = error.message;
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// Not found response
export const notFoundResponse = (res, resource = 'Resource') => {
  res.status(404).json({
    success: false,
    message: `${resource} not found`
  });
};

// Validation error response
export const validationErrorResponse = (res, errors) => {
  res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors
  });
};

// Conflict response (for duplicate resources)
export const conflictResponse = (res, resource = 'Resource') => {
  res.status(409).json({
    success: false,
    message: `${resource} already exists`
  });
};

// Unauthorized response
export const unauthorizedResponse = (res, message = 'Unauthorized') => {
  res.status(401).json({
    success: false,
    message
  });
};

// Forbidden response
export const forbiddenResponse = (res, message = 'Forbidden') => {
  res.status(403).json({
    success: false,
    message
  });
};

// Slugify utility function
export const generateSlug = (text, options = {}) => {
  const defaultOptions = {
    lower: true,      // Convert to lowercase
    strict: true,     // Remove special characters
    trim: true        // Trim whitespace
  };
  
  return slugify(text, { ...defaultOptions, ...options });
};