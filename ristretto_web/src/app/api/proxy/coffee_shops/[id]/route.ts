import { NextResponse } from "next/server"

// This is a mock API route to simulate fetching coffee shop details
// In a real implementation, you would call your actual API or third-party service

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Return mock data based on the ID
  return NextResponse.json({
    coffeeShop: {
      id,
      name: `Coffee Shop ${id}`,
      latitude: 37.7937,
      longitude: -122.3965,
      location: "San Francisco, CA",
      address: "123 Coffee Street, San Francisco, CA 94107",
      phoneNumber: "+1 (415) 555-1234",
      website: "https://example.com/coffee",
      openingHours: [
        "Monday: 7:00 AM - 7:00 PM",
        "Tuesday: 7:00 AM - 7:00 PM",
        "Wednesday: 7:00 AM - 7:00 PM",
        "Thursday: 7:00 AM - 7:00 PM",
        "Friday: 7:00 AM - 8:00 PM",
        "Saturday: 8:00 AM - 8:00 PM",
        "Sunday: 8:00 AM - 6:00 PM",
      ],
      photos: ["/placeholder.svg?height=400&width=800"],
      rating: 4.5,
      priceLevel: 2,
      isFavorite: false,
    },
  })
}

