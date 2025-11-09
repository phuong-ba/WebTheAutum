import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userRole = localStorage.getItem("user_role");

    console.log("Checking role:", `"${userRole}"`, `"${requiredRole}"`);

    if (!token) {
      setAllowed(false);
      return;
    }

    if (requiredRole && userRole?.trim().toLowerCase() !== requiredRole.trim().toLowerCase()) {
      setAllowed(false);
      return;
    }

    setAllowed(true);
  }, [requiredRole]);

  if (allowed === null) return null;
  if (allowed === false) return <Navigate to="/login" replace />;

  return children;
}
