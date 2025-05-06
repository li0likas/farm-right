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

interface Equipment {
    id: number;
    name: string;
    typeId: number;
    description: string | null;
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
            fetchEquipment();
            fetchEquipmentTypes();
        }
    }, [permissions]);

    useEffect(() => {
        filterEquipment();
    }, [searchQuery, selectedType, equipment]);

    const fetchEquipment = async () => {
        if (!canRead) return;
        setLoading(true);
        try {
            const response = await api.get('/equipment');
            setEquipment(response.data);
            setFilteredEquipment(response.data);
        } catch (error) {
            toast.error(et('fetchError'));
        } finally {
            setLoading(false);
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
        
        // First try direct translation with type.name
        const translation = et(`types.${type.name}`);
        
        // If it's not directly in our translations, return the original name
        if (translation === `types.${type.name}`) {
            return type.name;
        }
        
        return translation;
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
                <div className="container mx-auto p-6 text-center text-lg text-red-600 font-semibold">
                    {et('noPermission')}
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <h5>{et('myEquipment')}</h5>

                        <div className="flex flex-column md:flex-row mb-4 gap-3">
                            <InputText
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={et('searchPlaceholder')}
                                className="w-full md:w-15rem mb-2 md:mb-0"
                            />
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
                                className="w-full md:w-15rem mb-2 md:mb-0"
                            />
                            {canCreate && (
                                <Button
                                    label={et('createEquipment')}
                                    icon="pi pi-plus"
                                    className="p-button-success ml-auto"
                                    onClick={() => router.push('/create-equipment')}
                                />
                            )}
                        </div>

                        {loading ? (
                            <div className="flex justify-content-center">
                                <ProgressSpinner />
                            </div>
                        ) : (
                            <DataTable 
                                value={filteredEquipment} 
                                paginator 
                                rows={5} 
                                rowsPerPageOptions={[5, 10, 25]} 
                                emptyMessage={et('noEquipmentFound')}
                                responsiveLayout="stack" 
                                breakpoint="960px"
                                sortField="name"
                                sortOrder={1}
                            >
                                <Column field="name" header={et('equipmentName')} body={(data) => (
                                    editingEquipmentId === data.id ? (
                                        <InputText
                                            value={editedEquipment.name || ""}
                                            onChange={(e) => setEditedEquipment({ ...editedEquipment, name: e.target.value })}
                                            className="w-full"
                                        />
                                    ) : (
                                        data.name
                                    )
                                )} sortable />

                                <Column field="typeId" header={et('type')} body={(data) => (
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
                                        getTypeName(data.typeId)
                                    )
                                )} sortable />

                                <Column field="description" header={t('description')} body={(data) => (
                                    editingEquipmentId === data.id ? (
                                        <InputText
                                            value={editedEquipment.description || ""}
                                            onChange={(e) => setEditedEquipment({ ...editedEquipment, description: e.target.value })}
                                            className="w-full"
                                        />
                                    ) : (
                                        data.description || "-"
                                    )
                                )} />

                                {showActionsColumn && (
                                    <Column
                                        header={et('actions')}
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
                                                                tooltip={et('edit')}
                                                                className="p-button-warning p-button-sm" 
                                                                onClick={() => enableEdit(data)} 
                                                            />
                                                        )}
                                                        {canDelete && (
                                                            <Button 
                                                                icon="pi pi-trash" 
                                                                tooltip={et('delete')}
                                                                className="p-button-danger p-button-sm" 
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
                footer={
                    <div>
                        <Button label={t('cancel')} icon="pi pi-times" className="p-button-text" onClick={() => setDeleteDialogVisible(false)} />
                        {hasPermission("EQUIPMENT_DELETE") && (
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
                    <p>
                        {et('deleteConfirmation')}
                        <strong>{equipmentToDelete.name}</strong>?
                    </p>
                )}
            </Dialog>
        </ProtectedRoute>
    );
};

export default EquipmentPage;