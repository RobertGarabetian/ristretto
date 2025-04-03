export interface CoffeeShop {
    id: string
    name: string
    latitude: number
    longitude: number
    isFavorite: boolean
    location: string
    // Extended properties for detail page (may be populated later)
    address?: string
    phoneNumber?: string
    website?: string
    openingHours?: string[]
    photos?: string[]
    rating?: number
    priceLevel?: number
  }
  
  export interface Coordinates {
    lat: number
    lng: number
    radius: number
    max: number
  }
  
  