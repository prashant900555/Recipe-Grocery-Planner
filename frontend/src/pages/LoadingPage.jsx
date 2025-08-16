import React, { useEffect } from "react";

export default function LoadingPage() {
  useEffect(() => {
    // Optional: Add any loading logic here
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center">
      <div className="text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Recipe Grocery Planner
          </h1>
          <p className="text-xl text-blue-100">
            All your food planning, in one place
          </p>
        </div>

        {/* Loading Animation */}
        <div className="mb-8">
          <div className="relative mx-auto w-32 h-32">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-spin border-t-white"></div>

            {/* Inner pulsing circle */}
            <div className="absolute inset-4 bg-white rounded-full opacity-20 animate-pulse"></div>

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 6v6l4 2"></path>
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <p className="text-lg text-white font-medium">
            Loading your kitchen...
          </p>
          <div className="flex justify-center space-x-1">
            <div
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
