const joi = require("joi");

exports.registerValidator = (req, res, next) => {
  const schema = joi.object({
    firstName: joi
      .string()
      .min(2)
      .trim()
      .required()
      .pattern(/^[A-Za-z\s]+$/)
      .when("accountType", {
        is: "individual",
        then: joi.required(),
        otherwise: joi.optional(),
      })
      .messages({
        "string.empty": "Full name is required",
        "string.min": "Full name must be at least 3 characters long",
        "string.pattern.base": "Fullname can only contain letters",
      }),
    lastName: joi
      .string()
      .min(2)
      .trim()
      .required()
      .pattern(/^[A-Za-z\s]+$/)
      .when("accountType", {
        is: "individual",
        then: joi.required(),
        otherwise: joi.optional(),
      })
      .messages({
        "string.empty": "Full name is required",
        "string.min": "Full name must be at least 3 characters long",
        "string.pattern.base": "Fullname can only contain letters",
      }),
    organizationName: joi.string().min(2).trim().when("accountType", {
      is: "organization",
      then: joi.required(),
      otherwise: joi.optional(),
    }),
    email: joi.string().email().trim().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),
    phoneNumber: joi
      .string()
      .trim()
      .pattern(/^[0-9]{11}$/)
      .required()
      .messages({
        "string.empty": "Phone number is required",
        "string.pattern.base": "Phone number must be 11 digits",
      }),
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
    accountType: joi.string().valid("individual", "organization").required().messages({
      "string.empty": "Account type is required",
      "any.only": "Account type must be either 'individual' or 'organization'",
    }),
    acceptedTerms: joi.boolean().valid(true).required().messages({
      "any.only": "You must accept the terms and conditions",
      "any.required": "You must accept the terms and conditions",
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      message: "Validation error: " + error.message,
    });
  }

  next();
};

exports.verifyValidator = (req, res, next) => {
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
      message: "Validation error: " + error.message,
    });
  }

  next();
};

exports.resendValidator = (req, res, next) => {
  const schema = joi.object({
    email: joi.string().email().trim().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      message: "Validation error: " + error.message,
    });
  }

  next();
};

exports.forgotPasswordValidator = (req, res, next) => {
  const schema = joi.object({
    email: joi.string().email().trim().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      message: "Validation error: " + error.message,
    });
  }
  next();
};

exports.resetPasswordValidator = (req, res, next) => {
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
      message: "Validation error: " + error.message,
    });
  }
  next();
};

exports.loginValidator = (req, res, next) => {
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
      message: "Validation error: " + error.message,
    });
  }

  next();
};

exports.changePasswordValidator = (req, res, next) => {
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
      message: "Validation error: " + error.message,
    });
  }
  next();
};

exports.updateProfileValidator = (req, res, next) => {
  const schema = joi.object({
    firstName: joi
      .string()
      .min(2)
      .trim()
      .required()
      .pattern(/^[A-Za-z\s]+$/)
      .when("accountType", {
        is: "individual",
        then: joi.required(),
        otherwise: joi.optional(),
      })
      .messages({
        "string.empty": "First name is required",
        "string.min": "First name must be at least 3 characters long",
        "string.pattern.base": "First name can only contain letters",
      }),
    lastName: joi
      .string()
      .min(2)
      .trim()
      .required()
      .pattern(/^[A-Za-z\s]+$/)
      .when("accountType", {
        is: "individual",
        then: joi.required(),
        otherwise: joi.optional(),
      })
      .messages({
        "string.empty": "last name is required",
        "string.min": "last name must be at least 3 characters long",
        "string.pattern.base": "last name can only contain letters",
      }),
    phoneNumber: joi
      .string()
      .trim()
      .pattern(/^[0-9]{11}$/)
      .required()
      .messages({
        "string.empty": "Phone number is required",
        "string.pattern.base": "Phone number must be 11 digits",
      }),
    organizationName: joi
      .string()
      .min(2)
      .trim()
      .when("accountType", {
        is: "organization",
        then: joi.required(),
        otherwise: joi.optional(),
      })
      .messages({
        "string.empty": "Organization name is required",
        "string.min": "Organization name must be at least 3 characters long",
      }),
  });

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      message: "Validation error: " + error.message,
    });
  }
  next();
};
