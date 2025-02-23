'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from 'next/link';
import AnimatedBackground from "../custom-components/AnimatedBackground";
import Image from "next/image";

export default function LoginPage() {
    const handleOAuthLogin = (provider) => {
        // Handle OAuth login
        console.log(`Logging in with ${provider}`);
    };

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
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 30 30"
                  >
                    <path d="M 15.003906 3 C 8.3749062 3 3 8.373 3 15 C 3 21.627 8.3749062 27 15.003906 27 C 25.013906 27 27.269078 17.707 26.330078 13 L 25 13 L 22.732422 13 L 15 13 L 15 17 L 22.738281 17 C 21.848702 20.448251 18.725955 23 15 23 C 10.582 23 7 19.418 7 15 C 7 10.582 10.582 7 15 7 C 17.009 7 18.839141 7.74575 20.244141 8.96875 L 23.085938 6.1289062 C 20.951937 4.1849063 18.116906 3 15.003906 3 z"></path>
                  </svg>
                  Continue with Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-white hover:bg-blue-50 text-blue-600"
                  onClick={() => handleOAuthLogin("facebook")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 50 50"
                  >
                    <path d="M25,3C12.85,3,3,12.85,3,25c0,11.03,8.125,20.137,18.712,21.728V30.831h-5.443v-5.783h5.443v-3.848 c0-6.371,3.104-9.168,8.399-9.168c2.536,0,3.877,0.188,4.512,0.274v5.048h-3.612c-2.248,0-3.033,2.131-3.033,4.533v3.161h6.588 l-0.894,5.783h-5.694v15.944C38.716,45.318,47,36.137,47,25C47,12.85,37.15,3,25,3z"></path>
                  </svg>
                  Continue with Facebook
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
              <form className="space-y-4">
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
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-white text-blue-600 hover:bg-blue-50"
                >
                  Sign In
                </Button>
              </form>

              <div className="text-center text-blue-200">
                <span>Don&apos;t have an account? </span>
                <Link
                  href="/login/register"
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