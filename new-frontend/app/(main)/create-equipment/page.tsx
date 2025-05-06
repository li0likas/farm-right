'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressSpinner } from 'primereact/progressspinner';
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from '@/utils/api';
import { usePermissions } from "@/context/PermissionsContext";
import { useTranslations } from 'next-intl';

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
    const [fetchingTypes, setFetchingTypes] = useState(true);

    useEffect(() => {
        if (!hasPermission("EQUIPMENT_CREATE")) return;
        fetchEquipmentTypes();
    }, [hasPermission]);

    const fetchEquipmentTypes = async () => {
        setFetchingTypes(true);
        try {
            const response = await api.get('/equipment-type-options');
            setEquipmentTypes(response.data);
        } catch (error) {
            console.error('Error fetching equipment types:', error);
            toast.error(e('fetchTypesError'));
        } finally {
            setFetchingTypes(false);
        }
    };

    // Function to get localized type name
    const getLocalizedTypeName = (type: EquipmentType) => {
        const translation = e(`types.${type.name}`);
        // If translation key doesn't exist, return original name
        if (translation === `types.${type.name}`) {
            return type.name;
        }
        return translation;
    };

    const handleCreateEquipment = async () => {
        if (!hasPermission("EQUIPMENT_CREATE")) return; 

        if (!name || !type) {
            toast.warning(e('fieldsRequired'));
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
          toast.success(e('createSuccess'));
          router.push('/equipment');
        } catch (error) {
          toast.error(e('createError'));
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
                    {fetchingTypes ? (
                        <div className="flex justify-content-center">
                            <ProgressSpinner />
                        </div>
                    ) : (
                        <>
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
                                    options={equipmentTypes.map((t) => ({ 
                                        label: getLocalizedTypeName(t), 
                                        value: t.id 
                                    }))}
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
                                label={loading ? e('creating') : e('createButton')} 
                                icon={loading ? "pi pi-spin pi-spinner" : "pi pi-plus"}
                                className="p-button-success w-full" 
                                onClick={handleCreateEquipment} 
                                disabled={loading || !name || !type} 
                            />
                        </>
                    )}
                </Card>
            </div>
        </ProtectedRoute>
    );
};

export default CreateEquipmentPage;