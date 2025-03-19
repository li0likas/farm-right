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
import api from '@/utils/api'; // ✅ Use API instance with interceptor

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
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
    const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<number | null>(null);

    // 🛠️ Delete Confirmation Dialog
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

    // ✏️ Track Editing
    const [editingEquipmentId, setEditingEquipmentId] = useState<number | null>(null);
    const [editedEquipment, setEditedEquipment] = useState<Partial<Equipment>>({});

    useEffect(() => {
        fetchEquipment();
        fetchEquipmentTypes();
    }, []);

    useEffect(() => {
        filterEquipment();
    }, [searchQuery, selectedType]);

    const fetchEquipment = async () => {
        try {
            const response = await api.get('/equipment');
            setEquipment(response.data);
            setFilteredEquipment(response.data);
        } catch (error) {
            toast.error("Failed to fetch equipment.");
        }
    };

    const fetchEquipmentTypes = async () => {
        try {
            const response = await api.get('/equipment-type-options');
            setEquipmentTypes(response.data);
        } catch (error) {
            toast.error("Failed to fetch equipment types.");
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
        return type ? type.name : "Unknown";
    };

    // ✏️ Enable Edit Mode for a row
    const enableEdit = (equip: Equipment) => {
        setEditingEquipmentId(equip.id);
        setEditedEquipment({ ...equip });
    };

    // ✅ Save Edited Equipment
    const saveEquipment = async () => {
        if (!editedEquipment || !editingEquipmentId) return;

        try {
            await api.put(`/equipment/${editingEquipmentId}`, editedEquipment);
            toast.success("Equipment updated successfully.");
            setEditingEquipmentId(null);
            fetchEquipment();
        } catch (error) {
            toast.error("Failed to update equipment.");
        }
    };

    // ❌ Cancel Edit Mode
    const cancelEdit = () => {
        setEditingEquipmentId(null);
        setEditedEquipment({});
    };

    // ❌ Confirm Delete
    const confirmDeleteEquipment = (equip: Equipment) => {
        setEquipmentToDelete(equip);
        setDeleteDialogVisible(true);
    };

    // ❌ Handle Delete Equipment
    const handleDelete = async () => {
        if (!equipmentToDelete) return;

        try {
            await api.delete(`/equipment/${equipmentToDelete.id}`);
            toast.success(`Deleted equipment: ${equipmentToDelete.name}`);
            setDeleteDialogVisible(false);
            fetchEquipment();
        } catch (error) {
            toast.error("Failed to delete equipment.");
        }
    };

    return (
        <ProtectedRoute>
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <h5>My Equipment</h5>

                        {/* 🔍 Search, Filter & Create Equipment */}
                        <div className="flex mb-4 gap-3">
                            <InputText
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name..."
                            />
                            <Dropdown
                                value={selectedType}
                                options={[{ label: "Show All", value: null }, ...equipmentTypes.map((t) => ({ label: t.name, value: t.id }))]}
                                onChange={(e) => setSelectedType(e.value)}
                                placeholder="Filter by Type"
                                className="w-full md:w-20rem"
                            />
                            <Button
                                label="Create Equipment"
                                icon="pi pi-plus"
                                className="p-button-success"
                                onClick={() => router.push('/create-equipment')} 
                            />
                        </div>

                        {/* 📋 Equipment Table */}
                        <DataTable value={filteredEquipment} paginator rows={5} responsiveLayout="scroll">
                            <Column field="name" header="Equipment Name" body={(data) => (
                                editingEquipmentId === data.id ? (
                                    <InputText
                                        value={editedEquipment.name || ""}
                                        onChange={(e) => setEditedEquipment({ ...editedEquipment, name: e.target.value })}
                                    />
                                ) : (
                                    data.name
                                )
                            )} sortable />

                            <Column field="typeId" header="Type" body={(data) => (
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

                            <Column field="description" header="Description" body={(data) => (
                                editingEquipmentId === data.id ? (
                                    <InputText
                                        value={editedEquipment.description || ""}
                                        onChange={(e) => setEditedEquipment({ ...editedEquipment, description: e.target.value })}
                                    />
                                ) : (
                                    data.description
                                )
                            )} />

                            <Column
                                header="Actions"
                                body={(data) => (
                                    <div className="flex gap-2">
                                        {editingEquipmentId === data.id ? (
                                            <>
                                                <Button label="Save" className="p-button-success p-button-sm" onClick={saveEquipment} />
                                                <Button label="Cancel" className="p-button-secondary p-button-sm" onClick={cancelEdit} />
                                            </>
                                        ) : (
                                            <>
                                                <Button icon="pi pi-pencil" className="p-button-warning p-button-sm" onClick={() => enableEdit(data)} />
                                                <Button icon="pi pi-trash" className="p-button-danger p-button-sm" onClick={() => confirmDeleteEquipment(data)} />
                                            </>
                                        )}
                                    </div>
                                )}
                            />
                        </DataTable>
                    </div>
                </div>
            </div>

            {/* 🛠️ Delete Confirmation Dialog */}
            <Dialog
                visible={deleteDialogVisible}
                onHide={() => setDeleteDialogVisible(false)}
                header="Confirm Delete"
                footer={
                    <div>
                        <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={() => setDeleteDialogVisible(false)} />
                        <Button label="Delete" icon="pi pi-check" className="p-button-danger" onClick={handleDelete} />
                    </div>
                }
            >
                {equipmentToDelete && <p>Are you sure you want to delete <strong>{equipmentToDelete.name}</strong>?</p>}
            </Dialog>
        </ProtectedRoute>
    );
};

export default EquipmentPage;
