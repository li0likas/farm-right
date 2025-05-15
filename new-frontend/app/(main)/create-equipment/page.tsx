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
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!hasPermission("EQUIPMENT_CREATE")) {
            setFetchingTypes(false);
            return;
        }
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

    const getLocalizedTypeName = (type: EquipmentType) => {
        const translationKey = `types.${type.name}`;
        const translation = e(translationKey);
        return translation !== translationKey ? translation : type.name;
    };

    const handleCreateEquipment = async () => {
        if (!hasPermission("EQUIPMENT_CREATE")) return; 

        if (!name || !type) {
            toast.warning(e('fieldsRequired'));
            return;
        }

        setSubmitting(true);
      
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
            setSubmitting(false);
        }
    };

    if (!hasPermission("EQUIPMENT_CREATE")) {
        return (
            <ProtectedRoute>
                <div className="grid">
                    <div className="col-12">
                        <Card className="shadow-4">
                            <div className="flex flex-column align-items-center py-6">
                                <i className="pi pi-lock text-yellow-500 text-5xl mb-4"></i>
                                <h3 className="text-xl font-semibold mb-2">{e('noPermission')}</h3>
                                <p className="text-gray-600 mb-4">{e('contactAdminForAccess')}</p>
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
                        <div className="flex align-items-center mb-4">
                            <Button 
                                icon="pi pi-arrow-left" 
                                className="p-button-text p-button-rounded mr-2" 
                                onClick={() => router.push('/equipment')}
                                tooltip={e('backToEquipment')}
                            />
                            <h2 className="text-2xl font-bold m-0">
                                <i className="pi pi-plus-circle text-green-500 mr-2"></i>
                                {e('title')}
                            </h2>
                        </div>

                        {fetchingTypes ? (
                            <div className="flex flex-column justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                <span className="mt-3 text-lg text-600">{e('loadingEquipmentTypes')}</span>
                            </div>
                        ) : (
                            <div className="p-fluid">
                                <div className="grid">
                                    <div className="col-12 md:col-6">
                                        {/* Equipment Name */}
                                        <div className="field mb-4">
                                            <label htmlFor="name" className="block font-bold mb-2">
                                                {e('equipmentName')} <span className="text-red-500">*</span>
                                            </label>
                                            <InputText 
                                                id="name"
                                                value={name} 
                                                onChange={(e) => setName(e.target.value)} 
                                                placeholder={e('enterEquipmentName')} 
                                                className="w-full" 
                                            />
                                        </div>
                                    </div>

                                    <div className="col-12 md:col-6">
                                        {/* Equipment Type Selection */}
                                        <div className="field mb-4">
                                            <label htmlFor="type" className="block font-bold mb-2">
                                                {e('selectEquipmentType')} <span className="text-red-500">*</span>
                                            </label>
                                            <Dropdown
                                                id="type"
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
                                    </div>

                                    <div className="col-12">
                                        {/* Equipment Description */}
                                        <div className="field mb-4">
                                            <label htmlFor="description" className="block font-bold mb-2">
                                                {e('description')} ({t('optional')})
                                            </label>
                                            <InputTextarea 
                                                id="description"
                                                value={description} 
                                                onChange={(e) => setDescription(e.target.value)} 
                                                placeholder={e('enterDescription')} 
                                                className="w-full" 
                                                rows={4} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-content-between gap-2 mt-4">
                                    <Button 
                                        label={t('cancel')}
                                        icon="pi pi-times"
                                        className="p-button-text"
                                        onClick={() => router.push('/equipment')}
                                    />
                                    <Button 
                                        label={submitting ? e('creating') : e('createButton')} 
                                        icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
                                        className="p-button-success" 
                                        onClick={handleCreateEquipment} 
                                        disabled={submitting || !name || !type} 
                                        loading={submitting}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default CreateEquipmentPage;