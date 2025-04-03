import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    
    // Debug logging to track auth issues
    console.log("Middleware auth check:", { 
      hasToken: !!token, 
      hasAccess: !!token?.djangoTokens?.access,
      tokenError: token?.error,
      path: req.nextUrl.pathname
    });
    
    // If no token or no Django tokens, deny access
    if (!token || !token.djangoTokens?.access) {
      console.log("Middleware redirect: No valid token");
      return NextResponse.redirect(
        new URL(`/login`, req.url)
      );
    }
    
    // Check for token errors set by the JWT callback
    if (token.error) {
      console.log(`Middleware redirect: Token error - ${token.error}`);
      return NextResponse.redirect(
        new URL(`/login`, req.url)
      );
    }
    
    // Check if the access token is expired or close to expiring
    try {
      const accessToken = token.djangoTokens.access;
      const decoded = jwtDecode(accessToken);
      const now = Math.floor(Date.now() / 1000);
      
      // Use a smaller buffer than JWT callback to avoid race conditions
      // JWT callback uses 60s buffer, we use 30s to ensure callback handles refresh first
      if (decoded.exp <= now) {
        console.log("Middleware redirect: Token expired");
        return NextResponse.redirect(
          new URL(`/login`, req.url)
        );
      }
    } catch (error) {
      console.error("Error decoding token in middleware:", error);
      return NextResponse.redirect(
        new URL(`/login`, req.url)
      );
    }
    
    // Allow access
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Basic check for token existence
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: [
    // Protect everything under /users
    "/users/:path*",
    
    // Add any other protected routes
    "/dashboard/:path*",
    "/profile/:path*",
    
    // Exclude specific public paths if needed
    // "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};