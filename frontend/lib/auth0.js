import { Auth0Client } from "@auth0/nextjs-auth0/server"
import { NextResponse } from 'next/server'

export const auth0 = new Auth0Client({
    appBaseUrl: process.env.AUTH0_BASE_URL,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    secret: process.env.AUTH0_SECRET,
    
    async onCallback(error, context, session) {
        if (error) {
            console.error('Auth0 callback error', error)
            return NextResponse.redirect(
                new URL('/login', process.env.AUTH0_BASE_URL)
            )
        }
        try {
            // Log the session to see what we're getting
            console.log('Auth0 callback session', session)
            
            return NextResponse.redirect(
                new URL(context.returnTo || "/", process.env.AUTH0_BASE_URL)
            )
        } catch (error) {
            console.error('Error in callback:', error)
            return NextResponse.redirect(
                new URL('/error', process.env.AUTH0_BASE_URL)
            )
        }
    }
})