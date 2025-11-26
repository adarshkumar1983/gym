import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

// Better Auth configuration
export const auth = betterAuth({
  database: mongodbAdapter(mongoose.connection.db, {
    // Better Auth will create its own collections (user, session, etc.)
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  trustedOrigins: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    process.env.MOBILE_APP_URL || "http://localhost:19006",
  ],
  baseURL: process.env.BASE_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || "change-this-secret-in-production",
  // Rate limiting
  rateLimit: {
    window: 60 * 1000, // 1 minute
    max: 10, // 10 requests per window
  },
  // Enable additional features
  socialProviders: {
    // Add OAuth providers here if needed
    // google: {
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // },
    // github: {
    //   clientId: process.env.GITHUB_CLIENT_ID!,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    // },
  },
  // Extend user schema with custom fields
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "member",
      },
    },
  },
});

// Export auth types
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

