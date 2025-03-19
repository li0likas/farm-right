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
import api from "@/utils/api"; // ✅ Use API instance with interceptor

const CreateFieldPage = () => {
  const router = useRouter();
  const [fieldName, setFieldName] = useState("");
  const [fieldCropOptions, setFieldCropOptions] = useState([]);
  const [fieldCrop, setFieldCrop] = useState("");
  const [fieldBoundary, setFieldBoundary] = useState(null);
  const [fieldArea, setFieldArea] = useState("");
  const [fieldPerimeter, setFieldPerimeter] = useState("");

  useEffect(() => {
    fetchCropOptions();
  }, []);

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

  const createField = async () => {
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

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <Card title="Create a Field" className="mb-6">
          {/* Field Name */}
          <div className="mb-4">
            <label className="block font-bold mb-2">Field Name</label>
            <InputText value={fieldName} onChange={(e) => setFieldName(e.target.value)} placeholder="Enter field name" className="w-full" />
          </div>

          {/* Crop Selection */}
          <div className="mb-4">
            <label className="block font-bold mb-2">Select Crop</label>
            <Dropdown value={fieldCrop} options={fieldCropOptions} onChange={(e) => setFieldCrop(e.value)} placeholder="Select a crop" className="w-full" />
          </div>

          {/* Field Boundary Drawing */}
          <div className="mb-4">
            <label className="block font-bold mb-2">Draw Field Boundary</label>
            <GoogleMapDraw setBoundary={setFieldBoundary} setFieldArea={setFieldArea} setFieldPerimeter={setFieldPerimeter} />
          </div>

          {/* Field Area & Perimeter */}
          {fieldArea && fieldPerimeter && (
            <div className="mb-4">
              <p><strong>Area:</strong> {fieldArea} ha</p>
              <p><strong>Perimeter:</strong> {fieldPerimeter} m</p>
            </div>
          )}

          {/* Create Field Button */}
          <Button label="Create Field" className="p-button-success w-full" onClick={createField} />
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default CreateFieldPage;
