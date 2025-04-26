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
import { useTranslations } from "next-intl"; // ✅ Added

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
    const et = useTranslations('equipment'); // ✅ Added

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

    useEffect(() => {
        if (canRead) {
            fetchEquipment();
            fetchEquipmentTypes();
        }
    }, [permissions]);

    useEffect(() => {
        filterEquipment();
    }, [searchQuery, selectedType]);

    const fetchEquipment = async () => {
        if (!canRead) return;
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
        return type ? type.name : et('unknown');
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
        return <p className="text-center text-gray-600">{et('noPermission')}</p>;
    }

    return (
        <ProtectedRoute>
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <h5>{et('myEquipment')}</h5>

                        <div className="flex mb-4 gap-3">
                            <InputText
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={et('searchPlaceholder')}
                            />
                            <Dropdown
                                value={selectedType}
                                options={[{ label: et('showAll'), value: null }, ...equipmentTypes.map((t) => ({ label: t.name, value: t.id }))]}
                                onChange={(e) => setSelectedType(e.value)}
                                placeholder={et('filterByType')}
                                className="w-full md:w-20rem"
                            />
                            {canCreate && (
                                <Button
                                    label={et('createEquipment')}
                                    icon="pi pi-plus"
                                    className="p-button-success"
                                    onClick={() => router.push('/create-equipment')}
                                />
                            )}
                        </div>

                        <DataTable value={filteredEquipment} paginator rows={5} responsiveLayout="scroll">
                            <Column field="name" header={et('equipmentName')} body={(data) => (
                                editingEquipmentId === data.id ? (
                                    <InputText
                                        value={editedEquipment.name || ""}
                                        onChange={(e) => setEditedEquipment({ ...editedEquipment, name: e.target.value })}
                                    />
                                ) : (
                                    data.name
                                )
                            )} sortable />

                            <Column field="typeId" header={et('type')} body={(data) => (
                                editingEquipmentId === data.id ? (
                                    <Dropdown
                                        value={editedEquipment.typeId || data.typeId}
                                        options={equipmentTypes.map((t) => ({ label: t.name, value: t.id }))}
                                        onChange={(e) => setEditedEquipment({ ...editedEquipment, typeId: e.value })}
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
                                    />
                                ) : (
                                    data.description
                                )
                            )} />

                            {showActionsColumn && (
                                <Column
                                    header={et('actions')}
                                    body={(data) => (
                                        <div className="flex gap-2">
                                            {editingEquipmentId === data.id ? (
                                                <>
                                                    {canEdit && (
                                                        <Button label={t('save')} className="p-button-success p-button-sm" onClick={saveEquipment} />
                                                    )}
                                                    <Button label={t('cancel')} className="p-button-secondary p-button-sm" onClick={cancelEdit} />
                                                </>
                                            ) : (
                                                <>
                                                    {canEdit && (
                                                        <Button icon="pi pi-pencil" className="p-button-warning p-button-sm" onClick={() => enableEdit(data)} />
                                                    )}
                                                    {canDelete && (
                                                        <Button icon="pi pi-trash" className="p-button-danger p-button-sm" onClick={() => confirmDeleteEquipment(data)} />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                />
                            )}
                        </DataTable>
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
                {equipmentToDelete && <p>{et('deleteConfirmation')}<strong>{equipmentToDelete.name}</strong>?</p>}
            </Dialog>
        </ProtectedRoute>
    );
};

export default EquipmentPage;
