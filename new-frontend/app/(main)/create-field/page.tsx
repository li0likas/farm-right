// For new-frontend/app/(main)/create-field/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import GoogleMapDraw from "../../components/GoogleMapDraw";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from "@/utils/api";
import { usePermissions } from "@/context/PermissionsContext";
import { useTranslations } from "next-intl"; // Import this

const CreateFieldPage = () => {
    const router = useRouter();
    const { hasPermission } = usePermissions();

    // Get translations
    const t = useTranslations('common');
    const cf = useTranslations('fields');

    const [fieldName, setFieldName] = useState("");
    const [fieldCropOptions, setFieldCropOptions] = useState([]);
    const [fieldCrop, setFieldCrop] = useState("");
    const [fieldBoundary, setFieldBoundary] = useState(null);
    const [fieldArea, setFieldArea] = useState("");
    const [fieldPerimeter, setFieldPerimeter] = useState("");
    const [existingFields, setExistingFields] = useState([]);

    useEffect(() => {
        if (!hasPermission("FIELD_CREATE")) return;
        fetchCropOptions();
        fetchExistingFields();
      }, [hasPermission]);      

    const fetchCropOptions = async () => {
        try {
            const response = await api.get("/field-crop-options");
            setFieldCropOptions(response.data.map((crop: any) => ({ label: crop.name, value: crop.id })));
        } catch (error) {
            toast.error("Failed to load crop options.");
        }
    };

    const validate = () => {
        if (!fieldName || !fieldArea || !fieldPerimeter || !fieldCrop || !fieldBoundary) {
            toast.warning("Please fill in all required fields.");
            return false;
        }
        return true;
    };

    const fetchExistingFields = async () => {
        try {
          const response = await api.get("/fields");
          setExistingFields(response.data);
        } catch (error) {
          toast.error("Failed to load existing fields.");
        }
      };      

    const createField = async () => {
        if (!hasPermission("FIELD_CREATE")) return;
        if (!validate()) return;

        const formData = {
            name: fieldName,
            area: parseFloat(fieldArea),
            perimeter: parseFloat(fieldPerimeter),
            cropId: parseInt(fieldCrop),
            boundary: fieldBoundary,
        };

        try {
            await api.post("/fields", formData);
            toast.success("Field created successfully.");
            router.push("/fields");
        } catch (error) {
            toast.error("Failed to create field.");
        }
    };

    if (!hasPermission("FIELD_CREATE")) {
        return (
            <ProtectedRoute>
                <div className="container mx-auto p-6 text-center text-lg text-red-600 font-semibold">
                    {cf('noPermission')}
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-6">
                <Card title={cf('title')} className="mb-6">
                    {/* Field Name */}
                    <div className="mb-4">
                        <label className="block font-bold mb-2">{cf('fieldName')}</label>
                        <InputText value={fieldName} onChange={(e) => setFieldName(e.target.value)} placeholder={cf('enterFieldName')} className="w-full" />
                    </div>

                    {/* Crop Selection */}
                    <div className="mb-4">
                        <label className="block font-bold mb-2">{cf('selectCrop')}</label>
                        <Dropdown value={fieldCrop} options={fieldCropOptions} onChange={(e) => setFieldCrop(e.value)} placeholder={cf('selectCropType')} className="w-full" />
                    </div>

                    {/* Field Boundary Drawing */}
                    <div className="mb-4">
                        <label className="block font-bold mb-2">{cf('drawBoundary')}</label>
                        <GoogleMapDraw
                        setBoundary={setFieldBoundary}
                        setFieldArea={setFieldArea}
                        setFieldPerimeter={setFieldPerimeter}
                        existingFields={existingFields}
                        />
                    </div>

                    {/* Field Area & Perimeter */}
                    {fieldArea && fieldPerimeter && (
                        <div className="mb-4">
                            <p><strong>{cf('area')}:</strong> {fieldArea} {cf('ha')}</p>
                            <p><strong>{cf('perimeter')}:</strong> {fieldPerimeter} {cf('m')}</p>
                        </div>
                    )}

                    {/* Create Field Button */}
                    <Button label={cf('createButton')} className="p-button-success w-full" onClick={createField} />
                </Card>
            </div>
        </ProtectedRoute>
    );
};

export default CreateFieldPage;