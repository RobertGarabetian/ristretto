import { ClerkProvider, SignedIn, SignedOut, useAuth as useClerkAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { useRouter, useSegments } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

// Replace with your actual Clerk publishable key
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "your_clerk_publishable_key";

// SecureStore token cache for Clerk
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Auth context for our app
interface AuthContextProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  isLoading: true,
  token: null,
  getToken: async () => null,
});

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const segments = useSegments();
  const router = useRouter();

  // Check if user is authenticated and handle routing
  useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0] === "(auth)";
      
      if (isAuthenticated && inAuthGroup) {
        // Redirect to main app if user is authenticated but in auth group
        router.replace("/(app)/coffee-shops");
      } else if (!isAuthenticated && !inAuthGroup) {
        // Redirect to sign-in if user is not authenticated and not in auth group
        router.replace("/(auth)/sign-in");
      }
    }
  }, [isAuthenticated, segments, isLoading]);

  // Function to get auth token
  const getToken = async (): Promise<string | null> => {
    if (token) return token;
    
    try {
      const storedToken = await SecureStore.getItemAsync("auth-token");
      if (storedToken) {
        setToken(storedToken);
        return storedToken;
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
    
    return null;
  };

  // Auth context value
  const authContextValue: AuthContextProps = {
    isAuthenticated,
    isLoading,
    token,
    getToken,
  };

  // Setup clerk auth listener
  const handleClerkSessionChange = (session: any) => {
    setIsLoading(false);
    
    if (session?.session) {
      // User is signed in
      setIsAuthenticated(true);
      
      // Get and store JWT token
      session.session.getToken().then((token: string) => {
        setToken(token);
        SecureStore.setItemAsync("auth-token", token);
      });
    } else {
      // User is signed out
      setIsAuthenticated(false);
      setToken(null);
      SecureStore.deleteItemAsync("auth-token");
    }
  };

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <AuthContext.Provider value={authContextValue}>
        {children}
      </AuthContext.Provider>
    </ClerkProvider>
  );
}

// Components for protecting routes
export function SignedInProtected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) return null;
  
  if (!isAuthenticated) {
    router.replace("/(auth)/sign-in");
    return null;
  }

  return <>{children}</>;
}

export function SignedOutProtected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) return null;
  
  if (isAuthenticated) {
    router.replace("/(app)/coffee-shops");
    return null;
  }

  return <>{children}</>;
}