'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { toast } from 'sonner';
import api from '@/utils/api';
import { useTranslations } from 'next-intl'; // ✅ Add this
import LanguageToggle from '@/app/components/LanguageToggle'; // ✅ Import Language Toggle

const FarmCreatePage = () => {
  const router = useRouter();
  const t = useTranslations('farm'); // ✅ Farm translations

  const [farmName, setFarmName] = useState('');
  const [loading, setLoading] = useState(false);

  const createFarm = async () => {
    if (!farmName.trim()) {
      toast.error(t('emptyFarmName'));
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/farms', { name: farmName });

      toast.success(t('farmCreated'));

      const newFarmId = response.data.id;

      localStorage.setItem('x-selected-farm-id', newFarmId.toString());

      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error('Error creating farm:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(t('farmCreationFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      createFarm();
    }
  };

  return (
    <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
      
      {/* ✅ Language Toggle in top right */}
      <div className="absolute top-0 right-0 m-4">
        <LanguageToggle />
      </div>

      <div className="flex flex-column align-items-center justify-content-center">
        <img src="/layout/images/logo-dark.svg" alt="Sakai logo" className="mb-5 w-6rem flex-shrink-0" />
        <div style={{ borderRadius: '56px', padding: '0.3rem', background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)' }}>
          <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
            <div className="text-center mb-5">
              <div className="text-900 text-3xl font-medium mb-3">{t('createFarmTitle')}</div>
              <span className="text-600 font-medium">{t('startByNaming')}</span>
            </div>

            <div>
              <label htmlFor="farmName" className="block text-900 text-xl font-medium mb-2">
                {t('farmName')}
              </label>
              <InputText
                id="farmName"
                type="text"
                placeholder={t('enterFarmName')}
                className="w-full md:w-30rem mb-5 p-3"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                onKeyDown={handleKeyPress}
              />

              <Button
                label={loading ? t('creating') : t('createFarmButton')}
                className="w-full p-3 text-xl"
                onClick={createFarm}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmCreatePage;
