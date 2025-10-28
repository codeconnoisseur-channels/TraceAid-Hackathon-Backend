const joi = require("joi");

exports.organizationRegisterValidator = (req, res, next) => {
  const schema = joi.object({
    organizationName: joi
      .string()
      .min(3)
      .trim()
      .required()
      .pattern(/^[A-Za-z\s]+$/)
      .messages({
        "string.empty": "Organization name is required",
        "string.min": "Organization name must be at least 3 characters long",
        "string.pattern.base": "Organization name can only contain letters",
      }),
    email: joi.string().trim().required().email().messages({
      "string.empty": "Organization email is required",
      "string.email": "Organization email must be a valid email address",
    }),
    phoneNumber: joi
      .string()
      .trim()
      .required()
      .pattern(/^[0-9]{11}$/)
      .messages({
        "string.empty": "Organization phone number is required",
        "string.pattern.base": "Organization phone number can only contain numbers",
        "string.length": "Organization phone number must be 11 digits long",
      }),
    password: joi
      .string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%_*#?&-])[A-Za-z\d@$!%_*#?&]{8,}$/)
      .required()
      .messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base": `Password must contain at least one uppercase letter,
         one lowercase letter, one number, and one special character`,
      }),
    confirmPassword: joi.string().trim().required().valid(joi.ref("password")).messages({
      "string.empty": "Confirm password cannot be empty",
      "any.required": "Confirm password is required",
      "any.only": "Passwords do not match",
    }),
    acceptedTerms: joi.boolean().valid(true).required().messages({
      "any.only": "Kindly accept the terms and condition",
      "any.required": "You must accept the terms and condition",
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      statusCode: false,
      statusText: "Bad Request",
      message: "Validation error: " + error.message,
    });
  }

  next();
};

exports.organizationVerifyValidator = (req, res, next) => {
  const schema = joi.object({
    email: joi.string().email().trim().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),
    otp: joi.string().trim().required().messages({
      "string.empty": "OTP is required",
    }),
  });
  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      statusCode: false,
      statusText: "Bad Request",
      message: "Validation error: " + error.message,
    });
  }

  next();
};

exports.organizationResendValidator = (req, res, next) => {
  const schema = joi.object({
    email: joi.string().email().trim().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      statusCode: false,
      statusText: "Bad Request",
      message: "Validation error: " + error.message,
    });
  }

  next();
};

exports.organizationLoginValidator = (req, res, next) => {
  const schema = joi.object({
    email: joi.string().email().trim().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),
    password: joi.string().required().messages({
      "string.empty": "Password is required",
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      statusCode: false,
      statusText: "Bad Request",
      message: "Validation error: " + error.message,
    });
  }

  next();
};

exports.organizationForgotPasswordValidator = (req, res, next) => {
  const schema = joi.object({
    email: joi.string().email().trim().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      statusCode: false,
      statusText: "Bad Request",
      message: "Validation error: " + error.message,
    });
  }

  next();
};

exports.organizationResetPasswordValidator = (req, res, next) => {
  const schema = joi.object({
    password: joi
      .string()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%_*#?&-])[A-Za-z\d@$!%_*#?&]{8,}$/)
      .required()
      .messages({
        "string.empty": "Password is required",
        "string.pattern.base":
          "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, a number, and a special character (@$!%_*#?&)",
      }),
    confirmPassword: joi.string().required().valid(joi.ref("password")).messages({
      "any.only": "Passwords do not match",
      "string.empty": "Confirm password cannot be empty",
      "any.required": "Confirm password is required",
    }),
  });
  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      statusCode: false,
      statusText: "Bad Request",
      message: "Validation error: " + error.message,
    });
  }
  next();
};

exports.organizationChangePasswordValidator = (req, res, next) => {
  const schema = joi.object({
    oldPassword: joi.string().required().messages({
      "string.empty": "Old password is required",
    }),
    newPassword: joi
      .string()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%_*#?&-])[A-Za-z\d@$!%_*#?&]{8, }$/)
      .required()
      .messages({
        "string.empty": "New password is required",
        "string.pattern.base":
          "New password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, a number, and a special character (@$!%_*#?&)",
      }),
    confirmPassword: joi.string().required().valid(joi.ref("newPassword")).messages({
      "any.only": "Passwords do not match",
      "string.empty": "Confirm password cannot be empty",
      "any.required": "Confirm password is required",
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      statusCode: false,
      statusText: "Bad Request",
      message: "Validation error: " + error.message,
    });
  }

  next();
};

exports.organizationUpdateProfileValidator = (req, res, next) => {
  const schema = joi.object({
    organizationName: joi
      .string()
      .min(2)
      .trim()
      .required()
      .pattern(/^[A-Za-z\s]+$/)
      .messages({
        "string.empty": "Organization name is required",
        "string.min": "Organization name must be at least 3 characters long",
        "string.pattern.base": "Organization name can only contain letters",
      }),
    email: joi.string().trim().required().email().messages({
      "string.empty": "Organization email is required",
      "string.email": "Organization email must be a valid email address",
    }),
    phoneNumber: joi
      .string()
      .trim()
      .required()
      .pattern(/^[0-9]{11}$/)
      .messages({
        "string.empty": "Organization phone number is required",
        "string.pattern.base": "Organization phone number can only contain numbers",
        "string.length": "Organization phone number must be 11 digits long",
      }),
  });

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      statusCode: false,
      statusText: "Bad Request",
      message: "Validation error: " + error.message,
    });
  }

  next();
};
