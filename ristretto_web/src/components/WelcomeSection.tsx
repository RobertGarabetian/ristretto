"use client";

import { SignInButton } from "@clerk/nextjs";

export default function WelcomeSection() {
  return (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Welcome to Coffee Shop Finder</h2>
      <p className="mb-6 text-gray-600">
        Sign in to discover coffee shops near you.
      </p>
      <SignInButton mode="modal">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
          Sign In to Continue
        </button>
      </SignInButton>
    </div>
  );
}
