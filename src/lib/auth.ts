/**
 * NextAuth Configuration
 * Authentication setup for the Energy Ops Dashboard
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';

// For production, use environment variables
const SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production';

// Demo users (in production, use database)
const DEMO_USERS = [
  {
    id: '1',
    email: 'admin@optibid.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
  },
  {
    id: '2',
    email: 'user@optibid.com',
    password: 'user123',
    name: 'Regular User',
    role: 'user',
  },
];

export const authOptions: NextAuthOptions = {
  secret: SECRET,
  
  // Configure session strategy
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Custom pages
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  
  // Authentication providers
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email', 
          placeholder: 'admin@optibid.com' 
        },
        password: { 
          label: 'Password', 
          type: 'password' 
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter email and password');
        }

        // Find user in demo users
        const user = DEMO_USERS.find(
          (u) => u.email === credentials.email && u.password === credentials.password
        );

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Return user object (password excluded)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  
  // Callbacks
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to token on sign in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    
    async session({ session, token }) {
      // Add token data to session
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  
  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Helper function to get current session server-side
 */
export async function getCurrentUser() {
  // This will be implemented when we have the session
  // For now, return null
  return null;
}

/**
 * Helper function to check if user is authenticated
 */
export function requireAuth(role?: string) {
  return async (req: any, res: any) => {
    const session = req.session;
    
    if (!session?.user) {
      throw new Error('Unauthorized');
    }
    
    if (role && (session.user as any).role !== role) {
      throw new Error('Forbidden');
    }
    
    return session.user;
  };
}

/**
 * Demo users for development
 * In production, remove this and use a proper user database
 */
export const getDemoUsers = () => {
  return DEMO_USERS.map(({ password, ...user }) => user);
};
