import { BadRequestError } from '../utils/errors.js';

/**
 * Request validation middleware factory.
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against
 * @param {'body' | 'params' | 'query'} property - Request property to validate
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message).join('; ');
      return next(new BadRequestError(`Validation error: ${messages}`));
    }

    // Replace with validated & sanitized values
    req[property] = value;
    next();
  };
};

export default validate;
