// For new-frontend/app/(main)/create-equipment/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from '@/utils/api';
import { usePermissions } from "@/context/PermissionsContext";
import { useTranslations } from 'next-intl'; // Import this

interface EquipmentType {
    id: number;
    name: string;
}

const CreateEquipmentPage = () => {
    const router = useRouter();
    const { hasPermission } = usePermissions();
    
    // Get translations
    const t = useTranslations('common');
    const e = useTranslations('equipment');

    const [name, setName] = useState('');
    const [type, setType] = useState<number | null>(null);
    const [description, setDescription] = useState('');
    const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!hasPermission("EQUIPMENT_CREATE")) return;
        fetchEquipmentTypes();
    }, [hasPermission]);

    const fetchEquipmentTypes = async () => {
        try {
            const response = await api.get('/equipment-type-options');
            setEquipmentTypes(response.data);
        } catch (error) {
            console.error('Error fetching equipment types:', error);
            toast.error('Failed to load equipment types.');
        }
    };

    const handleCreateEquipment = async () => {
        if (!hasPermission("EQUIPMENT_CREATE")) return; 

        if (!name || !type) {
            toast.warning('Please fill in all required fields.');
            return;
        }

        setLoading(true);
      
        const formData = {
          name: name,
          typeId: type,
          description,
        };
      
        try {
          await api.post('/equipment', formData);
          toast.success("Equipment created successfully.");
          router.push('/equipment');
        } catch (error) {
          toast.error("Failed to create equipment.");
        } finally {
            setLoading(false);
        }
    };

    if (!hasPermission("EQUIPMENT_CREATE")) {
        return (
            <ProtectedRoute>
                <div className="container mx-auto p-6 text-center text-lg text-red-600 font-semibold">
                    {e('noPermission')}
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-6">
                <Card title={e('title')} className="mb-6">
                    {/* Equipment Name */}
                    <div className="mb-4">
                        <label className="block font-bold mb-2">{e('equipmentName')}</label>
                        <InputText 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder={e('enterEquipmentName')} 
                            className="w-full" 
                        />
                    </div>

                    {/* Equipment Type Selection */}
                    <div className="mb-4">
                        <label className="block font-bold mb-2">{e('selectEquipmentType')}</label>
                        <Dropdown
                            value={type}
                            options={equipmentTypes.map((t) => ({ label: t.name, value: t.id }))}
                            onChange={(e) => setType(e.value)}
                            placeholder={e('selectType')}
                            className="w-full"
                        />
                    </div>

                    {/* Equipment Description */}
                    <div className="mb-4">
                        <label className="block font-bold mb-2">{e('description')} ({t('optional')})</label>
                        <InputTextarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder={e('enterDescription')} 
                            className="w-full" 
                            rows={3} 
                        />
                    </div>

                    {/* Create Equipment Button */}
                    <Button 
                        label={e('createButton')} 
                        className="p-button-success w-full" 
                        onClick={handleCreateEquipment} 
                        loading={loading} 
                    />
                </Card>
            </div>
        </ProtectedRoute>
    );
};

export default CreateEquipmentPage;