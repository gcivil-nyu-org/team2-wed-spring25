// middleware.js
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    
    // If no token or no Django tokens, deny access
    if (!token || !token.djangoTokens?.access) {
      return NextResponse.redirect(
        new URL(`/login`, req.url)
      );
    }
    
    // Check for token errors set by the JWT callback
    if (token.error) {
      return NextResponse.redirect(
        new URL(`/login`, req.url)
      );
    }
    
    // Check if the access token is expired
    try {
      const accessToken = token.djangoTokens.access;
      const decoded = jwtDecode(accessToken);
      const now = Math.floor(Date.now() / 1000);
      
      // If token is expired, redirect to login
      if (decoded.exp <= now) {
        return NextResponse.redirect(
          new URL(`/login`, req.url)
        );
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      return NextResponse.redirect(
        new URL(`/login`, req.url)
      );
    }
    
    // Allow access
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    }
  }
);

export const config = {
  matcher: [
    // Protect everything under /users
    "/users/:path*",
    
    // Add any other protected routes outside of /users if needed
    "/dashboard/:path*",
    "/profile/:path*",
    
    // Exclude specific public paths if needed
    // "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};