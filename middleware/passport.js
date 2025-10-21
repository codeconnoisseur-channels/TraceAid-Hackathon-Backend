const passport = require("passport");
const userModel = require("../model/userModel");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5050/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const email = profile.emails[0].value;
        let user = await userModel.findOne({ email });

        if (!user) {
          const tempPassword = Math.random().toString(36).slice(-12);
          const saltPassword = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(tempPassword, saltPassword);

          user = new userModel({
            fullName: profile.displayName,
            email: email,
            password: hashedPassword,
            phoneNumber: "0000000000",
            accountType: "individual",
            acceptedTerms: true,
            isVerified: profile._json.email_verified,
            profilePicture: {
              imageUrl: profile.photos[0].value,
              publicId: profile.id,
            },
            role: "donor",
          });
          await user.save();
          return cb(null, user);
        }
        return cb(null, user);
      } catch (error) {
        console.error(error);
        return cb(error, null);
      }
    }
  )
);
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userModel.findById(id);
    if (user === null) {
      return done(new Error("User not found"), null);
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const profile = passport.authenticate("google", {
  scope: ["profile", "email"],
});
const loginProfile = passport.authenticate("google", {
  failureRedirect: "/login",
  successRedirect: "/",
  session: true,
});

module.exports = {
  passport,
  profile,
  loginProfile,
};
