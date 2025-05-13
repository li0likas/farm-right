'use client';

import { useContext, useEffect } from 'react';
import { PrimeReactContext } from 'primereact/api';
import { LayoutContext } from './context/layoutcontext';
import { AppConfigProps, LayoutConfig } from '@/types';

const AppConfig = (props: AppConfigProps) => {
    const { setLayoutConfig } = useContext(LayoutContext);
    const { changeTheme } = useContext(PrimeReactContext);

    useEffect(() => {
        // max scale (16)
        setLayoutConfig((prevState: LayoutConfig) => ({ 
            ...prevState, 
            scale: 16,
            theme: 'lara-light-indigo',
            colorScheme: 'light'
        }));
        
        // theme
        if (changeTheme) {
            changeTheme('lara-light-indigo', 'lara-light-indigo', 'theme-css', () => {});
        }
        
        // scale
        document.documentElement.style.fontSize = '16px';
    }, [setLayoutConfig, changeTheme]);

    return null; // return nothing
};

export default AppConfig;