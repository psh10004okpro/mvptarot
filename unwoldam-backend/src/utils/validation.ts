import Joi from 'joi';

// User validation schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  }),
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
  nickname: Joi.string().max(20).optional(),
  birthDate: Joi.date().max('now').optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Reading validation schemas
export const createReadingSchema = Joi.object({
  type: Joi.string()
    .valid('daily', 'single', 'three-card', 'celtic-cross')
    .required(),
  question: Joi.string().max(500).optional(),
  context: Joi.string()
    .valid('general', 'love', 'career', 'health', 'spiritual')
    .optional()
    .default('general'),
  isVoiceReading: Joi.boolean().optional().default(false)
});

// Subscription validation schemas
export const subscribeSchema = Joi.object({
  plan: Joi.string().valid('basic', 'premium').required(),
  paymentMethod: Joi.string().required()
});

// Pagination validation
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Helper function to validate data
export const validate = <T>(
  schema: Joi.ObjectSchema,
  data: any
): { error?: string; value?: T } => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    return { error: errorMessage };
  }

  return { value: value as T };
};
