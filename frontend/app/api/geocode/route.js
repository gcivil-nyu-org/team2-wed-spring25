// app/api/geocode/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    const mapboxToken = process.env.MAPBOX_API_KEY;
    
    if (!mapboxToken) {
      return NextResponse.json(
        { error: 'Mapbox API key not configured on server' },
        { status: 500 }
      );
    }

    const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${mapboxToken}&limit=1`;

    const response = await fetch(geocodingUrl);
    
    if (!response.ok) {
      throw new Error(`Geocoding API returned ${response.status}`);
    }

    const data = await response.json();

    // Transform the response to return just what we need
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const [longitude, latitude] = feature.center;
      
      return NextResponse.json({
        success: true,
        coordinates: [latitude, longitude], // Convert to [latitude, longitude] for Leaflet
        placeName: feature.place_name
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Location not found'
      });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    
    return NextResponse.json(
      { error: 'Failed to geocode location' },
      { status: 500 }
    );
  }
}