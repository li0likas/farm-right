'use client';

import React, { useState, useEffect } from 'react';
import { FileUpload } from 'primereact/fileupload';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { toast } from 'sonner';
import axios from 'axios';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { useTranslations } from 'next-intl'; // Import this

const CropHealthPage = () => {
  // Get translations
  const t = useTranslations('common');
  const ch = useTranslations('cropHealth');

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [fieldOptions, setFieldOptions] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    api.get('/fields')
      .then(res => {
        const options = res.data.map((field: any) => ({
          label: field.name,
          value: field.id,
        }));
        setFieldOptions(options);
      })
      .catch(() => toast.error('Failed to fetch fields'));
  }, []);

  const confirmDiseaseTask = async () => {
    if (!selectedField || !selectedDisease) {
      toast.warning("Please select a field");
      return;
    }

    const fieldLabel = fieldOptions.find(f => f.value === selectedField)?.label || 'laukas';

    setGenerating(true);
    try {
      const response = await api.post("/ai/crop-health-task-description", {
        rawText: `Liga: ${selectedDisease}. Laukas: ${fieldLabel}.`
      });

      const description = response.data.refinedTaskDescription;

      localStorage.setItem("pendingTaskData", JSON.stringify({
        description,
        disease: selectedDisease,
        fieldId: selectedField
      }));

      setShowFieldDialog(false);
      router.push('/create-task');
    } catch (error) {
      toast.error("Failed to generate task description");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateTaskFromDisease = (diseaseName: string) => {
    setSelectedDisease(diseaseName);
    setShowFieldDialog(true);
  };

  const handleImagePreview = (file: File) => {
    setUploadedFile(file);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async ({ files }: any) => {
    const imageFile = files[0];
    if (!imageFile) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      setImagePreview(reader.result as string);
      setLoading(true);

      try {
        const response = await axios.post(
          'https://api.plant.id/v2/health_assessment',
          {
            images: [base64String],
            modifiers: ['crops_fast', 'similar_images', 'disease'],
            plant_details: ['common_names', 'url', 'taxonomy', 'wiki_description']
          },
          {
            headers: {
              'Api-Key': process.env.NEXT_PUBLIC_PLANT_ID_API_KEY || '',
              'Content-Type': 'application/json',
            },
          }
        );

        setResult(response.data);
      } catch (error) {
        toast.error('Failed to analyze the plant.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(imageFile);
  };

  return (
    <div className="container mx-auto p-6">
      <Card title={ch('title')} className="mb-6 shadow-md">
        <p className="text-sm text-gray-600 mb-4">
          {ch('subtitle')}
        </p>

        <FileUpload
          name="plantImage"
          accept="image/*"
          customUpload={false}
          onSelect={(e) => handleImagePreview(e.files?.[0])}
          chooseLabel={ch('chooseCropImage')}
          mode="basic"
        />

        {uploadedFile && (
          <div className="mt-4 text-center">
            <Button
              label={`${ch('analyze')} "${uploadedFileName}"`}
              icon="pi pi-search"
              className="p-button-primary"
              onClick={() => handleFileUpload({ files: [uploadedFile] })}
            />
          </div>
        )}

        {imagePreview && (
          <div className="mt-4 text-center">
            <img src={imagePreview} alt="Uploaded crop" className="max-w-xs w-full h-auto rounded shadow mx-auto border" />
          </div>
        )}

        {loading && (
          <div className="flex justify-center mt-6">
            <ProgressSpinner />
          </div>
        )}

        {result && !loading && (
          <div className="mt-6">
            <h6 className="text-md font-semibold mb-3">{ch('diagnosisReport')}</h6>

            <div className="mb-4">
              <p><strong>{ch('plantDetected')}:</strong> {result.is_plant ? ch('yes') : ch('no')} ({(result.is_plant_probability * 100).toFixed(1)}%)</p>
              <p><strong>{ch('healthStatus')}:</strong> {result.health_assessment.is_healthy ? ch('healthy') : ch('unhealthy')} ({(result.health_assessment.is_healthy_probability * 100).toFixed(1)}%)</p>
            </div>

            <div className="mb-4">
              <p className="font-semibold mb-2">{ch('detectedDiseases')}:</p>
              <table className="w-full text-sm text-left border">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-2">{ch('disease')}</th>
                    <th className="p-2">{ch('probability')}</th>
                    <th className="p-2">{ch('similarImages')}</th>
                    <th className="p-2">{ch('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.health_assessment.diseases.map((disease: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50 align-top">
                      <td className="p-2 font-medium">{disease.name}</td>
                      <td className="p-2">{(disease.probability * 100).toFixed(1)}%</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-2">
                          {disease.similar_images?.map((img: any, i: number) => (
                            <a key={i} href={img.url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={img.url_small || img.url}
                                alt={`Similar example ${i + 1}`}
                                className="w-16 h-16 object-cover rounded border hover:scale-105 transition-transform"
                              />
                            </a>
                          ))}
                        </div>
                      </td>
                      <td className="p-2">
                        <Button
                          label={ch('createTask')}
                          icon="pi pi-plus"
                          className="p-button-sm p-button-outlined p-button-success"
                          onClick={() => handleCreateTaskFromDisease(disease.name)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 mt-2">Submitted on: {result.meta_data.date}</p>
            </div>
          </div>
        )}
      </Card>

      <Dialog
        header={ch('selectField')}
        visible={showFieldDialog}
        onHide={() => setShowFieldDialog(false)}
        footer={
          <>
            <Button label={t('cancel')} className="p-button-text" onClick={() => setShowFieldDialog(false)} />
            <Button
              label={ch('confirm')}
              icon="pi pi-check"
              className="p-button-success"
              onClick={confirmDiseaseTask}
              disabled={!selectedField || generating}
            />
          </>
        }
      >
        {generating ? (
          <div className="flex justify-center my-4">
            <ProgressSpinner />
            <span className="ml-3">{ch('generatingDescription')}</span>
          </div>
        ) : (
          <Dropdown
            value={selectedField}
            options={fieldOptions}
            onChange={(e) => setSelectedField(e.value)}
            placeholder={ch('selectField')}
            className="w-full"
          />
        )}
      </Dialog>
    </div>
  );
};

export default CropHealthPage;