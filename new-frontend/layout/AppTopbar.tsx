'use client';

import React, { useState, useEffect, useRef, useContext, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutContext } from './context/layoutcontext';
import { AppTopbarRef } from '@/types';
import Link from 'next/link';
import { Menu } from 'primereact/menu';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { toast } from 'sonner';
import api from '@/utils/api';
import axios from 'axios';
import InvitationForm from '@/app/components/InvitationForm';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const profileMenuRef = useRef<Menu>(null);
    const router = useRouter();

    const [farms, setFarms] = useState([]);
    const [selectedFarm, setSelectedFarm] = useState<number | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const [showManageFarmsModal, setShowManageFarmsModal] = useState(false);
    const [selectedManageFarm, setSelectedManageFarm] = useState<number | null>(null);
    const [selectedFarmDetails, setSelectedFarmDetails] = useState<any>(null);

    const [renameDialogVisible, setRenameDialogVisible] = useState(false);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [inviteDialogVisible, setInviteDialogVisible] = useState(false);
    const [newFarmNameInput, setNewFarmNameInput] = useState('');
    const [newFarmDialogVisible, setNewFarmDialogVisible] = useState(false);
    const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);
    const [newFarmInputName, setNewFarmInputName] = useState('');

    useEffect(() => {
        const fetchFarms = async () => {
            try {
                const accessToken = localStorage.getItem('accessToken');
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/farms`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setFarms(response.data);
                const currentFarm = localStorage.getItem('x-selected-farm-id');
                setSelectedFarm(currentFarm ? parseInt(currentFarm) : response.data[0]?.id || null);
            } catch (error) {
                console.error('Failed to fetch farms:', error);
            }
        };

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user?.id) {
            setCurrentUserId(user.id);
        }

        fetchFarms();
    }, []);

    useEffect(() => {
        if (!selectedManageFarm) {
            setSelectedFarmDetails(null);
            return;
        }

        const fetchFarmDetails = async () => {
            try {
                const accessToken = localStorage.getItem('accessToken');
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/farms/${selectedManageFarm}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setSelectedFarmDetails(response.data);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load farm details');
            }
        };

        fetchFarmDetails();
    }, [selectedManageFarm]);

    const switchFarm = (farmId: number) => {
        localStorage.setItem('x-selected-farm-id', farmId.toString());
        setSelectedFarm(farmId);
        toast.success('Farm switched successfully!');
        window.location.reload();
    };

    const refreshFarms = async (): Promise<any[]> => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/farms`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setFarms(response.data);
            return response.data;
        } catch (error) {
            console.error('Failed to refresh farms', error);
            return []; // Return an empty array in case of an error
        }
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
                    label: (
                        <div
                            className={classNames(
                                'flex align-items-center gap-2 px-2 py-2 border-round',
                                farm.id === selectedFarm ? 'bg-primary-reverse surface-border font-semibold' : ''
                            )}
                        >
                            <span>{farm.name}</span>
                            {farm.ownerId === currentUserId ? (
                                <span className="bg-primary text-white text-xs px-2 py-1 border-round ml-2">Owner</span>
                            ) : (
                                <span className="bg-gray-400 text-white text-xs px-2 py-1 border-round ml-2">Member</span>
                            )}
                        </div>
                    ),
                    command: () => switchFarm(farm.id)
                }))
                : [{ label: 'No other farms available', disabled: true }]
        }
        ,
        {
            label: 'Manage Farms',
            icon: 'pi pi-cog',
            command: () => setShowManageFarmsModal(true)
        },
        {
            separator: true
        },
        {
            label: 'Logout',
            icon: 'pi pi-sign-out',
            command: () => {
                localStorage.clear();
                sessionStorage.removeItem('aiInsight');
                router.push('/auth/login');
                toast.success('Logged out successfully');
            }
        }
    ];

    return (
        <>
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

            {/* 🔵 Manage Farms Modal */}
            <Dialog header="Manage Farms" visible={showManageFarmsModal} onHide={() => setShowManageFarmsModal(false)} style={{ width: '40vw' }}>
                <div className="flex flex-column gap-4">
                    <Dropdown
                        value={selectedManageFarm}
                        options={farms.map(f => ({
                            label: (
                                <div className="flex align-items-center gap-2">
                                    <span>{f.name}</span>
                                    {f.ownerId === currentUserId ? (
                                        <span className="bg-primary text-white text-xs px-2 py-1 border-round">Owner</span>
                                    ) : (
                                        <span className="bg-gray-400 text-white text-xs px-2 py-1 border-round">Member</span>
                                    )}
                                </div>
                            ),
                            value: f.id
                        }))}
                        onChange={(e) => setSelectedManageFarm(e.value)}
                        placeholder="Select a farm"
                        className="w-full"
                    />

                    {selectedFarmDetails && (
                        <>
                            <div className="flex flex-column gap-2 p-3 border-1 border-round surface-border surface-card">
                                <div><i className="pi pi-users mr-2"></i> Members: <b>{selectedFarmDetails.membersCount}</b></div>
                                <div><i className="pi pi-map mr-2"></i> Fields: <b>{selectedFarmDetails.fieldsCount}</b></div>
                                <div><i className="pi pi-cog mr-2"></i> Equipments: <b>{selectedFarmDetails.equipmentsCount}</b></div>
                                <div><i className="pi pi-check-square mr-2"></i> Tasks: <b>{selectedFarmDetails.tasksCount}</b></div>
                            </div>

                            <div className="flex flex-column md:flex-row gap-2 mt-4 justify-content-center">
                                <Button label="Invite Member" icon="pi pi-user-plus" className="p-button-success" onClick={() => setInviteDialogVisible(true)} />
                                {selectedFarmDetails.ownerId === currentUserId ? (
                                <>
                                    <Button label="Rename Farm" icon="pi pi-pencil" className="p-button-info" onClick={() => setRenameDialogVisible(true)} />
                                    <Button label="Delete Farm" icon="pi pi-trash" className="p-button-danger" onClick={() => setDeleteConfirmVisible(true)} />
                                </>
                                ) : (
                                <Button label="Leave Farm" icon="pi pi-sign-out" className="p-button-warning" onClick={() => setLeaveConfirmVisible(true)} />
                                )}
                            </div>
                        </>
                    )}

                    {/* ➕ Create New Farm Button */}
                    {farms.length < 3 && (
                        <Button label="Create New Farm" icon="pi pi-plus" className="p-button-primary mt-3" onClick={() => setNewFarmDialogVisible(true)} />
                    )}
                </div>
            </Dialog>

            {/* 🏷️ Rename Farm */}
            <Dialog header="Rename Farm" visible={renameDialogVisible} onHide={() => setRenameDialogVisible(false)} style={{ width: '30vw' }}>
                <div className="flex flex-column gap-3">
                    <InputText placeholder="New farm name" value={newFarmNameInput} onChange={(e) => setNewFarmNameInput(e.target.value)} className="w-full" />
                    <Button
                        label="Save"
                        icon="pi pi-check"
                        onClick={async () => {
                            try {
                                await api.patch(`/farms/${selectedManageFarm}`, { name: newFarmNameInput });
                                toast.success('Farm renamed!');
                                refreshFarms();
                                setRenameDialogVisible(false);
                                setSelectedManageFarm(null);
                            } catch (error) {
                                toast.error('Failed to rename farm');
                            }
                        }}
                        disabled={!newFarmNameInput || newFarmNameInput.length < 3}
                    />
                </div>
            </Dialog>

            {/* 🗑️ Confirm Delete Farm */}
            <Dialog header="Delete Farm" visible={deleteConfirmVisible} onHide={() => setDeleteConfirmVisible(false)} style={{ width: '30vw' }}>
                <div className="flex flex-column gap-4">
                    <p>Are you sure you want to delete this farm? This action cannot be undone.</p>
                    <div className="flex justify-content-end gap-2">
                        <Button label="Cancel" className="p-button-text" onClick={() => setDeleteConfirmVisible(false)} />
                        <Button label="Delete" icon="pi pi-trash" className="p-button-danger" onClick={async () => {
                            try {
                                await api.delete(`/farms/${selectedManageFarm}`);
                                toast.success('Farm deleted!');
                                
                                // Refresh farms
                                const updatedFarms = await refreshFarms();
                                
                                // Check if farms are left
                                if (updatedFarms.length > 0) {
                                  // Switch to first available farm
                                  const newFarmId = updatedFarms[0].id;
                                  localStorage.setItem('x-selected-farm-id', newFarmId.toString());
                                  setSelectedFarm(newFarmId);
                                  window.location.reload(); // Optional: you can soft refresh state instead if needed
                                } else {
                                  // No farms left, redirect to farm creation page
                                  router.push('/create-farm'); // <-- make sure this page exists
                                }
                                
                            } catch (error) {
                                toast.error('Failed to delete farm');
                            }
                        }} />
                    </div>
                </div>
            </Dialog>

            {/* ✉️ Invite Modal */}
            <InvitationForm visible={inviteDialogVisible} onHide={() => setInviteDialogVisible(false)} onSuccess={refreshFarms} />

            {/* ➕ Create New Farm Modal */}
            <Dialog header="Create New Farm" visible={newFarmDialogVisible} onHide={() => setNewFarmDialogVisible(false)} style={{ width: '30vw' }}>
                <div className="flex flex-column gap-3">
                    <InputText placeholder="Farm Name" value={newFarmInputName} onChange={(e) => setNewFarmInputName(e.target.value)} className="w-full" />
                    <Button label="Create" icon="pi pi-plus" onClick={async () => {
                        try {
                            await api.post('/farms', { name: newFarmInputName });
                            toast.success('New farm created!');
                            refreshFarms();
                            setNewFarmDialogVisible(false);
                            setNewFarmInputName('');
                        } catch (error) {
                            toast.error('Failed to create farm');
                        }
                    }} disabled={!newFarmInputName || newFarmInputName.length < 3} />
                </div>
            </Dialog>

            <Dialog header="Leave Farm" visible={leaveConfirmVisible} onHide={() => setLeaveConfirmVisible(false)} style={{ width: '30vw' }}>
                <div className="flex flex-column gap-4">
                    <p>Are you sure you want to leave this farm?</p>
                    <div className="flex justify-content-end gap-2">
                    <Button label="Cancel" className="p-button-text" onClick={() => setLeaveConfirmVisible(false)} />
                    <Button label="Leave" icon="pi pi-sign-out" className="p-button-warning" onClick={async () => {
                        try {
                        await api.delete(`/farm-members/${selectedManageFarm}`); // We'll implement backend in a sec
                        toast.success('You left the farm!');
                        const updatedFarms = await refreshFarms();
                        if (updatedFarms.length > 0) {
                            const newFarmId = updatedFarms[0].id;
                            localStorage.setItem('x-selected-farm-id', newFarmId.toString());
                            setSelectedFarm(newFarmId);
                            window.location.reload();
                        } else {
                            router.push('/create-farm');
                        }
                        setLeaveConfirmVisible(false);
                        } catch (error) {
                        toast.error('Failed to leave farm');
                        }
                    }} />
                    </div>
                </div>
            </Dialog>
        </>
    );
});

AppTopbar.displayName = 'AppTopbar';
export default AppTopbar;
