"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "./auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/auth/login");
    } else {
      setIsAuthenticated(true);
    }
  }, []);

  if (isAuthenticated === null) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
