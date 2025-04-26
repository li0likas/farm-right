'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Divider } from 'primereact/divider';
import { toast } from 'sonner';
import axios from 'axios';
import Link from 'next/link';
import { isLoggedIn } from '@/utils/auth';
import { useTranslations } from 'next-intl'; // ✅ Import
import LanguageToggle from '@/app/components/LanguageToggle'; // ✅ Import

const InvitationPage = () => {
  const { token } = useParams();
  const router = useRouter();
  const t = useTranslations('invitation'); // ✅ Using "invitation" namespace

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [error, setError] = useState('');
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    if (token) {
      verifyInvitationDetails();
    }
  }, [token]);

  useEffect(() => {
    if (error && typeof window !== 'undefined') {
      localStorage.removeItem('pendingInvitation');
    }
  }, [error]);

  const verifyInvitationDetails = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/farm-invitations/${token}/verify`,
        isLoggedIn()
          ? { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
          : {}
      );

      setInvitationData(response.data);

      if (response.data.alreadyMember || response.data.alreadyProcessed) {
        setAlreadyMember(true);
      }

      if (response.data.requiresRegistration && !isLoggedIn()) {
        toast.info(t('pleaseLoginOrRegister'));
      }
    } catch (error) {
      console.error('Error verifying invitation:', error);
      setError(t('invalidOrExpired'));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token) return;

    setProcessing(true);
    try {
      if (!isLoggedIn()) {
        localStorage.setItem('pendingInvitation', token as string);
        router.push('/auth/login');
        return;
      }

      if (alreadyMember) {
        localStorage.removeItem('pendingInvitation');
        router.push('/dashboard');
        return;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/farm-invitations/${token}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
      );

      setInvitationData(response.data);

      if (response.data.alreadyMember) {
        setAlreadyMember(true);
        toast.info(t('alreadyMemberOfFarm', { farmName: response.data.farmName || '' }));
        localStorage.removeItem('pendingInvitation');
      } else {
        toast.success(t('joinedFarm', { farmName: response.data.farmName || '' }));
        localStorage.removeItem('pendingInvitation');
      }

      const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/farms`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });

      if (userResponse.data?.length) {
        const newFarm = userResponse.data.find((farm: any) => farm.name === response.data.farmName);
        if (newFarm) {
          localStorage.setItem('x-selected-farm-id', newFarm.id.toString());
        }
      }

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error(t('acceptFailed'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="surface-ground flex justify-content-center align-items-center min-h-screen">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="surface-ground flex justify-content-center align-items-center min-h-screen relative">

      {/* ✅ Language Toggle */}
      <div className="absolute top-0 right-0 m-4">
        <LanguageToggle />
      </div>

      <Card title={t('farmInvitation')} className="w-full md:w-6 shadow-2">
        <div className="text-center mb-5">
          {error ? (
            <>
              <div className="bg-red-100 text-red-800 p-3 border-round mb-3">
                <i className="pi pi-exclamation-circle text-2xl mr-2"></i>
                <span className="text-xl">{t('invitationError')}</span>
              </div>
              <p>{error}</p>
              <div className="flex justify-content-center mt-4">
                <Link href="/auth/login">
                  <Button label={t('backToLogin')} />
                </Link>
              </div>
            </>
          ) : alreadyMember ? (
            <>
              <div className="bg-blue-100 text-blue-800 p-3 border-round mb-3">
                <i className="pi pi-info-circle text-2xl mr-2"></i>
                <span className="text-xl">{t('alreadyMember')}</span>
              </div>
              <p className="text-lg mt-3">
                {t('alreadyMemberOf')}{' '}
                <span className="font-bold block text-2xl text-primary">
                  {invitationData?.farmName || ''}
                </span>
              </p>
              <Divider />
              <div className="mt-4">
                <Button label={t('goToDashboard')} icon="pi pi-home" onClick={() => router.push('/dashboard')} />
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-100 text-green-800 p-3 border-round mb-3">
                <i className="pi pi-envelope text-2xl mr-2"></i>
                <span className="text-xl">{t('invited')}</span>
              </div>

              {invitationData?.farmName && (
                <p className="text-lg mt-3">
                  {t('invitedToFarm')}
                  <span className="font-bold block text-2xl text-primary">
                    {invitationData.farmName}
                  </span>
                </p>
              )}

              <Divider />

              <div className="mt-4">
                {invitationData?.requiresRegistration ? (
                  <>
                    <p className="text-yellow-700 mb-3">
                      <i className="pi pi-info-circle mr-2"></i>
                      {t('registerWithEmail', { email: invitationData.email })}
                    </p>
                    <div className="flex flex-column md:flex-row gap-3 justify-content-center">
                      <Link href="/auth/signup">
                        <Button label={t('createAccount')} icon="pi pi-user-plus" className="p-button-success" />
                      </Link>
                      <Link href="/auth/login">
                        <Button label={t('login')} icon="pi pi-sign-in" className="p-button-primary" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <Button
                    label={processing ? t('processing') : t('acceptInvitation')}
                    icon="pi pi-check"
                    className="p-button-success"
                    onClick={handleAcceptInvitation}
                    disabled={processing || invitationData?.alreadyProcessed}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default InvitationPage;
