'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/utils/api";
import { toast } from "sonner";

interface PermissionsContextProps {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  loading: boolean; // ✅ Global loading state
}

const PermissionsContext = createContext<PermissionsContextProps | undefined>(undefined);

export const PermissionsProvider = ({ children }: { children: React.ReactNode }) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true); // ✅ Track permission loading

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await api.get("/users/permissions");
      setPermissions(response.data);
    } catch (error) {
      toast.error("Failed to load permissions.");
    } finally {
      setLoading(false); // ✅ Mark as loaded
    }
  };

  const hasPermission = (permission: string) => permissions.includes(permission);

  return (
    <PermissionsContext.Provider value={{ permissions, hasPermission, loading }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
};
