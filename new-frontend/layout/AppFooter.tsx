/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import { LayoutContext } from './context/layoutcontext';

const AppFooter = () => {
    const { layoutConfig } = useContext(LayoutContext);

    return (
        <div className="layout-footer">
            <span className="font-medium">© 2025 ŽŪVS – žemės ūkio valdymo sistema</span>
        </div>
    );
};

export default AppFooter;