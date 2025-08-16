import React, { useState } from "react";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";

export default function AuthPage() {
  const [currentPage, setCurrentPage] = useState("login"); // 'login' or 'register'

  const switchToLogin = () => setCurrentPage("login");
  const switchToRegister = () => setCurrentPage("register");

  if (currentPage === "register") {
    return <RegisterPage onSwitchToLogin={switchToLogin} />;
  }

  return <LoginPage onSwitchToRegister={switchToRegister} />;
}
