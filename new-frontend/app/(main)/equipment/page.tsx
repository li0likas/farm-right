'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { toast } from "sonner";
import ProtectedRoute from "@/utils/ProtectedRoute";
import { isLoggedIn } from "@/utils/auth";

interface Equipment {
    id: number;
    name: string;
    typeId: number;
    description: string | null;
    ownerId: number;
    createdAt: string;
    updatedAt: string;
}

interface EquipmentType {
    id: number;
    name: string;
}

const EquipmentPage = () => {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
    const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<number | null>(null);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

    useEffect(() => {
        if (!isLoggedIn()) {
          toast.error('Unauthorized. Login first.');
          return;
        }

        fetchEquipment();
        fetchEquipmentTypes();
    }, []);

    useEffect(() => {
        filterEquipment();
    }, [searchQuery, selectedType]);

    const fetchEquipment = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/equipment`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setEquipment(response.data);
            setFilteredEquipment(response.data);
        } catch (error) {
            console.error("Error fetching equipment:", error);
            toast.error("Failed to fetch equipment.");
        }
    };

    const fetchEquipmentTypes = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/equipment-type-options`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setEquipmentTypes(response.data);
        } catch (error) {
            console.error("Error fetching equipment types:", error);
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

    const handleEdit = (id: number) => {
        toast.info(`Edit Equipment ID: ${id}`);
        // Redirect to edit page if applicable
    };

    const confirmDeleteEquipment = (equipment: Equipment) => {
        setEquipmentToDelete(equipment);
        setDeleteDialogVisible(true);
    };

    const handleDelete = async () => {
        if (!equipmentToDelete) return;
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/equipment/${equipmentToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`Deleted equipment: ${equipmentToDelete.name}`);
            setDeleteDialogVisible(false);
            fetchEquipment();
        } catch (error) {
            console.error("Error deleting equipment:", error);
            toast.error("Failed to delete equipment.");
        }
    };

    return (
      <ProtectedRoute>
          <div className="grid">
              <div className="col-12">
                  <div className="card">
                      <h5>My Equipment</h5>

                      {/* Search & Filter */}
                      <div className="flex mb-4 gap-3">
                          <InputText
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search by name..."
                          />
                          <Dropdown
                              value={selectedType}
                              options={[
                                  { label: "Show All", value: null },
                                  ...equipmentTypes.map((t) => ({ label: t.name, value: t.id }))
                              ]}
                              onChange={(e) => setSelectedType(e.value)}
                              placeholder="Filter by Type"
                              className="w-full md:w-20rem"
                          />
                      </div>

                      {/* Equipment Table */}
                      <DataTable value={filteredEquipment} paginator rows={5} responsiveLayout="scroll">
                          <Column field="name" header="Equipment Name" sortable />
                          <Column field="typeId" header="Type" body={(data) => getTypeName(data.typeId)} sortable />
                          <Column field="description" header="Description" />
                          <Column field="createdAt" header="Created At" body={(data) => new Date(data.createdAt).toLocaleDateString()} />
                          <Column
                              header="Actions"
                              body={(data) => (
                                  <div className="flex gap-2">
                                      <Button icon="pi pi-pencil" className="p-button-warning p-button-sm" onClick={() => handleEdit(data.id)} />
                                      <Button icon="pi pi-trash" className="p-button-danger p-button-sm" onClick={() => confirmDeleteEquipment(data)} />
                                  </div>
                              )}
                          />
                      </DataTable>
                  </div>
              </div>

              {/* Delete Confirmation Dialog */}
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
          </div>
        </ProtectedRoute>
    );
};

export default EquipmentPage;
