import axios from "axios";
import {db} from "../drizzle/index.js";
import {eq, and} from "drizzle-orm";
import {users, sessions, oauthAccounts} from "../drizzle/schema/schema.js";
import {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  FRONTEND_URL,
} from "../config/env.js";
import {generateAccessToken, generateRefreshToken} from "../config/jwt.js";

// GitHub OAuth - Initiate authentication
// _req is used to avoid the unused variable warning
const oauthGithub = async (_req, res, next) => {
  try {
    const redirectUri = `${FRONTEND_URL}/api/auth/callback/github`;
    const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email`;

    res.redirect(url);
  } catch (error) {
    next(error);
  }
};

// GitHub OAuth - Handle callback
const oauthGithubCallback = async (req, res, next) => {
  try {
    const {code} = req.query;

    if (!code) {
      const error = new Error("Authorization code not provided");
      error.statusCode = 400;
      return next(error);
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const {access_token} = tokenResponse.data;

    if (!access_token) {
      const error = new Error("Failed to get access token from GitHub");
      error.statusCode = 400;
      return next(error);
    }

    // Get user information from GitHub
    const [userResponse, emailResponse] = await Promise.all([
      axios.get("https://api.github.com/user", {
        headers: {Authorization: `Bearer ${access_token}`},
      }),
      axios.get("https://api.github.com/user/emails", {
        headers: {Authorization: `Bearer ${access_token}`},
      }),
    ]);

    const githubUser = userResponse.data;
    const emails = emailResponse.data;
    const primaryEmail = emails.find((e) => e.primary && e.verified)?.email;

    if (!primaryEmail) {
      const error = new Error("No verified email found in GitHub account");
      error.statusCode = 400;
      return next(error);
    }

    // Check if user exists in database
    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, primaryEmail))
      .limit(1);

    // Create user if doesn't exist
    if (!existingUser) {
      [existingUser] = await db
        .insert(users)
        .values({
          email: primaryEmail,
          name: githubUser.name || githubUser.login,
          isVerified: true, // OAuth users are automatically verified
        })
        .returning();
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken({userId: existingUser.id});
    const refreshToken = generateRefreshToken({userId: existingUser.id});

    // Redirect to frontend with tokens (you can modify this URL)
    const frontendUrl = `${
      FRONTEND_URL || "http://localhost:3000"
    }/auth/success?token=${accessToken}&refresh=${refreshToken}`;
    res.redirect(frontendUrl);
  } catch (error) {
    next(error);
  }
};

// Google OAuth - Initiate authentication
const oauthGoogle = async (_req, res, next) => {
  try {
    const redirectUri = `http://localhost:5000/api/v1/oauth/google/callback`;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=email profile&access_type=offline&prompt=consent`;

    res.redirect(url);
  } catch (error) {
    next(error);
  }
};

// Google OAuth - Handle callback
const oauthGoogleCallback = async (req, res, next) => {
  try {
    const {code} = req.query;

    if (!code) {
      const error = new Error("Authorization code not provided");
      error.statusCode = 400;
      return next(error);
    }

    const redirectUri = `http://localhost:5000/api/v1/oauth/google/callback`;

    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }
    );

    const {access_token} = tokenResponse.data;

    if (!access_token) {
      const error = new Error("Failed to get access token from Google");
      error.statusCode = 400;
      return next(error);
    }

    // Get user information from Google
    const profileResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {Authorization: `Bearer ${access_token}`},
      }
    );

    const googleUser = profileResponse.data;

    if (!googleUser.email) {
      const error = new Error("No email found in Google account");
      error.statusCode = 400;
      return next(error);
    }

    // Check if user exists in database
    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, googleUser.email))
      .limit(1);

    // Create user if doesn't exist
    if (!existingUser) {
      console.log("Creating new user for Google OAuth:", googleUser.email);
      [existingUser] = await db
        .insert(users)
        .values({
          email: googleUser.email,
          name: googleUser.name,
          isVerified: true, // OAuth users are automatically verified
        })
        .returning();
      console.log("User created successfully:", existingUser.id);
    } else {
      console.log("Existing user found:", existingUser.id);
    }

    // Check if OAuth account exists
    let [existingOAuthAccount] = await db
      .select()
      .from(oauthAccounts)
      .where(
        and(
          eq(oauthAccounts.provider, "google"),
          eq(oauthAccounts.providerAccountId, googleUser.id)
        )
      )
      .limit(1);

    // Create or update OAuth account
    if (!existingOAuthAccount) {
      await db.insert(oauthAccounts).values({
        userId: existingUser.id,
        provider: "google",
        providerAccountId: googleUser.id,
        accessToken: access_token,
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      });
    } else {
      await db
        .update(oauthAccounts)
        .set({
          accessToken: access_token,
          expiresAt: new Date(Date.now() + 3600 * 1000),
          updatedAt: new Date(),
        })
        .where(eq(oauthAccounts.id, existingOAuthAccount.id));
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken({userId: existingUser.id});
    const refreshToken = generateRefreshToken({userId: existingUser.id});

    console.log("Generated tokens for user:", existingUser.id);

    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.insert(sessions).values({
      userId: existingUser.id,
      token: refreshToken,
      expiresAt,
    });

    console.log("Session created for user:", existingUser.id);

    // Redirect to frontend with tokens in URL params
    const frontendUrl = `${
      FRONTEND_URL || "http://localhost:3000"
    }/?token=${accessToken}&refresh=${refreshToken}&oauth=success`;
    console.log("Redirecting to frontend:", frontendUrl);
    res.redirect(frontendUrl);
  } catch (error) {
    next(error);
  }
};

export {oauthGithub, oauthGithubCallback, oauthGoogle, oauthGoogleCallback};
