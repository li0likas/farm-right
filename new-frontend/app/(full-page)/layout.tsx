import AppConfig from '../../layout/AppConfig';
import React from 'react';
import LanguageProviderWrapper from '../LanguageProviderWrapper';
import { Metadata } from 'next';

interface SimpleLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'ŽŪVS - Ūkio Valdymo Sistema',
    description: 'ŽŪVS - Modernūs ūkio valdymo sprendimai'
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