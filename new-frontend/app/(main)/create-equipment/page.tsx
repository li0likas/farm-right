'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import ProtectedRoute from "@/utils/ProtectedRoute";

interface EquipmentType {
    id: number;
    name: string;
}

const CreateEquipmentPage = () => {
    const router = useRouter();
    const [name, setName] = useState('');
    const [type, setType] = useState<number | null>(null);
    const [description, setDescription] = useState('');
    const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEquipmentTypes();
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

    const fetchEquipmentTypes = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/equipment-type-options`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEquipmentTypes(response.data);
        } catch (error) {
            console.error('Error fetching equipment types:', error);
            toast.error('Failed to load equipment types.');
        }
    };

    const handleCreateEquipment = async () => {
        if (!name || !type) {
            toast.warning("Please fill in all required fields.");
          return;
        }

        setLoading(true);
      
        const headers = getAuthHeaders();
        if (!headers) return;
      
        const formData = {
          name: name,
          typeId: type,
          description,
        };
      
        try {
          await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/equipment`, formData, { headers });
          toast.success("Equipment created successfully.");
          router.push('/equipment'); // Redirect to the equipment list
        } catch (error) {
          toast.error("Failed to create equipment.");
        } finally {
            setLoading(false);
        }
      };
    

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-6">
                <Card title="Create Equipment" className="mb-6">
                    {/* Equipment Name */}
                    <div className="mb-4">
                        <label className="block font-bold mb-2">Equipment Name</label>
                        <InputText value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter equipment name" className="w-full" />
                    </div>

                    {/* Equipment Type Selection */}
                    <div className="mb-4">
                        <label className="block font-bold mb-2">Select Equipment Type</label>
                        <Dropdown
                            value={type}
                            options={equipmentTypes.map((t) => ({ label: t.name, value: t.id }))}
                            onChange={(e) => setType(e.value)}
                            placeholder="Select equipment type"
                            className="w-full"
                        />
                    </div>

                    {/* Equipment Description */}
                    <div className="mb-4">
                        <label className="block font-bold mb-2">Description (optional)</label>
                        <InputTextarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter equipment description" className="w-full" rows={3} />
                    </div>

                    {/* Create Equipment Button */}
                    <Button label="Create Equipment" className="p-button-success w-full" onClick={handleCreateEquipment} loading={loading} />
                </Card>
            </div>
        </ProtectedRoute>
    );
};

export default CreateEquipmentPage;
