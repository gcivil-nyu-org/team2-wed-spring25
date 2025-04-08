"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import AnimatedBackground from "../custom-components/AnimatedBackground";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
export function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const redirectAttempted = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Debug log for session status changes
  useEffect(() => {
    console.log("Session status:", status);
    if (session) {
      console.log("Session data available:", !!session);
    }
  }, [status, session]);

  // Get error message from URL if it exists
  useEffect(() => {
    const errorFromParams = searchParams.get("error");
    if (errorFromParams) {
      const errorMessages = {
        "session_expired": "Your session has expired. Please log in again.",
        "TokenInvalid": "Your session has expired. Please log in again.",
        "CredentialsSignin": "Invalid email or password.",
        "OAuthSignin": "Error signing in with Google.",
        "default": "An error occurred during sign in."
      };

      setError(errorMessages[errorFromParams] || errorMessages.default);
    }
  }, [searchParams]);

  // Check if user is already logged in
  useEffect(() => {
    if (status === "authenticated" && !redirectAttempted.current) {
      redirectAttempted.current = true;
      console.log("User authenticated, redirecting to home");
      router.replace("/users/home");
    }
  }, [status, router]);

  // Safety timeout to prevent UI getting stuck in loading state
  useEffect(() => {
    let timeoutId;
    
    if (loading) {
      timeoutId = setTimeout(() => {
        console.log("Login timeout - resetting loading state");
        setLoading(false);
        if (!error) {
          setError("Login is taking longer than expected. Refresh and try again.");
        }
      }, 15000); // 10 second timeout
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, error]);

  const handleOAuthLogin = async (provider) => {
    try {
      setError(null);
      setLoading(true);

      // The callbackUrl will be handled by NextAuth
      await signIn(provider, {
        callbackUrl: "/users/home",
      });

      // Note: we don't need to manually set loading=false here
      // because the page will redirect on success
    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);
      setError("Failed to connect with Google. Please try again.");
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      redirectAttempted.current = false;

      console.log("Attempting credentials login");
      // Using Next-Auth's signIn for credentials
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // Don't redirect automatically so we can handle errors
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        // Map known error codes to user-friendly messages
        const errorMessages = {
          "CredentialsSignin": "Invalid email or password",
          "SessionExpired": "Your session expired. Please log in again",
          "RefreshTokenExpired": "Your session has expired. Please log in again",
          "TokenInvalid": "Your session has expired. Please log in again",
          "RefreshAccessTokenError": "Authentication error. Please try again",
          "OAuthAccountNotLinked": "Email already in use with a different provider",
          // Add other error codes as you encounter them
        };

        // Show the mapped error or use the raw error if we don't have a mapping
        setError(errorMessages[result.error] || result.error);
        setLoading(false);
        return;
      }

      // If we get here, login was successful
      console.log("Login successful, redirecting");
      
      // Force refresh the session to ensure we have the latest data
      if (update) {
        await update();
      }
      
      // Use the router to navigate to the home page
      router.push("/users/home");
      
      // Don't reset loading state as we're navigating away
    } catch (error) {
      console.error("Login failed:", error);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  // If still checking authentication, show loading indicator
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 overflow-hidden">
      <AnimatedBackground />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/50 to-blue-900/80"></div>

      <div className="relative z-10 w-full max-w-md p-4">
        <Card className="w-full bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="space-y-1">
            <div className="flex justify-center -mt-2">
              <Image
                className="mx-auto lg:mx-0 mb-2"
                src="/owl-logo.svg"
                width={64}
                height={64}
                alt="Nightwalkers Logo"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-white">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-blue-200">
              Sign in to your account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* OAuth Buttons */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full bg-white hover:bg-blue-50 text-blue-600"
                onClick={() => handleOAuthLogin("google")}
                disabled={loading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 30 30"
                  className="w-5 h-5 mr-2"
                >
                  <path d="M 15.003906 3 C 8.3749062 3 3 8.373 3 15 C 3 21.627 8.3749062 27 15.003906 27 C 25.013906 27 27.269078 17.707 26.330078 13 L 25 13 L 22.732422 13 L 15 13 L 15 17 L 22.738281 17 C 21.848702 20.448251 18.725955 23 15 23 C 10.582 23 7 19.418 7 15 C 7 10.582 10.582 7 15 7 C 17.009 7 18.839141 7.74575 20.244141 8.96875 L 23.085938 6.1289062 C 20.951937 4.1849063 18.116906 3 15.003906 3 z"></path>
                </svg>
                {loading ? "Connecting..." : "Continue with Google"}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-blue-900/50 px-2 text-blue-200 backdrop-blur-sm">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email Login Form */}
            <form className="space-y-4" onSubmit={handleEmailLogin}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-white text-blue-600 hover:bg-blue-50"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {error && (
              <div className="p-3 rounded-md bg-red-500/20 border border-red-500/50">
                <p className="text-red-200 text-sm text-center">{error}</p>
              </div>
            )}

            <div className="text-center text-blue-200">
              <span>Don&apos;t have an account? </span>
              <Link
                href="/register"
                className="text-white hover:underline font-semibold"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}