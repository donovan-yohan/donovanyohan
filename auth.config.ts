import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    signIn({ profile }) {
      // Single-owner check: only allow the repo owner's GitHub login
      const ownerLogin = process.env.OWNER_GITHUB_LOGIN;
      if (!ownerLogin) {
        // No owner configured — deny all
        return false;
      }
      const githubProfile = profile as { login?: string } | undefined;
      if (!githubProfile?.login) {
        return false;
      }
      return githubProfile.login.toLowerCase() === ownerLogin.toLowerCase();
    },
  },
  pages: {
    signIn: "/api/auth/signin",
  },
};
