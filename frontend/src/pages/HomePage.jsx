import React from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  const tiles = [
    {
      label: "Ingredients",
      color: "bg-green-500 hover:bg-green-600",
      icon: (
        <svg
          className="w-8 h-8 mb-1 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 4v16m8-8H4"></path>
        </svg>
      ),
      to: "/ingredients",
      desc: "Pantry ingredients",
    },
    {
      label: "Recipes",
      color: "bg-yellow-500 hover:bg-yellow-600",
      icon: (
        <svg
          className="w-8 h-8 mb-1 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 6v6l4 2"></path>
          <circle cx="12" cy="12" r="10"></circle>
        </svg>
      ),
      to: "/recipes",
      desc: "Your recipe book",
    },
    {
      label: "Meal Plans",
      color: "bg-indigo-500 hover:bg-indigo-600",
      icon: (
        <svg
          className="w-8 h-8 mb-1 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18"></path>
        </svg>
      ),
      to: "/mealplans",
      desc: "Plan your week",
    },
    {
      label: "Grocery List",
      color: "bg-pink-500 hover:bg-pink-600",
      icon: (
        <svg
          className="w-8 h-8 mb-1 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M5 6h14M5 12h14M5 18h14"></path>
        </svg>
      ),
      to: "/grocerylists",
      desc: "Smart shopping",
    },
  ];

  return (
    <div className="min-h-screen max-h-screen flex flex-col overflow-hidden">
      <header className="flex flex-col items-center pt-6 pb-2 px-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center text-gray-800 mb-2 leading-tight truncate">
          Recipe Grocery Planner
        </h1>
        <p className="text-gray-500 text-sm sm:text-base md:text-lg text-center mb-1">
          All your food planning, in one place
        </p>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-2">
        <div className="w-full max-w-5xl flex-1 flex items-center">
          <div
            className="
              grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 w-full mx-auto"
            style={{
              flex: 1,
              height: "calc(41vh - 0px)",
              minHeight: 0,
              alignItems: "stretch",
            }}
          >
            {tiles.map((tile) => (
              <button
                key={tile.label}
                onClick={() => navigate(tile.to)}
                className={`
                  group shadow-lg rounded-xl flex flex-col items-center justify-center
                  transition transform hover:scale-105 active:scale-95 duration-100
                  ${tile.color} px-2 py-3 sm:px-4 sm:py-6
                  focus:outline-none
                  w-full h-full min-h-0
                `}
                aria-label={`Go to ${tile.label}`}
                style={{
                  minHeight: 0,
                  height: "100%",
                  fontSize: "clamp(12px,2vw,18px)",
                }}
              >
                {tile.icon}
                <span className="font-bold text-base sm:text-lg text-white mb-1 group-hover:underline">
                  {tile.label}
                </span>
                <span className="text-white text-xs sm:text-sm opacity-90 text-center">
                  {tile.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
      <footer className="bg-gray-900 text-white text-center py-3 sm:py-4 mt-auto shadow-lg border-t border-gray-600 text-xs sm:text-sm">
        <span className="opacity-70">
          © {new Date().getFullYear()} Recipe Grocery Planner. All rights
          reserved. Made with ❤️ for Kudi
        </span>
      </footer>
    </div>
  );
}
