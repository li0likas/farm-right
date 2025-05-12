import AppConfig from '../../layout/AppConfig';
import React from 'react';
import LanguageProviderWrapper from '../LanguageProviderWrapper';
import { Metadata } from 'next';

interface SimpleLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'ŽŪVS',
    description: 'Žemės ūkio valdymo sistema',
};

export default function SimpleLayout({ children }: SimpleLayoutProps) {
    return (
        <React.Fragment>
            <LanguageProviderWrapper>
                {children}
            </LanguageProviderWrapper>
            <AppConfig simple />
        </React.Fragment>
    );
}