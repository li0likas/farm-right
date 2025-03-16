'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { toast } from 'sonner';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';

const RolesPermissionsPage = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [dialogVisible, setDialogVisible] = useState(false);

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const getAuthHeaders = () => {
        const accessToken = localStorage.getItem('accessToken');
        const selectedFarmId = localStorage.getItem('x-selected-farm-id');

        if (!accessToken || !selectedFarmId) {
            toast.error('Missing authentication or farm selection.');
            return null;
        }

        return {
            Authorization: `Bearer ${accessToken}`,
            'x-selected-farm-id': selectedFarmId
        };
    };

    const fetchRoles = async () => {
        const headers = getAuthHeaders();
        if (!headers) return;

        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`, { headers });
            setRoles(response.data);
        } catch (error) {
            if (error.response?.status === 403) {
                window.location.href = "/pages/unauthorized";
            } else {
                toast.error("Failed to fetch roles");
            }
        }
    };

    const fetchPermissions = async () => {
        const headers = getAuthHeaders();
        if (!headers) return;

        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/permissions`, { headers });
            setPermissions(response.data);
        } catch (error) {
            if (error.response?.status === 403) {
                window.location.href = "/pages/unauthorized";
            } else {
                toast.error('Failed to fetch permissions');
            }
        }
    };

    const togglePermission = async (roleId, permissionId, hasPermission) => {
        const headers = getAuthHeaders();
        if (!headers) return;

        try {
            if (hasPermission) {
                await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/${roleId}/permissions/${permissionId}`, { headers });
            } else {
                await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/${roleId}/permissions`, { permissionId }, { headers });
            }
            toast.success('Permission updated successfully!');
            fetchRoles(); // Refresh roles after update
        } catch (error) {
            if (error.response?.status === 403) {
                window.location.href = "/pages/unauthorized";
            } else {
                toast.error('Failed to update permission');
            }
        }
    };

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
