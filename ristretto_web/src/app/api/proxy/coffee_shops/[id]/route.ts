// ristretto_web/src/app/api/proxy/coffee_shops/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  // Get the place ID from the route parameters
  // const placeId = params.id;
  const { id } = await params
  if (!id) {
    return NextResponse.json(
      { error: "Coffee shop ID is required" },
      { status: 400 }
    );
  }

  // Get authentication details from Clerk
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Get the JWT token to forward to your Go backend
    const token = await getToken({ template: "test" });

    // Make request to your Go backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
    const response = await fetch(`${backendUrl}/coffee_shops/${id}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const rawText = await response.text();
    
    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      return NextResponse.json(
        { error: "Invalid response from backend: " + rawText.substring(0, 100) },
        { status: 500 }
      );
    }

    // Handle errors from the backend
    if (!response.ok) {
      console.error("Backend API error:", data);
      return NextResponse.json(
        { error: data.error || "Failed to fetch coffee shop details" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in coffee shop details proxy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}