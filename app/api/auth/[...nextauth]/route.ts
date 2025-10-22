// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import bcrypt from 'bcrypt';

// Assert environment variables are strings
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  throw new Error("Missing Google OAuth environment variables");
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma), // Adapter works with the User model as before
  providers: [
    GoogleProvider({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          console.log('Missing credentials');
          return null;
        }

        // --- CORRECTED AUTHORIZE LOGIC (with separate Password model) ---
        // 1. Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          console.log('No user found with email:', credentials.email);
          return null; // User not found
        }

        // 2. Find the associated password hash for this user
        const userPassword = await prisma.password.findUnique({
            where: { userId: user.id }
        });

        if (!userPassword?.hash) {
            console.log(`User ${credentials.email} found, but no password record exists (likely OAuth only).`);
            return null; // User exists but has no password set via this mechanism
        }

        // 3. Compare provided password with the stored hash from the Password table
        const isValidPassword = await bcrypt.compare(credentials.password, userPassword.hash);

        if (!isValidPassword) {
          console.log('Invalid password for user:', credentials.email);
          return null; // Passwords don't match
        }
        // --- END CORRECTION ---

        console.log('User authorized via credentials:', user.email);
        // Return user object if password is valid
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };