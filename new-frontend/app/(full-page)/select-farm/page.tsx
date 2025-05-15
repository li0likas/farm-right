'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { toast } from 'sonner';
import api from '@/utils/api';
import LanguageToggle from '@/app/components/LanguageToggle';

const SelectFarmPage = () => {
    const router = useRouter();
    const t = useTranslations('login');
    const { layoutConfig } = useContext(LayoutContext);

    const [farms, setFarms] = useState([]);
    const [selectedFarm, setSelectedFarm] = useState<number | null>(null);

    useEffect(() => {
        const fetchFarms = async () => {
            try {
                const response = await api.get('/users/farms');
                setFarms(response.data);
            } catch (err) {
                toast.error(t('errorOccurred', { message: 'Failed to load farms' }));
            }
        };
        fetchFarms();
    }, []);

    const confirmSelection = () => {
        if (!selectedFarm) {
            toast.error(t('selectFarmError'));
            return;
        }
        localStorage.setItem('x-selected-farm-id', selectedFarm.toString());
        toast.success(t('farmSelected'));
        router.push('/dashboard');
    };

    return (
        <div
            className={classNames(
                'surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden',
                { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
            )}
        >
            <div className="absolute top-0 right-0 m-4">
                <LanguageToggle />
            </div>

            <div className="flex flex-column align-items-center justify-content-center">
                <img
                    src={`/layout/images/zuvs-logo.png`}
                    alt="Logo"
                    className="mb-5 w-6rem flex-shrink-0"
                />

                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)',
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <div className="text-900 text-3xl font-medium mb-3">{t('selectFarm')}</div>
                            <span className="text-600 font-medium">{t('multipleFarms')}</span>
                        </div>

                        <div className="mb-5">
                            <label htmlFor="farm" className="block text-900 font-medium text-xl mb-2">
                                {t('chooseFarm')}
                            </label>
                            <select
                                id="farm"
                                className="w-full p-3 border-round"
                                value={selectedFarm ?? ''}
                                onChange={(e) => setSelectedFarm(Number(e.target.value))}
                            >
                                <option value="">{t('selectFarmPlaceholder')}</option>
                                {farms.map((farm: any) => (
                                    <option key={farm.id} value={farm.id}>
                                        {farm.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Button label={t('confirmFarm')} className="w-full p-3 text-xl" onClick={confirmSelection} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectFarmPage;
