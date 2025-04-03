import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { jwtDecode } from "jwt-decode";

const BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

/**
 * Helper function for Django API calls during auth flow
 */
async function djangoFetch(url, options = {}) {
  const fetchOptions = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${BASE_URL}${url}`, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || errorData.error || `Django error: ${response.status}`;
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(refreshToken) {
  try {
    const refreshedTokens = await djangoFetch("/auth/token/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!refreshedTokens.access) {
      throw new Error("Failed to refresh access token");
    }

    return {
      ...refreshedTokens,
      error: null,
    };
  } catch (error) {
    return {
      access: null,
      refresh: null,
      error: "RefreshAccessTokenError",
    };
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const data = await djangoFetch("/auth/login/", {
            method: "POST",
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          return {
            id: data.user.id,
            email: data.user.email,
            name: `${data.user.first_name} ${data.user.last_name}`,
            image: data.user.avatar_url || null,
            djangoTokens: {
              access: data.access,
              refresh: data.refresh,
            },
            djangoUser: data.user,
          };
        } catch (error) {
          console.error("Credentials authentication failed:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',  // Your custom login page
    signOut: '/login', // Redirect to login after signing out
    error: '/login',   // Error page (or your login page to show errors there)
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;

      if (account.provider === "google") {
        try {
          const data = await djangoFetch("/auth/google/", {
            method: "POST",
            body: JSON.stringify({
              token: account.id_token,
              email: user.email,
              name: user.name,
            }),
          });

          user.djangoTokens = {
            access: data.access,
            refresh: data.refresh,
          };
          user.djangoUser = data.user;
          return true;
        } catch (error) {
          console.error("Error authenticating with Django:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, trigger }) {
      // Initial sign-in: store the tokens
      if (user?.djangoTokens) {
        token.djangoTokens = user.djangoTokens;
        token.djangoUser = user.djangoUser;
        return token;
      }

      // Handle session updates
      if (trigger === "update") {
        return { ...token };
      }

      // Return if no access token (shouldn't happen)
      if (!token.djangoTokens?.access) {
        return token;
      }

      // Check if the access token is expired
      const accessExpiry = getTokenExpiry(token.djangoTokens.access);
      const refreshExpiry = getTokenExpiry(token.djangoTokens.refresh);
      const now = Math.floor(Date.now() / 1000);

      // If refresh token is expired, force sign out
      if (refreshExpiry <= now) {
        console.log("JWT callback: Refresh token expired");
        return { ...token, error: "RefreshTokenExpired" };
      }

      // If access token is not expired or close to expiry, return existing token
      // Add 60-second buffer to avoid edge cases
      if (accessExpiry > now + 60) {
        return token;
      }

      // Access token is expired or close to expiring, try to refresh it
      console.log("JWT callback: Refreshing access token");
      const refreshed = await refreshAccessToken(token.djangoTokens.refresh);

      if (refreshed.error) {
        // Only invalidate for permanent errors
        if (refreshed.error === "RefreshTokenExpired") {
          console.log("JWT callback: Refresh failed - token expired");
          return { ...token, error: refreshed.error };
        }
        // For temporary errors, continue with existing token
        console.log("JWT callback: Temporary refresh error, using existing token");
        return token;
      }

      // Refresh succeeded, update the token
      console.log("JWT callback: Token refresh successful");
      return {
        ...token,
        djangoTokens: {
          access: refreshed.access,
          refresh: refreshed.refresh || token.djangoTokens.refresh,
        },
      };
    },
    async session({ session, token }) {
      // Add Django tokens and user to session
      session.djangoTokens = token.djangoTokens;
      session.djangoUser = token.djangoUser;

      // Pass any errors to the client
      if (token.error) {
        session.error = token.error;
      }

      return session;
    },
  },
  events: {
    async signOut({ token }) {
      // Blacklist the refresh token when user signs out
      if (token?.djangoTokens?.refresh) {
        try {
          await djangoFetch("/auth/logout/", {
            method: "POST",
            body: JSON.stringify({ refresh: token.djangoTokens.refresh }),
          });
        } catch (error) {
          console.error("Error logging out from Django:", error);
        }
      }
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60
  },
  debug: process.env.NODE_ENV === "development",
});

/**
 * Helper function to extract expiry time from JWT token
 */
function getTokenExpiry(token) {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp;
  } catch (error) {
    return 0;
  }
}

export { handler as GET, handler as POST };