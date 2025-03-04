import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { name, email, password } = await request.json();

        // Validate the inputs
        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Here you would typically:
        // 1. Hash the password
        // 2. Check if user already exists
        // 3. Create user in your database
        // 4. Return success

        // This is where you'd make a call to your Django backend
        const response = await fetch('YOUR_DJANGO_API_URL/auth/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                email,
                password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        return NextResponse.json(
            { message: 'User registered successfully' },
            { status: 201 }
        );

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}