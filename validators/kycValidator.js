const joi = require("joi");

exports.kycValidator = (req, res, next) => {
  const schema = joi.object({
    organizationName: joi.string().trim().min(2).required().messages({
      "string.empty": "Organization name is required",
      "string.min": "Organization name must be at least 2 characters long",
    }),

    organizationType: joi.string().valid("Non-profit", "NGO", "Foundation").required().messages({
      "any.only": "Organization type must be one of Non-profit, NGO, or Foundation",
      "string.empty": "Organization type is required",
    }),

    registrationNumber: joi.string().trim().required().messages({
      "string.empty": "Registration number is required",
    }),

    authorizedRepresentativeFullName: joi
      .string()
      .trim()
      .min(3)
      .required()
      .pattern(/^[A-Za-z\s]+$/)
      .messages({
        "string.empty": "Authorized representative name is required",
        "string.min": "Authorized representative name must be at least 3 characters long",
        "string.pattern.base": "Authorized representative name can only contain letters and spaces",
      }),

    organizationAddress: joi.string().trim().required().messages({
      "string.empty": "Organization address is required",
    }),

    bankAccountName: joi.string().trim().required().messages({
      "string.empty": "Bank account name is required",
    }),

    bankAccountNumber: joi
      .string()
      .trim()
      .pattern(/^[0-9]{10,11}$/)
      .required()
      .messages({
        "string.empty": "Bank account number is required",
        "string.pattern.base": "Bank account number must be 10–11 digits",
      }),

    bankName: joi.string().trim().required().messages({
      "string.empty": "Bank name is required",
    }),

    description: joi.string().trim().min(10).required().messages({
      "string.empty": "Organization description is required",
      "string.min": "Organization description must be at least 10 characters long",
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
