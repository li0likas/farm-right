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
import { useTranslations } from 'next-intl';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import ProtectedRoute from "@/utils/ProtectedRoute";
import { usePermissions } from "@/context/PermissionsContext";

interface Disease {
  name: string;
  probability: number;
  similar_images?: { url: string; url_small?: string }[];
}

const CropHealthPage = () => {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  
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
  const [hasFields, setHasFields] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const canCreateTask = hasPermission("TASK_CREATE");
  const canCreateField = hasPermission("FIELD_CREATE");

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const res = await api.get('/fields');
      const options = res.data.map((field: any) => ({
        label: field.name,
        value: field.id,
      }));
      setFieldOptions(options);
      setHasFields(options.length > 0);
    } catch (error) {
      toast.error(ch('fetchFieldsError'));
      setHasFields(false);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleImagePreview = (file: File) => {
    setUploadedFile(file);
    setUploadedFileName(file.name);
    setResult(null); 

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
        toast.error(ch('analysisError'));
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(imageFile);
  };

  const confirmDiseaseTask = async () => {
    if (!selectedField || !selectedDisease) {
      toast.warning(ch('selectFieldWarning'));
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
      toast.success(ch('taskPrepared'));
      router.push('/create-task');
    } catch (error) {
      toast.error(ch('descriptionError'));
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateTaskFromDisease = (diseaseName: string) => {
    if (!hasFields) {
      toast.warning(ch('needFieldsWarning'));
      return;
    }
    setSelectedDisease(diseaseName);
    setShowFieldDialog(true);
  };
  
  if (initialLoading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-content-center align-items-center min-h-screen">
          <ProgressSpinner style={{ width: '50px', height: '50px' }} />
          <span className="ml-3 text-lg">{ch('loading')}</span>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <Card 
          title={
            <div className="flex align-items-center">
              <i className="pi pi-heart text-green-500 mr-2 text-xl"></i>
              <span>{ch('title')}</span>
            </div>
          } 
          subTitle={ch('subtitle')}
          className="mb-6 shadow-2"
        >
          <div className="grid">
            <div className="col-12 md:col-5">
              <Card className="shadow-1 h-full">
                <h3 className="text-xl font-semibold mb-3">{ch('uploadSection')}</h3>
                
                {/* Upload Area */}
                <div className="flex flex-column align-items-center">
                  <div className="p-4 border-dashed border-1 border-round w-full text-center mb-3 surface-200">
                    <FileUpload
                      name="plantImage"
                      accept="image/*"
                      customUpload={false}
                      onSelect={(e) => handleImagePreview(e.files?.[0])}
                      chooseLabel={ch('chooseCropImage')}
                      mode="basic"
                      className="mb-3"
                    />
                    <p className="text-sm text-500 mt-2 mb-0">{ch('acceptedFormats')}</p>
                  </div>

                  {uploadedFile && (
                    <div className="mt-4 text-center w-full">
                      <Button
                        label={`${ch('analyze')} "${uploadedFileName}"`}
                        icon="pi pi-search"
                        className="p-button-primary w-full"
                        onClick={() => handleFileUpload({ files: [uploadedFile] })}
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>

                {/* Preview */}
                {imagePreview && (
                  <div className="mt-4 text-center">
                    <h3 className="text-md font-semibold">{ch('preview')}</h3>
                    <div className="border-1 border-round p-2 surface-50">
                      <img 
                        src={imagePreview} 
                        alt="Uploaded crop" 
                        className="max-w-full h-auto rounded shadow-1 border-1" 
                        style={{ maxHeight: '300px', objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <div className="col-12 md:col-7">
              {/* Results Area */}
              <Card className="shadow-1 h-full">
                <h3 className="text-xl font-semibold mb-3">{ch('diagnosisReport')}</h3>
                
                {loading && (
                  <div className="flex flex-column justify-content-center align-items-center py-8">
                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    <span className="mt-3 text-md">{ch('analyzing')}</span>
                  </div>
                )}

                {!loading && !result && !imagePreview && (
                  <div className="flex flex-column justify-content-center align-items-center py-8 text-center">
                    <i className="pi pi-image text-500" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-3 text-500">{ch('noImageUploaded')}</p>
                    <p className="text-sm text-600 mt-2">{ch('uploadInstruction')}</p>
                  </div>
                )}

                {!loading && !result && imagePreview && (
                  <div className="flex flex-column justify-content-center align-items-center py-8 text-center">
                    <i className="pi pi-search text-500" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-3 text-500">{ch('readyToAnalyze')}</p>
                    <Button
                      label={ch('startAnalysis')}
                      icon="pi pi-search"
                      className="p-button-outlined p-button-primary mt-3"
                      onClick={() => handleFileUpload({ files: [uploadedFile] })}
                    />
                  </div>
                )}

                {result && !loading && (
                  <div className="mt-4">
                    <div className="grid">
                      <div className="col-12 md:col-6">
                        <div className="p-3 surface-50 border-round mb-3">
                          <p>
                            <strong>{ch('plantDetected')}:</strong>{' '}
                            <Tag 
                              value={result.is_plant ? ch('yes') : ch('no')} 
                              severity={result.is_plant ? 'success' : 'danger'} 
                            />
                            <span className="text-500 ml-2">
                              ({(result.is_plant_probability * 100).toFixed(1)}%)
                            </span>
                          </p>
                          <p>
                            <strong>{ch('healthStatus')}:</strong>{' '}
                            <Tag 
                              value={result.health_assessment.is_healthy ? ch('healthy') : ch('unhealthy')} 
                              severity={result.health_assessment.is_healthy ? 'success' : 'warning'} 
                            />
                            <span className="text-500 ml-2">
                              ({(result.health_assessment.is_healthy_probability * 100).toFixed(1)}%)
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <Divider>
                      <span className="p-tag">{ch('detectedDiseases')}</span>
                    </Divider>

                    {result.health_assessment.diseases.length > 0 ? (
                      <div className="mt-3">
                        {result.health_assessment.diseases.map((disease: Disease, index: number) => (
                          <Card 
                            key={index} 
                            className={`mb-3 shadow-1 border-left-3 ${index % 2 === 0 ? 'border-red-500' : 'border-orange-500'}`}
                          >
                            <div className="flex justify-content-between align-items-center mb-3">
                              <div className="flex align-items-center">
                                <i className="pi pi-exclamation-triangle text-orange-500 mr-2"></i>
                                <h4 className="m-0 font-bold">{disease.name}</h4>
                              </div>
                              <Tag 
                                value={`${(disease.probability * 100).toFixed(1)}%`} 
                                severity={disease.probability > 0.7 ? 'danger' : disease.probability > 0.4 ? 'warning' : 'info'} 
                              />
                            </div>
                            
                            {disease.similar_images && disease.similar_images.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium">{ch('similarImages')}:</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {disease.similar_images.map((img: any, i: number) => (
                                    <a key={i} href={img.url} target="_blank" rel="noopener noreferrer">
                                      <img
                                        src={img.url_small || img.url}
                                        alt={`Similar example ${i + 1}`}
                                        className="w-4rem h-4rem object-cover rounded border hover:shadow-3 transition-all transition-duration-300"
                                      />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-content-end mt-3">
                              <Button
                                label={ch('createTask')}
                                icon="pi pi-plus"
                                className="p-button-sm p-button-outlined p-button-success"
                                onClick={() => handleCreateTaskFromDisease(disease.name)}
                                disabled={!canCreateTask}
                              />
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <i className="pi pi-check-circle text-green-500" style={{ fontSize: '2rem' }}></i>
                        <p className="mt-2">{ch('noDiseasesDetected')}</p>
                      </div>
                    )}

                    <div className="mt-4 text-center">
                      <p className="text-sm text-500 mt-2">
                        {ch('submittedOn')}: {new Date(result.meta_data.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </Card>

        {/* Field Selection Dialog */}
        <Dialog
          header={ch('selectField')}
          visible={showFieldDialog}
          onHide={() => setShowFieldDialog(false)}
          className="w-full md:w-30rem"
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
            <div className="flex flex-column justify-content-center align-items-center my-4">
              <ProgressSpinner style={{ width: '40px', height: '40px' }} />
              <span className="ml-3 mt-2">{ch('generatingDescription')}</span>
            </div>
          ) : (
            <>
              <p className="mb-3">{ch('fieldSelectionHelp')}</p>
              
              <Dropdown
                value={selectedField}
                options={fieldOptions}
                onChange={(e) => setSelectedField(e.value)}
                placeholder={ch('selectField')}
                className="w-full"
              />
              
              {!hasFields && canCreateField && (
                <div className="mt-3 p-3 surface-100 border-round text-center">
                  <p className="text-600 mb-2">{ch('noFieldsAvailable')}</p>
                  <Button
                    label={ch('createField')}
                    icon="pi pi-plus"
                    className="p-button-outlined p-button-sm"
                    onClick={() => router.push('/create-field')}
                  />
                </div>
              )}
            </>
          )}
        </Dialog>
      </div>
    </ProtectedRoute>
  );
};

export default CropHealthPage;