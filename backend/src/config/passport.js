const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/User');

// JWT Strategy — reads token from Authorization header
passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  },
  async (payload, done) => {
    try {
      const user = await User.findById(payload.id);
      if (!user) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }
));

// Google OAuth Strategy
const googleClientId = process.env.GOOGLE_CLIENT_ID || 'dummy_client_id';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret';

passport.use(new GoogleStrategy(
  {
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback',
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // role is passed via state param
      const role = req.query?.state || 'student';
      const email = profile.emails?.[0]?.value;

      if (!email && !profile.id) {
        return done(new Error('No profile identifier found from Google OAuth'), false);
      }

      let user = await User.findOne({ googleId: profile.id });

      if (!user && email) {
        // Check if email already exists (email/password user)
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          user.avatar = profile.photos?.[0]?.value || user.avatar;
          await user.save();
        } else {
          // New user via Google
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName || email.split('@')[0],
            email,
            avatar: profile.photos?.[0]?.value,
            role: ['student', 'recruiter'].includes(role) ? role : 'student',
            isVerified: false,
          });
        }
      }

      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }
));

module.exports = passport;
