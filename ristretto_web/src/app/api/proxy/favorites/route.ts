import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

// Base URL for the Golang backend
const API_BASE_URL = process.env.BACKEND_API_URL || "http://localhost:8080"

/**
 * POST handler to add a coffee shop to favorites
 * Forwards the request to the Golang backend
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get coffee shop data from request body
    const coffeeShop = await request.json()

    // Prepare data for the backend
    const favoriteData = {
      userId,
      placeId: coffeeShop.id,
      name: coffeeShop.name,
      latitude: coffeeShop.latitude,
      longitude: coffeeShop.longitude,
      location: coffeeShop.location || "",
    }

    // Forward the request to the Golang backend
    const response = await fetch(`${API_BASE_URL}/api/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
      },
      body: JSON.stringify(favoriteData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ error: errorData.message || "Failed to add favorite" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error adding favorite:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE handler to remove a coffee shop from favorites
 * Requires placeId as a query parameter
 */
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get placeId from query parameters
    const url = new URL(request.url)
    const placeId = url.searchParams.get("placeId")

    if (!placeId) {
      return NextResponse.json({ error: "Place ID is required" }, { status: 400 })
    }

    // Forward the request to the Golang backend
    const response = await fetch(`${API_BASE_URL}/api/favorites/${userId}/${placeId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ error: errorData.message || "Failed to remove favorite" }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing favorite:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * GET handler to retrieve all favorites for the current user
 */
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Forward the request to the Golang backend
    const response = await fetch(`${API_BASE_URL}/api/favorites/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ error: errorData.message || "Failed to fetch favorites" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

