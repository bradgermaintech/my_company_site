import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.events"
        }
      }
    })
  );
}

providers.push(
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      const parsed = await signInSchema.safeParseAsync(credentials);

      if (!parsed.success) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email }
      });

      if (!user?.passwordHash || !user.active) {
        return null;
      }

      const passwordMatches = await verifyPassword(
        parsed.data.password,
        user.passwordHash
      );

      if (!passwordMatches) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        image: user.image
      };
    }
  })
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  providers,
  pages: {
    signIn: "/login"
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? "bidder";
        token.avatar = user.avatar ?? "PO";
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role ?? "bidder";
        session.user.avatar = token.avatar ?? "PO";
      }

      return session;
    }
  }
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

const handler = NextAuth(authOptions);

export { handler };
