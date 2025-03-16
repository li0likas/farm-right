'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DataView, DataViewLayoutOptions } from 'primereact/dataview';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { centroid } from '@turf/turf';
import GoogleMapComponent from '../../components/GoogleMapComponent';
import ProtectedRoute from "@/utils/ProtectedRoute";
import { isLoggedIn } from "@/utils/auth";

interface Field {
    id: string;
    name: string;
    area: number;
    perimeter: number;
    boundary?: any;
}

const Fields = () => {
    const router = useRouter();
    const [fields, setFields] = useState<Field[]>([]);
    const [filteredFields, setFilteredFields] = useState<Field[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        if (!isLoggedIn()) {
            toast.error('Unauthorized. Login first.');
            return;
        }

        fetchFields();
    }, []);

    const fetchFields = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');    
            const selectedFarmId = localStorage.getItem('x-selected-farm-id'); // ✅ Get farmId    
            if (!selectedFarmId) {
                toast.error("No farm selected!");
                return;
            }
            
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/fields`, {
                headers: { 
                    Authorization: `Bearer ${accessToken}`,
                    'x-selected-farm-id': selectedFarmId // ✅ Corrected header key
                }
            });
            setFields(response.data);
            setFilteredFields(response.data);
        } catch (error) {
            if (error.response?.status === 403) {
                window.location.href = '/pages/unauthorized'; // ✅ Redirect on 403
            } else {
                toast.error("Failed to fetch fields.");
            }
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        if (!value) {
            setFilteredFields(fields);
        } else {
            setFilteredFields(fields.filter(field => field.name.toLowerCase().includes(value.toLowerCase())));
        }
    };

    const dataViewHeader = (
        <div className="flex flex-column md:flex-row md:justify-content-between gap-2">
            <InputText value={searchQuery} onChange={handleSearch} placeholder="Search fields by name" />
            <Button label="Create Field" icon="pi pi-plus" className="p-button-success" onClick={() => router.push('/create-field')} />
            <DataViewLayoutOptions layout={layout} onChange={(e) => setLayout(e.value as 'grid' | 'list')} />
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
                        <p>Area: {field.area} hectares</p>
                        <p>Perimeter: {field.perimeter} meters</p>
                        <GoogleMapComponent center={center} boundary={field.boundary} />
                    </div>
                    <div className="flex flex-row md:flex-column justify-content-between w-full md:w-auto align-items-center md:align-items-end mt-5 md:mt-0">
                        <Button label="More Info" className="p-button-primary" onClick={() => router.push(`/fields/${field.id}`)} />
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
                    <p>Area: {field.area} hectares</p>
                    <p>Perimeter: {field.perimeter} meters</p>
                    <GoogleMapComponent center={center} boundary={field.boundary} />
                    <div className="mt-3">
                        <Button label="More Info" className="p-button-primary" onClick={() => router.push(`/fields/${field.id}`)} />
                    </div>
                </div>
            </div>
        );
    };

    const itemTemplate = (field: Field, layout: 'grid' | 'list') => {
        if (!field) return null;
        return layout === 'list' ? dataviewListItem(field) : dataviewGridItem(field);
    };

    return (
        <ProtectedRoute>
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <h5>My Fields</h5>
                        <DataView value={filteredFields} layout={layout} paginator rows={9} itemTemplate={itemTemplate} header={dataViewHeader}></DataView>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default Fields;
