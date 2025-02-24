'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from 'next/link';
import AnimatedBackground from "../../custom-components/AnimatedBackground";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getSession } from "next-auth/react"
import { apiPost } from "@/utils/fetch/fetch";


export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null);
    useEffect(() => {
        const checkAuth = async () => {
            const session = await getSession();

            // If we have a session and the Django token exists in localStorage
            // (set by the NextAuth signIn callback)
            if (session && localStorage.getItem('djangoAccessToken')) {
                router.push('/users/dashboard');
            } else {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);
    const handleOAuthLogin = async (provider) => {
        try {
            setLoading(true);

            await signIn(provider, {
                callbackUrl: '/users/dashboard' // Redirect after successful login
            });

            // The NextAuth signIn callback will save the Django tokens
            // and handle redirecting to the dashboard
        } catch (error) {
            console.error('Login failed:', error);
            setLoading(false);
        }
    };
    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await apiPost('/auth/login/', {
                email,
                password
            });

            if (!result || !result.access) {
                throw new Error(result?.detail || "Login failed");
            }

            // Store tokens in localStorage (or cookies for better security)
            localStorage.setItem("djangoAccessToken", result.access);
            localStorage.setItem("djangoRefreshToken", result.refresh);
            localStorage.setItem("user", JSON.stringify(result.user));

            // Redirect to dashboard
            router.push("/users/dashboard");

        } catch (error) {
            console.error("Login failed:", error.message);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 overflow-hidden">
            <AnimatedBackground />

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/50 to-blue-900/80"></div>

            <div className="relative z-10 w-full max-w-md p-4">
                <Card className="w-full bg-white/10 backdrop-blur-lg border-white/20">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center text-white">Welcome Back</CardTitle>
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
                                onClick={() => handleOAuthLogin('google')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 30 30">
                                    <path d="M 15.003906 3 C 8.3749062 3 3 8.373 3 15 C 3 21.627 8.3749062 27 15.003906 27 C 25.013906 27 27.269078 17.707 26.330078 13 L 25 13 L 22.732422 13 L 15 13 L 15 17 L 22.738281 17 C 21.848702 20.448251 18.725955 23 15 23 C 10.582 23 7 19.418 7 15 C 7 10.582 10.582 7 15 7 C 17.009 7 18.839141 7.74575 20.244141 8.96875 L 23.085938 6.1289062 C 20.951937 4.1849063 18.116906 3 15.003906 3 z"></path>
                                </svg>
                                Continue with Google
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
                                <Label htmlFor="email" className="text-white">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-white">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    className="bg-white/10 border-white/20 text-white"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full bg-white text-blue-600 hover:bg-blue-50">
                                {loading ? "Signing In..." : "Sign In"}
                            </Button>
                        </form>
                        {error && (
                            <p className="text-red-500 text-sm text-center">{error}</p>
                        )}
                        <div className="text-center text-blue-200">
                            <span>Don&apos;t have an account? </span>
                            <Link
                                href="/users/register"
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