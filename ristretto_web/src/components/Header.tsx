"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";

interface HeaderProps {
  isSignedIn: boolean;
}

export default function Header({ isSignedIn }: HeaderProps) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">Ristretto</h1>
        {isSignedIn ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <SignInButton mode="modal">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              Sign In
            </button>
          </SignInButton>
        )}
      </div>
    </header>
  );
}
