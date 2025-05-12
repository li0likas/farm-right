'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { toast } from 'sonner';
import api from '@/utils/api';
import { useTranslations } from 'next-intl';
import LanguageToggle from '@/app/components/LanguageToggle';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const router = useRouter();
  const t = useTranslations('resetPassword');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      // In a real app, you might want to verify the token with the backend
      // For now, we'll assume the token is valid if it exists
      if (token) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
      }
    } catch (error) {
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const validateForm = () => {
    if (!password || !confirmPassword) {
      toast.error(t('fillAllFields'));
      return false;
    }

    if (password.length < 5) {
      toast.error(t('passwordTooShort'));
      return false;
    }

    if (password !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await api.post(`/auth/resetPasswordWithToken/${token}`, {
        newPassword: password
      });

      toast.success(t('passwordResetSuccess'));
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error(t('invalidOrExpiredToken'));
      } else {
        toast.error(t('resetError'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="surface-ground flex justify-content-center align-items-center min-h-screen">
        <ProgressSpinner />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="surface-ground flex justify-content-center align-items-center min-h-screen">
        <div className="absolute top-0 right-0 m-4">
          <LanguageToggle />
        </div>
        
        <Card title={t('invalidToken')} className="w-full md:w-6">
          <div className="text-center">
            <i className="pi pi-exclamation-triangle text-yellow-500 text-4xl mb-3"></i>
            <p className="mb-4">{t('tokenExpiredMessage')}</p>
            <Button 
              label={t('backToLogin')} 
              icon="pi pi-arrow-left"
              onClick={() => router.push('/auth/login')}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="surface-ground flex justify-content-center align-items-center min-h-screen">
      <div className="absolute top-0 right-0 m-4">
        <LanguageToggle />
      </div>
      
      <div className="flex flex-column align-items-center justify-content-center">
        <img src="/layout/images/logo-dark.svg" alt="Logo" className="mb-5 w-6rem flex-shrink-0" />
        
        <div style={{ borderRadius: '56px', padding: '0.3rem', background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)' }}>
          <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
            <div className="text-center mb-5">
              <div className="text-900 text-3xl font-medium mb-3">{t('resetPassword')}</div>
              <span className="text-600 font-medium">{t('enterNewPassword')}</span>
            </div>

            <div>
              <label htmlFor="password" className="block text-900 text-xl font-medium mb-2">
                {t('newPassword')}
              </label>
              <Password
                inputId="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterNewPassword')}
                toggleMask
                className="w-full mb-5"
                inputClassName="w-full p-3 md:w-30rem"
              />

              <label htmlFor="confirmPassword" className="block text-900 text-xl font-medium mb-2">
                {t('confirmNewPassword')}
              </label>
              <Password
                inputId="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                feedback={false}
                toggleMask
                className="w-full mb-5"
                inputClassName="w-full p-3 md:w-30rem"
              />

              <Button
                label={loading ? t('resetting') : t('resetPasswordButton')}
                className="w-full p-3 text-xl"
                onClick={handleResetPassword}
                disabled={loading}
                loading={loading}
              />
              
              <div className="mt-4 text-center">
                <Button 
                  label={t('backToLogin')} 
                  className="p-button-text"
                  onClick={() => router.push('/auth/login')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;