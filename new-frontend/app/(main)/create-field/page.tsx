"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import GoogleMapDraw from "../../components/GoogleMapDraw";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/utils/auth";
import ProtectedRoute from "@/utils/ProtectedRoute";

const CreateFieldPage = () => {
  const router = useRouter();
  const [fieldName, setFieldName] = useState("");
  const [fieldCropOptions, setFieldCropOptions] = useState([]);
  const [fieldCrop, setFieldCrop] = useState("");
  const [fieldBoundary, setFieldBoundary] = useState(null);
  const [fieldArea, setFieldArea] = useState("");
  const [fieldPerimeter, setFieldPerimeter] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      toast.error("Unauthorized. Login first.");
      return;
    }
    fetchCropOptions();
  }, []);

  const getAuthHeaders = () => {
    const accessToken = localStorage.getItem("accessToken");
    const selectedFarmId = localStorage.getItem("x-selected-farm-id");

    if (!accessToken || !selectedFarmId) {
      toast.error("Missing authentication or farm selection.");
      return null;
    }

    return {
      Authorization: `Bearer ${accessToken}`,
      "x-selected-farm-id": selectedFarmId,
    };
  };

  const fetchCropOptions = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/field-crop-options`, { headers });
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

    const headers = getAuthHeaders();
    if (!headers) return;

    const formData = {
      name: fieldName,
      area: parseFloat(fieldArea),
      perimeter: parseFloat(fieldPerimeter),
      cropId: parseInt(fieldCrop),
      farmId: parseInt(headers["x-selected-farm-id"]),
      boundary: fieldBoundary,
    };

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/fields`, formData, { headers });
      toast.success("Field created successfully.");
      router.push("/fields");
    } catch (error) {
      if (error.response?.status === 403) {
        window.location.href = "/pages/unauthorized";
      } else {
        toast.error("Failed to create field.");
      }
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
