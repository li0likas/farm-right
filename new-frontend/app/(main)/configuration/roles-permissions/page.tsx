'use client';

import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { toast } from 'sonner';
import api from '@/utils/api'; // ✅ Use API instance with interceptor
import { usePermissions } from "@/context/PermissionsContext"; // ✅ Import PermissionsContext

const RolesPermissionsPage = () => {
    const { hasPermission } = usePermissions();

    const canRead = hasPermission("PERMISSION_READ");
    const canAssign = hasPermission("PERMISSION_ASSIGN");
    const canRemove = hasPermission("PERMISSION_REMOVE");

    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);

    useEffect(() => {
        if (canRead) {
            fetchRoles();
            fetchPermissions();
        }
    }, [canRead]);

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles');
            setRoles(response.data);
        } catch (error) {
            toast.error("Failed to fetch roles");
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await api.get('/roles/permissions');
            setPermissions(response.data);
        } catch (error) {
            toast.error('Failed to fetch permissions');
        }
    };

    const togglePermission = async (roleId, permissionId, hasPermission) => {
        if (!canAssign && !canRemove) return;

        try {
            if (hasPermission) {
                await api.delete(`/roles/${roleId}/permissions/${permissionId}`);
            } else {
                await api.post(`/roles/${roleId}/permissions`, { permissionId });
            }
            toast.success('Permission updated successfully!');
            fetchRoles(); // Refresh roles after update
        } catch (error) {
            toast.error('Failed to update permission');
        }
    };

    if (!canRead) {
        return <p className="text-center text-gray-600">You do not have permission to view roles and permissions.</p>;
    }

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Roles & Permissions Management</h2>

            <DataTable value={roles} responsiveLayout="scroll">
                <Column field="name" header="Role" />

                {permissions.map((perm) => (
                    <Column
                        key={perm.id}
                        header={perm.name}
                        body={(rowData) => {
                            const hasPermission = rowData.farmPermissions?.some((p) => p.permissionId === perm.id);
                            return (
                                <Checkbox
                                    checked={hasPermission}
                                    onChange={() => togglePermission(rowData.id, perm.id, hasPermission)}
                                    disabled={!canAssign && !canRemove} // Hide interaction if user lacks permission
                                />
                            );
                        }}
                    />
                ))}
            </DataTable>
        </div>
    );
};

export default RolesPermissionsPage;
