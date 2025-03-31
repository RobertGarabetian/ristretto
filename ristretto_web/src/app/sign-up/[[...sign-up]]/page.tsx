import { SignInButton } from "@clerk/nextjs";
import React from "react";

const page = () => {
  return (
    <div>
      <SignInButton mode="modal">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
          Sign In to Continue
        </button>
      </SignInButton>
    </div>
  );
};

export default page;
