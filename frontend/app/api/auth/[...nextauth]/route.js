import NextAuth from "next-auth";
import GoogleProvider from 'next-auth/providers/google'
import https from 'https';
import fetch from 'node-fetch';
import { getDjangoErrorMessage } from "@/utils/django-error-handler";


const BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL
const isProd = process.env.NODE_ENV === 'production';
const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        // Send properties to the client, like an access_token from a provider.
        async signIn({ user, account, profile }) {
            if (!account) {
                console.error('Account object is undefined in signIn callback', account);
                return false;
            }
            if (account.provider == 'google') {
                try {
                    //send the google token to our django backend 
                    console.log('Google auth successful, connecting to Django...');
                    const url = `${BASE_URL}/auth/google/`;
                    const fetchOptions = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            token: account.id_token,
                            email: user.email,
                            name: user.name
                        })
                    };
                    if (!isProd) {
                        fetchOptions.agent = new https.Agent({ rejectUnauthorized: false });
                    }
                    const response = await fetch(url, fetchOptions);

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => null);
                        const errorMessage = errorData
                            ? getDjangoErrorMessage(errorData)
                            : `Django error: ${response.status}`;
                        console.error('Django auth error:', errorMessage);
                        throw new Error(errorMessage);
                    }

                    const data = await response.json();
                    console.log('Django auth successful', data);
                    user.djangoTokens = {
                        access: data.access,
                        refresh: data.refresh
                    };
                    user.djangoUser = data.user;
                    return true

                } catch (error) {
                    console.error('Error authenticating with Django:', error);
                    return false
                }
            }
            return true
        },
        // If you want to use the session in client components
        async jwt({ token, user,account }) {
            if (user && user.djangoTokens) {
                // Store Django tokens in the JWT
                token.djangoTokens = user.djangoTokens;
                token.djangoUser = user.djangoUser;
            }

            // If we have an account but no Django tokens yet, this might be the initial
            // JWT creation before the signIn callback has run
            if (account && !token.djangoTokens) {
                // We'll get the tokens in the next JWT update after signIn completes
                console.log('Initial JWT creation, waiting for Django tokens');
            }

            return token;
        },

        async session({ session, token }) {
            // Add Django tokens and user to the session
            if (token?.djangoTokens) {
                session.djangoTokens = token.djangoTokens;
                session.djangoUser = token.djangoUser;
            }

            return session;
        },
    },
})

export { handler as GET, handler as POST }