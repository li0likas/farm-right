import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '@/types';
import { useTranslations } from 'next-intl';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const t = useTranslations('menu');

    const model: AppMenuItem[] = [
        {
            label: t('home'),
            items: [
                { label: t('dashboard'), icon: 'pi pi-fw pi-home', to: '/dashboard' },
                { label: t('cropHealth'), icon: 'pi pi-fw pi-sun', to: '/crop-health' },
                { label: t('map'), icon: 'pi pi-fw pi-map', to: '/fields/map' },
                { label: t('fields'), icon: 'pi pi-fw pi-map-marker', to: '/fields' },
                { label: t('tasks'), icon: 'pi pi-fw pi-list', to: '/tasks' },
                { label: t('equipment'), icon: 'pi pi-fw pi-cog', to: '/equipment' },
                { label: t('farmMembers'), icon: 'pi pi-fw pi-users', to: '/farm-members' },
                {
                    label: t('configuration'),
                    icon: 'pi pi-fw pi-cog',
                    items: [
                        { label: t('rolesPermissions'), icon: 'pi pi-fw pi-shield', to: '/configuration/roles-permissions' }
                    ]
                },
                {
                    label: t('reports'),
                    icon: 'pi pi-fw pi-chart-bar',
                    items: [
                        { label: t('taskSummary'), icon: 'pi pi-fw pi-list', to: '/reports/task-summary' },
                        { label: t('equipmentUsage'), icon: 'pi pi-fw pi-cog', to: '/reports/equipment-usage' },
                        { label: t('farmMembersActivity'), icon: 'pi pi-fw pi-users', to: '/reports/farm-members-activity' }
                    ]
                }
            ]
        }
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => (
                    !item?.seperator
                        ? <AppMenuitem item={item} root={true} index={i} key={item.label} />
                        : <li className="menu-separator" key={`separator-${i}`}></li>
                ))}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;