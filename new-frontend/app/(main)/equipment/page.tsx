'use client';

import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from '@/utils/api';
import { usePermissions } from "@/context/PermissionsContext";
import { useTranslations } from "next-intl";
import { ProgressSpinner } from "primereact/progressspinner";
import { Card } from "primereact/card";

interface Equipment {
    id: number;
    name: string;
    typeId: number;
    description: string | null;
    type?: {
        id: number;
        name: string;
    };
}

interface EquipmentType {
    id: number;
    name: string;
}

const EquipmentPage = () => {
    const router = useRouter();
    const { hasPermission, permissions } = usePermissions();

    const t = useTranslations('common');
    const et = useTranslations('equipment');

    const canRead = hasPermission("EQUIPMENT_READ");
    const canCreate = hasPermission("EQUIPMENT_CREATE");
    const canEdit = hasPermission("EQUIPMENT_UPDATE");
    const canDelete = hasPermission("EQUIPMENT_DELETE");

    const showActionsColumn = canEdit || canDelete;

    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
    const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<number | null>(null);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
    const [editingEquipmentId, setEditingEquipmentId] = useState<number | null>(null);
    const [editedEquipment, setEditedEquipment] = useState<Partial<Equipment>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (canRead) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [permissions]);

    useEffect(() => {
        filterEquipment();
    }, [searchQuery, selectedType, equipment]);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchEquipment(),
                fetchEquipmentTypes()
            ]);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEquipment = async () => {
        try {
            const response = await api.get('/equipment');
            setEquipment(response.data);
            setFilteredEquipment(response.data);
        } catch (error) {
            toast.error(et('fetchError'));
        }
    };

    const fetchEquipmentTypes = async () => {
        try {
            const response = await api.get('/equipment-type-options');
            setEquipmentTypes(response.data);
        } catch (error) {
            toast.error(et('fetchTypesError'));
        }
    };

    const filterEquipment = () => {
        let filtered = equipment.filter((equip) =>
            equip.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (selectedType !== null) {
            filtered = filtered.filter((equip) => equip.typeId === selectedType);
        }

        setFilteredEquipment(filtered);
    };

    const getTypeName = (typeId: number) => {
        const type = equipmentTypes.find((t) => t.id === typeId);
        if (!type) return et('unknown');
        
        const translationKey = `types.${type.name}`;
        const translation = et(translationKey);
        
        return translation !== translationKey ? translation : type.name;
    };

    const enableEdit = (equip: Equipment) => {
        if (!canEdit) return;
        setEditingEquipmentId(equip.id);
        setEditedEquipment({ ...equip });
    };

    const saveEquipment = async () => {
        if (!editedEquipment || !editingEquipmentId || !canEdit) return;
        try {
            await api.put(`/equipment/${editingEquipmentId}`, editedEquipment);
            toast.success(et('updateSuccess'));
            setEditingEquipmentId(null);
            fetchEquipment();
        } catch (error) {
            toast.error(et('updateError'));
        }
    };

    const cancelEdit = () => {
        setEditingEquipmentId(null);
        setEditedEquipment({});
    };

    const confirmDeleteEquipment = (equip: Equipment) => {
        if (!canDelete) return;
        setEquipmentToDelete(equip);
        setDeleteDialogVisible(true);
    };

    const handleDelete = async () => {
        if (!equipmentToDelete || !canDelete) return;
        try {
            await api.delete(`/equipment/${equipmentToDelete.id}`);
            toast.success(et('deleteSuccess', { name: equipmentToDelete.name }));
            setDeleteDialogVisible(false);
            fetchEquipment();
        } catch (error) {
            toast.error(et('deleteError'));
        }
    };

    if (!canRead) {
        return (
            <ProtectedRoute>
                <div className="grid">
                    <div className="col-12">
                        <Card className="shadow-4">
                            <div className="flex flex-column align-items-center py-6">
                                <i className="pi pi-lock text-yellow-500 text-5xl mb-4"></i>
                                <h3 className="text-xl font-semibold mb-2">{et('noPermission')}</h3>
                                <p className="text-gray-600 mb-4">{et('contactAdmin')}</p>
                                <Button
                                    label={t('backToDashboard')}
                                    icon="pi pi-home"
                                    className="p-button-outlined"
                                    onClick={() => router.push('/dashboard')}
                                />
                            </div>
                        </Card>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <div className="flex justify-content-between align-items-center mb-4">
                            <h2 className="text-2xl font-bold m-0 text-primary">{et('myEquipment')}</h2>
                            {canCreate && (
                                <Button
                                    label={et('createEquipment')}
                                    icon="pi pi-plus"
                                    className="p-button-success"
                                    onClick={() => router.push('/create-equipment')}
                                />
                            )}
                        </div>

                        {!loading && (
                            <div className="grid mb-4">
                                <div className="col-12 md:col-6 lg:col-4">
                                    <div className="p-inputgroup">
                                        <span className="p-inputgroup-addon">
                                            <i className="pi pi-search"></i>
                                        </span>
                                        <InputText
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={et('searchPlaceholder')}
                                            className="w-full"
                                        />
                                        {searchQuery && (
                                            <Button 
                                                icon="pi pi-times" 
                                                className="p-button-outlined" 
                                                onClick={() => setSearchQuery('')}
                                                tooltip={t('clearSearch')}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="col-12 md:col-6 lg:col-4">
                                    <Dropdown
                                        value={selectedType}
                                        options={[
                                            { label: et('showAll'), value: null }, 
                                            ...equipmentTypes.map((t) => ({ 
                                                label: getTypeName(t.id), 
                                                value: t.id 
                                            }))
                                        ]}
                                        onChange={(e) => setSelectedType(e.value)}
                                        placeholder={et('filterByType')}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex flex-column justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                <span className="mt-3 text-lg text-600">{et('loadingEquipment')}</span>
                            </div>
                        ) : filteredEquipment.length === 0 ? (
                            <div className="flex flex-column align-items-center justify-content-center py-6">
                                <i className="pi pi-cog text-gray-300 text-6xl mb-4"></i>
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">{et('noEquipmentFound')}</h3>
                                <p className="text-gray-500 mb-4">{et('noEquipmentDescription')}</p>
                                {canCreate && searchQuery === "" && selectedType === null && (
                                    <Button
                                        label={et('createFirstEquipment')}
                                        icon="pi pi-plus"
                                        className="p-button-primary"
                                        onClick={() => router.push('/create-equipment')}
                                    />
                                )}
                            </div>
                        ) : (
                            <DataTable 
                                value={filteredEquipment} 
                                paginator 
                                paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                                currentPageReportTemplate="{first} - {last} {totalRecords}"
                                rows={10} 
                                rowsPerPageOptions={[5, 10, 25]} 
                                emptyMessage={et('noEquipmentFound')}
                                responsiveLayout="scroll"
                                className="p-datatable-striped"
                                sortField="name"
                                sortOrder={1}
                            >
                                <Column 
                                    field="name" 
                                    header={et('equipmentName')} 
                                    body={(data) => (
                                        editingEquipmentId === data.id ? (
                                            <InputText
                                                value={editedEquipment.name || ""}
                                                onChange={(e) => setEditedEquipment({ ...editedEquipment, name: e.target.value })}
                                                className="w-full"
                                            />
                                        ) : (
                                            <span className="font-medium">{data.name}</span>
                                        )
                                    )} 
                                    sortable 
                                />

                                <Column 
                                    field="typeId" 
                                    header={et('type')} 
                                    body={(data) => (
                                        editingEquipmentId === data.id ? (
                                            <Dropdown
                                                value={editedEquipment.typeId || data.typeId}
                                                options={equipmentTypes.map((t) => ({ 
                                                    label: getTypeName(t.id), 
                                                    value: t.id 
                                                }))}
                                                onChange={(e) => setEditedEquipment({ ...editedEquipment, typeId: e.value })}
                                                className="w-full"
                                            />
                                        ) : (
                                            <span>{getTypeName(data.typeId)}</span>
                                        )
                                    )} 
                                    sortable 
                                />

                                <Column 
                                    field="description" 
                                    header={t('description')} 
                                    body={(data) => (
                                        editingEquipmentId === data.id ? (
                                            <InputText
                                                value={editedEquipment.description || ""}
                                                onChange={(e) => setEditedEquipment({ ...editedEquipment, description: e.target.value })}
                                                className="w-full"
                                            />
                                        ) : (
                                            <span className="text-gray-600">{data.description || "-"}</span>
                                        )
                                    )} 
                                />

                                {showActionsColumn && (
                                    <Column
                                        header={et('actions')}
                                        style={{ width: '150px', textAlign: 'center' }}
                                        body={(data) => (
                                            <div className="flex gap-2 justify-content-center">
                                                {editingEquipmentId === data.id ? (
                                                    <>
                                                        {canEdit && (
                                                            <Button 
                                                                label={t('save')} 
                                                                icon="pi pi-check"
                                                                className="p-button-success p-button-sm" 
                                                                onClick={saveEquipment} 
                                                            />
                                                        )}
                                                        <Button 
                                                            label={t('cancel')} 
                                                            icon="pi pi-times"
                                                            className="p-button-secondary p-button-sm" 
                                                            onClick={cancelEdit} 
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        {canEdit && (
                                                            <Button 
                                                                icon="pi pi-pencil" 
                                                                tooltip={et('editEquipment')}
                                                                className="p-button-primary p-button-sm p-button-text" 
                                                                onClick={() => enableEdit(data)} 
                                                            />
                                                        )}
                                                        {canDelete && (
                                                            <Button 
                                                                icon="pi pi-trash" 
                                                                tooltip={et('deleteEquipment')}
                                                                className="p-button-danger p-button-sm p-button-text" 
                                                                onClick={() => confirmDeleteEquipment(data)} 
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    />
                                )}
                            </DataTable>
                        )}
                    </div>
                </div>
            </div>

            <Dialog
                visible={deleteDialogVisible}
                onHide={() => setDeleteDialogVisible(false)}
                header={et('confirmDelete')}
                style={{ width: '450px' }}
                modal
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button 
                            label={t('cancel')} 
                            icon="pi pi-times" 
                            className="p-button-text" 
                            onClick={() => setDeleteDialogVisible(false)} 
                        />
                        {canDelete && (
                            <Button
                                label={et('delete')}
                                icon="pi pi-check"
                                className="p-button-danger"
                                onClick={handleDelete}
                            />
                        )}
                    </div>
                }
            >
                {equipmentToDelete && (
                    <div className="flex align-items-center gap-3">
                        <i className="pi pi-exclamation-triangle text-yellow-500 text-4xl"></i>
                        <div>
                            <p className="m-0">{et('deleteConfirmation')}</p>
                            <p className="mt-2 font-bold">{equipmentToDelete.name}</p>
                        </div>
                    </div>
                )}
            </Dialog>
        </ProtectedRoute>
    );
};

export default EquipmentPage;