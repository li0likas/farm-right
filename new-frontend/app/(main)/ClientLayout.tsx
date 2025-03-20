// jeigu kazkas knisis, tai sita faila trinti, o main/layout.tsx grazinti uzkomentuota koda

'use client';

import React from "react";
import Layout from "../../layout/layout";
import { PermissionsProvider, usePermissions } from "@/context/PermissionsContext";
import { ProgressSpinner } from "primereact/progressspinner";

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
    const { loading } = usePermissions(); // Ensure this is inside PermissionsProvider

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <ProgressSpinner />
            </div>
        );
    }

    return <Layout>{children}</Layout>;
};

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <PermissionsProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
        </PermissionsProvider>
    );
};

export default ClientLayout;
