import type { AuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: AuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          // repo: needed to read and write to private + public repos.
          // read:user: needed to fetch user profile.
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (profile && "login" in profile && typeof profile.login === "string") {
        token.githubLogin = profile.login;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken && typeof token.accessToken === "string") {
        session.accessToken = token.accessToken;
      }
      if (token.githubLogin && typeof token.githubLogin === "string") {
        session.githubLogin = token.githubLogin;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
