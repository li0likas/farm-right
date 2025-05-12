"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";
import GoogleMapDraw from "../../components/GoogleMapDraw";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from "@/utils/api";
import { usePermissions } from "@/context/PermissionsContext";
import { useTranslations } from "next-intl";

const CreateFieldPage = () => {
    const router = useRouter();
    const { hasPermission } = usePermissions();

    // Get translations
    const t = useTranslations('common');
    const f = useTranslations('fields');

    const [fieldName, setFieldName] = useState("");
    const [fieldCropOptions, setFieldCropOptions] = useState([]);
    const [fieldCrop, setFieldCrop] = useState("");
    const [fieldBoundary, setFieldBoundary] = useState(null);
    const [fieldArea, setFieldArea] = useState("");
    const [fieldPerimeter, setFieldPerimeter] = useState("");
    const [existingFields, setExistingFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!hasPermission("FIELD_CREATE")) {
            setLoading(false);
            return;
        }
        fetchInitialData();
    }, [hasPermission]);
    
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchCropOptions(), fetchExistingFields()]);
        } catch (error) {
            console.error("Error fetching initial data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCropOptions = async () => {
        try {
            const response = await api.get("/field-crop-options");
            setFieldCropOptions(response.data.map((crop: any) => ({ label: crop.name, value: crop.id })));
        } catch (error) {
            toast.error(f('failedToLoadCropOptions'));
        }
    };

    const validate = () => {
        if (!fieldName || !fieldArea || !fieldPerimeter || !fieldCrop || !fieldBoundary) {
            toast.warning(f('fillAllRequiredFields'));
            return false;
        }
        return true;
    };

    const fetchExistingFields = async () => {
        try {
            const response = await api.get("/fields");
            setExistingFields(response.data);
        } catch (error) {
            toast.error(f('failedToLoadExistingFields'));
        }
    };

    const createField = async () => {
        if (!hasPermission("FIELD_CREATE")) return;
        if (!validate()) return;

        setSubmitting(true);
        const formData = {
            name: fieldName,
            area: parseFloat(fieldArea),
            perimeter: parseFloat(fieldPerimeter),
            cropId: parseInt(fieldCrop),
            boundary: fieldBoundary,
        };

        try {
            await api.post("/fields", formData);
            toast.success(f('fieldCreatedSuccess'));
            router.push("/fields");
        } catch (error) {
            toast.error(f('fieldCreatedError'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex justify-content-center align-items-center min-h-screen">
                    <ProgressSpinner />
                </div>
            </ProtectedRoute>
        );
    }

    if (!hasPermission("FIELD_CREATE")) {
        return (
            <ProtectedRoute>
                <div className="container mx-auto p-6">
                    <Card className="text-center">
                        <i className="pi pi-lock text-red-500 text-4xl mb-3"></i>
                        <h3 className="text-xl font-semibold mb-2">{f('noPermissionCreate')}</h3>
                        <p className="text-gray-600 mb-3">{f('contactAdminForAccess')}</p>
                        <Button
                            label={f('backToFields')}
                            icon="pi pi-arrow-left"
                            className="p-button-outlined"
                            onClick={() => router.push('/fields')}
                        />
                    </Card>
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
                                onClick={() => router.push('/fields')}
                                tooltip={f('backToFields')}
                            />
                            <h2 className="text-2xl font-bold m-0">{f('createTitle')}</h2>
                        </div>

                        {/* Field Name */}
                        <div className="mb-4">
                            <label className="block font-bold mb-2">{f('fieldName')} <span className="text-red-500">*</span></label>
                            <InputText 
                                value={fieldName} 
                                onChange={(e) => setFieldName(e.target.value)} 
                                placeholder={f('enterFieldName')} 
                                className="w-full" 
                            />
                        </div>

                        {/* Crop Selection */}
                        <div className="mb-4">
                            <label className="block font-bold mb-2">{f('selectCrop')} <span className="text-red-500">*</span></label>
                            <Dropdown 
                                value={fieldCrop} 
                                options={fieldCropOptions} 
                                onChange={(e) => setFieldCrop(e.value)} 
                                placeholder={f('selectCropType')} 
                                className="w-full" 
                            />
                        </div>

                        {/* Field Boundary Drawing */}
                        <div className="mb-4">
                            <label className="block font-bold mb-2">{f('drawBoundary')} <span className="text-red-500">*</span></label>
                            <div className="p-3 bg-blue-50 border-round mb-3">
                                <i className="pi pi-info-circle text-blue-500 mr-2"></i>
                                <span className="text-gray-700">{f('drawInstructions')}</span>
                            </div>
                            <GoogleMapDraw
                                setBoundary={setFieldBoundary}
                                setFieldArea={setFieldArea}
                                setFieldPerimeter={setFieldPerimeter}
                                existingFields={existingFields}
                            />
                        </div>

                        {/* Field Area & Perimeter */}
                        {fieldArea && fieldPerimeter && (
                            <div className="mb-4 grid">
                                <div className="col-12 md:col-6">
                                    <div className="p-3 bg-green-50 border-round">
                                        <div className="flex align-items-center">
                                            <i className="pi pi-chart-bar text-green-500 text-xl mr-2"></i>
                                            <div>
                                                <p className="text-gray-600 m-0">{f('area')}</p>
                                                <p className="text-xl font-bold m-0">{fieldArea} {f('ha')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 md:col-6">
                                    <div className="p-3 bg-blue-50 border-round">
                                        <div className="flex align-items-center">
                                            <i className="pi pi-circle-fill text-blue-500 text-xl mr-2"></i>
                                            <div>
                                                <p className="text-gray-600 m-0">{f('perimeter')}</p>
                                                <p className="text-xl font-bold m-0">{fieldPerimeter} {f('m')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-content-between gap-2 mt-4">
                            <Button 
                                label={t('cancel')}
                                icon="pi pi-times"
                                className="p-button-text"
                                onClick={() => router.push('/fields')}
                            />
                            <Button 
                                label={f('createButton')} 
                                icon="pi pi-check"
                                className="p-button-success" 
                                onClick={createField}
                                loading={submitting}
                                disabled={submitting}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default CreateFieldPage;