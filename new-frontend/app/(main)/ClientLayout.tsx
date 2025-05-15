'use client';

import React from "react";
import Layout from "../../layout/layout";
import { PermissionsProvider, usePermissions } from "@/context/PermissionsContext";
import { ProgressSpinner } from "primereact/progressspinner";
import LanguageProviderWrapper from "../LanguageProviderWrapper";

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
    const { loading } = usePermissions();

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
            <LanguageProviderWrapper>
                <LayoutWrapper>{children}</LayoutWrapper>
            </LanguageProviderWrapper>
        </PermissionsProvider>
    );
};

export default ClientLayout;