'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { toast } from 'sonner';
import api from '@/utils/api';

const FarmCreatePage = () => {
  const router = useRouter();

  const [farmName, setFarmName] = useState('');
  const [loading, setLoading] = useState(false);

  const createFarm = async () => {
    if (!farmName.trim()) {
      toast.error('Please enter a farm name');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/farms', { name: farmName });

      toast.success('Farm created successfully!');

      const newFarmId = response.data.id;

      localStorage.setItem('x-selected-farm-id', newFarmId.toString());

      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (error) {
      console.error('Error creating farm:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to create farm');
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
      <div className="flex flex-column align-items-center justify-content-center">
        <img src="/layout/images/logo-dark.svg" alt="Sakai logo" className="mb-5 w-6rem flex-shrink-0" />
        <div style={{ borderRadius: '56px', padding: '0.3rem', background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)' }}>
          <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
            <div className="text-center mb-5">
              <div className="text-900 text-3xl font-medium mb-3">Create Your Farm</div>
              <span className="text-600 font-medium">Start by giving your farm a name</span>
            </div>

            <div>
              <label htmlFor="farmName" className="block text-900 text-xl font-medium mb-2">
                Farm Name
              </label>
              <InputText
                id="farmName"
                type="text"
                placeholder="Enter your farm name"
                className="w-full md:w-30rem mb-5 p-3"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                onKeyDown={handleKeyPress}
              />

              <Button
                label={loading ? 'Creating...' : 'Create Farm'}
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
