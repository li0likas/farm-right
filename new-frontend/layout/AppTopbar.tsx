import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import { Menu } from 'primereact/menu';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/utils/api';
import axios from 'axios';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const profileMenuRef = useRef<Menu>(null);
    const router = useRouter();

    interface Farm {
        id: number;
        name: string;
    }

    const [farms, setFarms] = useState<Farm[]>([]);
    const [selectedFarm, setSelectedFarm] = useState<number | null>(null);

    useEffect(() => {
        const fetchFarms = async () => {
            try {
                const accessToken = localStorage.getItem('accessToken'); 
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/farms`, {
                    headers: { 
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                setFarms(response.data);
                const currentFarm = localStorage.getItem('x-selected-farm-id');
                setSelectedFarm(currentFarm ? parseInt(currentFarm) : response.data[0]?.id);
            } catch (error) {
                console.error("Failed to fetch farms:", error);
            }
        };

        fetchFarms();
    }, []);

    const switchFarm = (farmId: number) => {
        localStorage.setItem('x-selected-farm-id', farmId.toString());
        setSelectedFarm(farmId);
        toast.success("Farm switched successfully!");
        window.location.reload(); // Refresh the page to apply changes
    };

    const profileMenuItems = [
        {
            label: 'Profile',
            icon: 'pi pi-user',
            command: () => router.push('/profile')
        },
        {
            label: 'Settings',
            icon: 'pi pi-cog',
            command: () => router.push('/settings')
        },
        {
            separator: true
        },
        {
            label: 'Switch Farm',
            icon: 'pi pi-refresh',
            items: farms.length > 1 
                ? farms.map(farm => ({
                    label: farm.name,
                    icon: farm.id === selectedFarm ? 'pi pi-check-circle' : 'pi pi-circle',
                    command: () => switchFarm(farm.id)
                }))
                : [{ label: 'No other farms available', disabled: true }]
        },
        {
            separator: true
        },
        {
            label: 'Logout',
            icon: 'pi pi-sign-out',
            command: () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('x-selected-farm-id');
                localStorage.removeItem('user');
                sessionStorage.removeItem("aiInsight");
    
                router.push('/auth/login');
                toast.success("Logged out successfully");
            }
        }
    ];

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo">
                <img src={`/layout/images/logo-${layoutConfig.colorScheme !== 'light' ? 'white' : 'dark'}.svg`} width="47.22px" height={'35px'} alt="logo" />
                <span>SAKAI</span>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                <i className="pi pi-ellipsis-v" />
            </button>

            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                <button type="button" className="p-link layout-topbar-button">
                    <i className="pi pi-calendar"></i>
                    <span>Calendar</span>
                </button>

                {/* ✅ Profile Button with Dropdown */}
                <div className="relative">
                    <button type="button" className="p-link layout-topbar-button" onClick={(event) => profileMenuRef.current?.toggle(event)}>
                        <i className="pi pi-user"></i>
                        <span>Profile</span>
                    </button>
                    <Menu model={profileMenuItems} popup ref={profileMenuRef} />
                </div>

                <Link href="/documentation">
                    <button type="button" className="p-link layout-topbar-button">
                        <i className="pi pi-cog"></i>
                        <span>Settings</span>
                    </button>
                </Link>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
