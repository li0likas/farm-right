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
import InvitationForm from '@/app/components/InvitationForm';
import LanguageToggle from '../app/components/LanguageToggle';
import { useTranslations } from 'next-intl';
import { logout } from "@/utils/auth";

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const profileMenuRef = useRef<Menu>(null);
    const router = useRouter();
    
    const t = useTranslations('topbar');
    const common = useTranslations('common');

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
                const response = await api.get(`/users/farms`);
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
                const response = await api.get(`/farms/${selectedManageFarm}`);
                setSelectedFarmDetails(response.data);
            } catch (error) {
                console.error(error);
                toast.error(t('errors.loadFarmDetails'));
            }
        };

        fetchFarmDetails();
    }, [selectedManageFarm, t]);

    const switchFarm = (farmId: number) => {
        localStorage.setItem('x-selected-farm-id', farmId.toString());
        setSelectedFarm(farmId);
        toast.success(t('success.farmSwitched'));
        window.location.reload();
    };

    const refreshFarms = async (): Promise<any[]> => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await api.get(`/users/farms`);
            setFarms(response.data);
            return response.data;
        } catch (error) {
            console.error('Failed to refresh farms', error);
            return [];
        }
    };

    const profileMenuItems = [
        {
            label: t('menu.switchFarm'),
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
                                <span className="bg-primary text-white text-xs px-2 py-1 border-round ml-2">{t('labels.owner')}</span>
                            ) : (
                                <span className="bg-gray-400 text-white text-xs px-2 py-1 border-round ml-2">{t('labels.member')}</span>
                            )}
                        </div>
                    ),
                    command: () => switchFarm(farm.id)
                }))
                : [{ label: t('menu.noOtherFarms'), disabled: true }]
        },
        {
            label: t('menu.manageFarms'),
            icon: 'pi pi-cog',
            command: () => setShowManageFarmsModal(true)
        },
        {
            separator: true
        },
        {
            label: t('menu.logout'),
            icon: 'pi pi-sign-out',
            command: () => {
                logout();
                router.push('/auth/login');
                toast.success(t('success.loggedOut'));
            }
        }
    ];

    return (
        <>
            <div className="layout-topbar">
                <Link href="/" className="layout-topbar-logo">
                    <img src={`/layout/images/logo-${layoutConfig.colorScheme !== 'light' ? 'white' : 'dark'}.svg`} width="47.22px" height={'35px'} alt="logo" />
                    <span>ŽŪVS</span>
                </Link>

                <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                    <i className="pi pi-bars" />
                </button>

                <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                    <i className="pi pi-ellipsis-v" />
                </button>

                <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                    
                    <LanguageToggle />

                    <div className="relative">
                        <button type="button" className="p-link layout-topbar-button" onClick={(event) => profileMenuRef.current?.toggle(event)}>
                            <i className="pi pi-user"></i>
                            <span>{t('menu.profile')}</span>
                        </button>
                        <Menu model={profileMenuItems} popup ref={profileMenuRef} />
                    </div>
                </div>
            </div>

            <Dialog header={t('manageFarms.title')} visible={showManageFarmsModal} onHide={() => setShowManageFarmsModal(false)} style={{ width: '40vw' }}>
                <div className="flex flex-column gap-4">
                    <Dropdown
                        value={selectedManageFarm}
                        options={farms.map(f => ({
                            label: (
                                <div className="flex align-items-center gap-2">
                                    <span>{f.name}</span>
                                    {f.ownerId === currentUserId ? (
                                        <span className="bg-primary text-white text-xs px-2 py-1 border-round">{t('labels.owner')}</span>
                                    ) : (
                                        <span className="bg-gray-400 text-white text-xs px-2 py-1 border-round">{t('labels.member')}</span>
                                    )}
                                </div>
                            ),
                            value: f.id
                        }))}
                        onChange={(e) => setSelectedManageFarm(e.value)}
                        placeholder={t('manageFarms.selectFarm')}
                        className="w-full"
                    />

                    {selectedFarmDetails && (
                        <>
                            <div className="flex flex-column gap-2 p-3 border-1 border-round surface-border surface-card">
                                <div><i className="pi pi-users mr-2"></i> {t('manageFarms.members')}: <b>{selectedFarmDetails.membersCount}</b></div>
                                <div><i className="pi pi-map mr-2"></i> {t('manageFarms.fields')}: <b>{selectedFarmDetails.fieldsCount}</b></div>
                                <div><i className="pi pi-cog mr-2"></i> {t('manageFarms.equipments')}: <b>{selectedFarmDetails.equipmentsCount}</b></div>
                                <div><i className="pi pi-check-square mr-2"></i> {t('manageFarms.tasks')}: <b>{selectedFarmDetails.tasksCount}</b></div>
                            </div>

                            <div className="flex flex-column md:flex-row gap-2 mt-4 justify-content-center">
                                <Button label={t('buttons.inviteMember')} icon="pi pi-user-plus" className="p-button-success" onClick={() => setInviteDialogVisible(true)} />
                                {selectedFarmDetails.ownerId === currentUserId ? (
                                <>
                                    <Button label={t('buttons.renameFarm')} icon="pi pi-pencil" className="p-button-info" onClick={() => setRenameDialogVisible(true)} />
                                    <Button label={t('buttons.deleteFarm')} icon="pi pi-trash" className="p-button-danger" onClick={() => setDeleteConfirmVisible(true)} />
                                </>
                                ) : (
                                <Button label={t('buttons.leaveFarm')} icon="pi pi-sign-out" className="p-button-warning" onClick={() => setLeaveConfirmVisible(true)} />
                                )}
                            </div>
                        </>
                    )}

                    {farms.length < 3 && (
                        <Button label={t('buttons.createNewFarm')} icon="pi pi-plus" className="p-button-primary mt-3" onClick={() => setNewFarmDialogVisible(true)} />
                    )}
                </div>
            </Dialog>

            <Dialog header={t('renameFarm.title')} visible={renameDialogVisible} onHide={() => setRenameDialogVisible(false)} style={{ width: '30vw' }}>
                <div className="flex flex-column gap-3">
                    <InputText placeholder={t('renameFarm.placeholder')} value={newFarmNameInput} onChange={(e) => setNewFarmNameInput(e.target.value)} className="w-full" />
                    <Button
                        label={t('buttons.save')}
                        icon="pi pi-check"
                        onClick={async () => {
                            try {
                                await api.patch(`/farms/${selectedManageFarm}`, { name: newFarmNameInput });
                                toast.success(t('success.farmRenamed'));
                                refreshFarms();
                                setRenameDialogVisible(false);
                                setSelectedManageFarm(null);
                            } catch (error) {
                                toast.error(t('errors.renameFarm'));
                            }
                        }}
                        disabled={!newFarmNameInput || newFarmNameInput.length < 3}
                    />
                </div>
            </Dialog>

            <Dialog header={t('deleteFarm.title')} visible={deleteConfirmVisible} onHide={() => setDeleteConfirmVisible(false)} style={{ width: '30vw' }}>
                <div className="flex flex-column gap-4">
                    <p>{t('deleteFarm.confirmMessage')}</p>
                    <div className="flex justify-content-end gap-2">
                        <Button label={t('buttons.cancel')} className="p-button-text" onClick={() => setDeleteConfirmVisible(false)} />
                        <Button label={t('buttons.delete')} icon="pi pi-trash" className="p-button-danger" onClick={async () => {
                            try {
                                await api.delete(`/farms/${selectedManageFarm}`);
                                toast.success(t('success.farmDeleted'));
                                
                                const updatedFarms = await refreshFarms();
                                
                                if (updatedFarms.length > 0) {
                                  const newFarmId = updatedFarms[0].id;
                                  localStorage.setItem('x-selected-farm-id', newFarmId.toString());
                                  setSelectedFarm(newFarmId);
                                  window.location.reload();
                                } else {
                                  router.push('/create-farm');
                                }
                                
                            } catch (error) {
                                toast.error(t('errors.deleteFarm'));
                            }
                        }} />
                    </div>
                </div>
            </Dialog>

            <InvitationForm visible={inviteDialogVisible} onHide={() => setInviteDialogVisible(false)} onSuccess={refreshFarms} />

            <Dialog header={t('createFarm.title')} visible={newFarmDialogVisible} onHide={() => setNewFarmDialogVisible(false)} style={{ width: '30vw' }}>
                <div className="flex flex-column gap-3">
                    <InputText placeholder={t('createFarm.placeholder')} value={newFarmInputName} onChange={(e) => setNewFarmInputName(e.target.value)} className="w-full" />
                    <Button label={t('buttons.create')} icon="pi pi-plus" onClick={async () => {
                        try {
                            await api.post('/farms', { name: newFarmInputName });
                            toast.success(t('success.farmCreated'));
                            refreshFarms();
                            setNewFarmDialogVisible(false);
                            setNewFarmInputName('');
                        } catch (error) {
                            toast.error(t('errors.createFarm'));
                        }
                    }} disabled={!newFarmInputName || newFarmInputName.length < 3} />
                </div>
            </Dialog>

            <Dialog header={t('leaveFarm.title')} visible={leaveConfirmVisible} onHide={() => setLeaveConfirmVisible(false)} style={{ width: '30vw' }}>
                <div className="flex flex-column gap-4">
                    <p>{t('leaveFarm.confirmMessage')}</p>
                    <div className="flex justify-content-end gap-2">
                    <Button label={t('buttons.cancel')} className="p-button-text" onClick={() => setLeaveConfirmVisible(false)} />
                    <Button label={t('buttons.leave')} icon="pi pi-sign-out" className="p-button-warning" onClick={async () => {
                        try {
                        await api.delete(`/farms/leave/${selectedManageFarm}`);
                        toast.success(t('success.leftFarm'));
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
                        toast.error(t('errors.leaveFarm'));
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