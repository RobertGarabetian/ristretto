// app/api/proxy/coffee_shops/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Get authentication details from Clerk
  const { userId, getToken } = await auth();
  
  if (!userId) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  try {
    // Get the JWT token to forward to your Go backend
    const token = await getToken({ template: "test" }); // You might need to configure this template in Clerk
    
    // Parse URL to get query parameters
    const url = new URL(request.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const radius = url.searchParams.get('radius');
    const max = url.searchParams.get('max');
    
    // Make request to your Go backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const response = await fetch(`${backendUrl}/coffee_shops?lat=${lat}&lng=${lng}&radius=${radius}&max=${max}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    // Read the response body ONLY ONCE
    const rawText = await response.text();
    console.log("Raw response:::::::::::::::::::::::::::::::::::::\n\n", rawText);
    
    // Now try to parse if it's JSON
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      return NextResponse.json({ error: "Invalid response from backend: " + rawText.substring(0, 100) }, { status: 500 });
    }
    
    // Use the parsed data instead of trying to read the response body again
    if (!response.ok) {
      console.error("Backend API error:", data);
      return NextResponse.json(
        { error: data.error || "Failed to fetch coffee shops" }, 
        { status: response.status }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in coffee_shops proxy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}