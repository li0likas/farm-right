"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataView, DataViewLayoutOptions } from "primereact/dataview";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { centroid } from "@turf/turf";
import { ProgressSpinner } from "primereact/progressspinner";
import GoogleMapComponent from "../../components/GoogleMapComponent";
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from "@/utils/api";
import { usePermissions } from "@/context/PermissionsContext";
import { useTranslations } from "next-intl";

interface Field {
  id: string;
  name: string;
  area: number;
  perimeter: number;
  cropId?: number;
  crop?: {
    id: number;
    name: string;
  };
  boundary?: any;
}

const Fields = () => {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const t = useTranslations('common');
  const f = useTranslations('fields');

  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [cropTypes, setCropTypes] = useState<any[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<number | null>(null);

  const canRead = hasPermission("FIELD_READ");
  const canCreate = hasPermission("FIELD_CREATE");
  const canViewDetails = hasPermission("FIELD_TASK_READ");

  useEffect(() => {
    if (canRead) {
      fetchFields();
      fetchCropTypes();
    }
  }, [canRead]);

  useEffect(() => {
    filterFields();
  }, [searchQuery, selectedCrop, fields]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const response = await api.get("/fields");
      setFields(response.data);
      setFilteredFields(response.data);
    } catch (error) {
      toast.error(f('fetchFieldsError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCropTypes = async () => {
    try {
      const response = await api.get("/field-crop-options");
      setCropTypes([
        { label: f('allCrops'), value: null },
        ...response.data.map((crop: any) => ({
          label: crop.name,
          value: crop.id
        }))
      ]);
    } catch (error) {
      console.error("Failed to fetch crop types:", error);
    }
  };

  const filterFields = () => {
    let filtered = [...fields];

    if (searchQuery) {
      filtered = filtered.filter(field =>
        field.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCrop) {
      filtered = filtered.filter(field => field.cropId === selectedCrop);
    }

    setFilteredFields(filtered);
  };

  const getCropTag = (field: Field) => {
    if (!field.crop) return null;
    
    const cropName = field.crop.name;
    let color = 'primary';
    
    if (cropName.toLowerCase().includes('wheat')) color = 'warning';
    else if (cropName.toLowerCase().includes('corn')) color = 'success';
    else if (cropName.toLowerCase().includes('soy')) color = 'info';
    else if (cropName.toLowerCase().includes('potato')) color = 'danger';
    
    return <Tag value={cropName} severity={color as any} className="ml-2" />;
  };

  const dataviewHeader = (
    <div className="flex flex-column md:flex-row md:justify-content-between gap-3 mb-4">
      <div className="flex flex-column md:flex-row gap-2">
        <div className="p-inputgroup">
          <span className="p-inputgroup-addon">
            <i className="pi pi-search"></i>
          </span>
          <InputText
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={f('searchPlaceholder')}
            className="w-full md:w-20rem"
          />
          {searchQuery && (
            <Button 
              icon="pi pi-times" 
              className="p-button-outlined" 
              onClick={() => setSearchQuery('')}
            />
          )}
        </div>
        
        <Dropdown
          value={selectedCrop}
          options={cropTypes}
          onChange={(e) => setSelectedCrop(e.value)}
          placeholder={f('filterByCrop')}
          className="w-full md:w-15rem"
        />
      </div>
      
      <div className="flex gap-2">
        <Button
          label={f('viewOnMap')}
          icon="pi pi-map"
          className="p-button-outlined p-button-primary"
          onClick={() => router.push("/fields/map")}
        />
        
        {canCreate && (
          <Button
            label={f('createButton')}
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => router.push("/create-field")}
          />
        )}
        
        <DataViewLayoutOptions 
          layout={layout} 
          onChange={(e) => setLayout(e.value as "grid" | "list")} 
        />
      </div>
    </div>
  );

  const dataviewGridItem = (field: Field) => {
    const fieldCenter = field.boundary 
      ? centroid(field.boundary).geometry.coordinates 
      : [23.8813, 55.1694];
      
    const center = { lat: fieldCenter[1], lng: fieldCenter[0] };

    return (
      <div className="col-12 sm:col-6 lg:col-4 xl:col-3 p-2">
        <Card className="h-full shadow-2 border-round-lg hover:shadow-4 transition-all transition-duration-300">
          <div className="flex flex-column h-full">
            {/* Map Preview */}
            <div className="field-map-preview border-round-top overflow-hidden" style={{ height: '160px' }}>
              <GoogleMapComponent center={center} boundary={field.boundary} />
            </div>

            {/* Field Info */}
            <div className="p-3 flex flex-column flex-1">
              <div className="flex align-items-center">
                <h3 className="text-xl font-semibold m-0 text-primary flex-1">{field.name}</h3>
                {getCropTag(field)}
              </div>

              <div className="field-stats my-3 flex gap-2">
                <div className="stat-item bg-gray-100 p-2 flex-1 border-round text-center">
                  <div className="text-lg font-bold">{field.area.toFixed(2)}</div>
                  <div className="text-xs text-600">{f('ha')}</div>
                </div>
                <div className="stat-item bg-gray-100 p-2 flex-1 border-round text-center">
                  <div className="text-lg font-bold">{field.perimeter.toFixed(0)}</div>
                  <div className="text-xs text-600">{f('m')}</div>
                </div>
              </div>

              {/* Action Button */}
              {canViewDetails && (
                <Button
                  label={f('moreInfo')}
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  className="p-button-outlined mt-auto"
                  onClick={() => router.push(`/fields/${field.id}`)}
                />
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const dataviewListItem = (field: Field) => {
    const fieldCenter = field.boundary 
      ? centroid(field.boundary).geometry.coordinates 
      : [23.8813, 55.1694];
      
    const center = { lat: fieldCenter[1], lng: fieldCenter[0] };

    return (
      <div className="col-12 my-2">
        <Card className="shadow-2 border-round-lg">
          <div className="grid">
            <div className="col-12 md:col-4 flex align-items-center justify-content-center p-0 overflow-hidden" style={{ height: '200px' }}>
              <GoogleMapComponent center={center} boundary={field.boundary} />
            </div>
            
            <div className="col-12 md:col-8 flex flex-column p-3">
              <div className="flex align-items-center mb-3">
                <h3 className="text-xl font-semibold m-0 text-primary flex-1">{field.name}</h3>
                {getCropTag(field)}
              </div>
              
              <div className="grid">
                <div className="col-6 md:col-3">
                  <div className="flex flex-column mb-3">
                    <span className="text-sm text-500">{f('area')}</span>
                    <span className="text-lg font-medium">{field.area.toFixed(2)} {f('ha')}</span>
                  </div>
                </div>
                <div className="col-6 md:col-3">
                  <div className="flex flex-column mb-3">
                    <span className="text-sm text-500">{f('perimeter')}</span>
                    <span className="text-lg font-medium">{field.perimeter.toFixed(0)} {f('m')}</span>
                  </div>
                </div>
                <div className="col-6 md:col-6">
                  <div className="flex flex-column mb-3">
                    <span className="text-sm text-500">{f('currentCrop')}</span>
                    <span className="text-lg font-medium">{field.crop?.name || f('notSpecified')}</span>
                  </div>
                </div>
              </div>
              
              {canViewDetails && (
                <div className="flex justify-content-end mt-auto">
                  <Button
                    label={f('moreInfo')}
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    onClick={() => router.push(`/fields/${field.id}`)}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-column align-items-center justify-content-center py-6">
      <div className="text-center p-5 surface-card border-round shadow-2 mb-4">
        <i className="pi pi-map-marker text-6xl text-blue-300 mb-4"></i>
        <h2 className="text-xl font-semibold mb-2">{f('noFieldsFound')}</h2>
        <p className="text-gray-600 mb-5">{f('noFieldsDescription')}</p>
        {canCreate && (
          <div className="flex justify-content-center">
            <Button
              label={f('createFirstField')}
              icon="pi pi-plus"
              className="p-button-success"
              onClick={() => router.push("/create-field")}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (!canRead) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-6 text-center text-lg text-red-600 font-semibold">
          <i className="pi pi-lock text-4xl mb-4"></i>
          <p>{f('noPermission')}</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="grid">
        <div className="col-12">
          <div className="card">
            <div className="flex justify-content-between align-items-center mb-3">
              <h2 className="text-2xl font-bold text-primary m-0">{f('myFields')}</h2>
              <div className="text-xs text-gray-500">
                {filteredFields.length > 0 && 
                  <span>{f('totalArea')}: {filteredFields.reduce((sum, field) => sum + field.area, 0).toFixed(2)} {f('ha')}</span>
                }
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                <ProgressSpinner />
              </div>
            ) : (
              <>
                {dataviewHeader}
                
                {filteredFields.length === 0 ? (
                  renderEmptyState()
                ) : (
                  <DataView
                    value={filteredFields}
                    layout={layout}
                    paginator
                    rows={12}
                    itemTemplate={(field) => layout === 'grid' ? dataviewGridItem(field) : dataviewListItem(field)}
                    emptyMessage={renderEmptyState()}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Fields;