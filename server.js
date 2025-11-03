require("dotenv").config();
const express = require("express");
const PORT = process.env.PORT || 7777;
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const kycRouter = require("./routes/kycRouter");
const adminAuthRouter = require("./routes/adminAuthRouter");
const adminRouter = require("./routes/adminRouter");
const donorRouter = require("./routes/donorRouter");
const fundraiserRouter = require("./routes/fundraiserRouter");
const campaignRouter = require("./routes/campaignRouter");
const milestoneRouter = require("./routes/milestoneRouter");
const donationRouter = require("./routes/donationRouter");

const app = express();
app.use(express.json());
app.use(cors());
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "API Documentation for Trace Aid",
    version: "1.0.0",
    description: "The Documentation of the Trace Aid for Frontend Developers",
    license: {
      name: "Licensed Under MIT",
      url: "https://spdx.org/licenses/MIT.html",
    },
    contact: {
      name: "JSONPlaceholder",
      url: "https://google.com",
    },
  },
  servers: [
    {
      url: "https://traceaid.onrender.com/",
      description: "Development server",
    },
    {
      url: "http://localhost:7777",
      description: "Production server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT in the format **Bearer &lt;token&gt;**",
      },
    },
  },
  security: [
    {
      bearAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT in the format **Bearer <token>**",
      },
    },
  ],
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ["./routes/**/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(passport.initialize());
app.use(passport.session());

app.use("/donor/api/v1", donorRouter);
app.use("/fundraiser/api/v1", fundraiserRouter);
app.use("/kyc/api/v1", kycRouter);
app.use("/admin-auth/api/v1", adminAuthRouter);
app.use("/admin/api/v1", adminRouter);
app.use("/campaign/api/v1", campaignRouter);
app.use("/milestone/api/v1", milestoneRouter);
app.use("donation/api/v1", donationRouter);

app.use((error, req, res, next) => {
  if (error) {
    res.status(500).json({
      statusCode: false,
      statusText: "Internal Server Error",
      message: error.message,
    });
  }
  next();
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database connected successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Error connecting database", error.message);
  });
