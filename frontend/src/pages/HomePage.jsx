import React from "react";

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto mt-8 p-8 bg-white rounded shadow">
      <h1 className="text-3xl font-bold text-blue-700 mb-4">
        Recipe Grocery Planner
      </h1>
      <p className="mb-3">
        Welcome to your personal hub for meal planning and grocery management.
        Use the navigation bar above to manage recipes, ingredients, meal plans,
        and generate grocery lists.
      </p>
    </div>
  );
}
