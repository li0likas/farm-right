"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataView, DataViewLayoutOptions } from "primereact/dataview";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { centroid } from "@turf/turf";
import GoogleMapComponent from "../../components/GoogleMapComponent";
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from "@/utils/api";
import { usePermissions } from "@/context/PermissionsContext";
import { useTranslations } from "next-intl"; // ✅ Add translation hook

interface Field {
  id: string;
  name: string;
  area: number;
  perimeter: number;
  boundary?: any;
}

const Fields = () => {
  const router = useRouter();
  const { hasPermission, permissions } = usePermissions();

  const t = useTranslations('common');
  const f = useTranslations('fields');

  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const canRead = hasPermission("FIELD_READ");
  const canCreate = hasPermission("FIELD_CREATE");
  const canViewDetails = hasPermission("FIELD_TASK_READ");

  useEffect(() => {
    if (canRead) fetchFields();
  }, [permissions]);

  const fetchFields = async () => {
    try {
      const response = await api.get("/fields");
      setFields(response.data);
      setFilteredFields(response.data);
    } catch (error) {
      toast.error(f('fetchFieldsError'));
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (!value) {
      setFilteredFields(fields);
    } else {
      setFilteredFields(fields.filter((field) => field.name.toLowerCase().includes(value.toLowerCase())));
    }
  };

  if (!canRead) {
    return (
      <div className="container mx-auto p-6 text-center text-lg text-red-600 font-semibold">
        🚫 {f('noPermission')}
      </div>
    );
  }

  const dataViewHeader = (
    <div className="flex flex-column md:flex-row md:justify-content-between gap-2">
      <InputText
        value={searchQuery}
        onChange={handleSearch}
        placeholder={f('searchPlaceholder')}
      />
      {canCreate && (
        <Button
          label={f('createButton')}
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => router.push("/create-field")}
        />
      )}
      <DataViewLayoutOptions layout={layout} onChange={(e) => setLayout(e.value as "grid" | "list")} />
    </div>
  );

  const dataviewListItem = (field: Field) => {
    const fieldCenter = field.boundary ? centroid(field.boundary).geometry.coordinates : [55.1694, 23.8813];
    const center = { lat: fieldCenter[1], lng: fieldCenter[0] };

    return (
      <div className="col-12">
        <div className="flex flex-column md:flex-row align-items-center p-3 w-full border-1 surface-border">
          <div className="flex-1 flex flex-column align-items-center text-center md:text-left">
            <h3 className="font-bold text-2xl">{field.name}</h3>
            <p>{f('area')}: {field.area} {f('ha')}</p>
            <p>{f('perimeter')}: {field.perimeter} {f('m')}</p>
            <GoogleMapComponent center={center} boundary={field.boundary} />
          </div>
          <div className="flex flex-row md:flex-column justify-content-between w-full md:w-auto align-items-center md:align-items-end mt-5 md:mt-0">
            {canViewDetails && (
              <Button
                label={f('moreInfo')}
                className="p-button-primary"
                onClick={() => router.push(`/fields/${field.id}`)}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const dataviewGridItem = (field: Field) => {
    const fieldCenter = field.boundary ? centroid(field.boundary).geometry.coordinates : [55.1694, 23.8813];
    const center = { lat: fieldCenter[1], lng: fieldCenter[0] };

    return (
      <div className="col-12 lg:col-4">
        <div className="card m-3 border-1 surface-border">
          <h3 className="text-xl font-bold">{field.name}</h3>
          <p>{f('area')}: {field.area} {f('ha')}</p>
          <p>{f('perimeter')}: {field.perimeter} {f('m')}</p>
          <GoogleMapComponent center={center} boundary={field.boundary} />
          <div className="mt-3">
            {canViewDetails && (
              <Button
                label={f('moreInfo')}
                className="p-button-primary"
                onClick={() => router.push(`/fields/${field.id}`)}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const itemTemplate = (field: Field, layout: "grid" | "list") => {
    if (!field) return null;
    return layout === "list" ? dataviewListItem(field) : dataviewGridItem(field);
  };

  return (
    <ProtectedRoute>
      <div className="grid">
        <div className="col-12">
          <div className="card">
            <h5>{f('myFields')}</h5>
            <DataView
              value={filteredFields}
              layout={layout}
              paginator
              rows={9}
              itemTemplate={itemTemplate}
              header={dataViewHeader}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Fields;
