'use client';

import { useRouter } from 'next/navigation';
import { useState, useContext, useEffect } from 'react';
import { useTranslations } from 'next-intl'; // ✅ Add this
import api from '@/utils/api';
import { toast } from 'sonner';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { login as handleLogin, isLoggedIn } from '../../../../utils/auth';
import LanguageToggle from '@/app/components/LanguageToggle'; // ✅ Import here

const LoginPage = () => {
    const router = useRouter();
    const { layoutConfig } = useContext(LayoutContext);

    const t = useTranslations('login'); // ✅ Create a "login" section

    // Login State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);

    // Farm Selection State
    const [farms, setFarms] = useState([]); 
    const [selectedFarm, setSelectedFarm] = useState<number | null>(null);

    useEffect(() => {
        if (isLoggedIn()) {
            const pendingInvitation = localStorage.getItem('pendingInvitation');
            if (pendingInvitation) {
                toast.info(t('processingInvitation'));
                router.push(`/invitation/${pendingInvitation}`);
            } else {
                router.push('/dashboard');
            }
        }
    }, []);

    const validate = () => {
        if (!username || !password) {
            toast.error(t('emptyFields'));
            return false;
        }
        return true;
    };

    const login = async () => {
        if (!validate()) return;
    
        setLoading(true);
        try {
            const response = await api.post('/auth/signin', { username, password });
            const { access_token, farms } = response.data;

            const success = await handleLogin(access_token);

            if (success) {
                try {
                    const invitationsResponse = await api.get('/farm-invitations/check-pending');
                    const pendingInvitations = invitationsResponse.data;

                    if (pendingInvitations && pendingInvitations.length > 0) {
                        localStorage.setItem('pendingInvitation', pendingInvitations[0].token);
                        toast.info(t('pendingInvitation', { farmName: pendingInvitations[0].farmName }));
                        router.push(`/invitation/${pendingInvitations[0].token}`);
                        return;
                    }
                } catch (error) {
                    console.error("Error checking pending invitations:", error);
                }

                if (farms.length === 0) {
                    toast.info(t('noFarm'));
                    router.push('/create-farm');
                } else if (farms.length === 1) {
                    localStorage.setItem('x-selected-farm-id', farms[0].farmId);
                    toast.success(t('welcomeFarm', { farmName: farms[0].farmName }));
                    router.push('/dashboard');
                } else {
                    setFarms(farms);
                }
            } else {
                toast.error(t('loginFailed'));
            }
        } catch (error: any) {
            if (error.response?.status === 401 && error.response?.data?.message === "Incorrect credentials") {
                toast.error(t('incorrectCredentials'));
            } else {
                toast.error(t('errorOccurred', { message: error.message }));
            }
        } finally {
            setLoading(false);
        }
    };

    const selectFarm = () => {
        if (!selectedFarm) {
            toast.error(t('selectFarmError'));
            return;
        }
        localStorage.setItem('x-selected-farm-id', selectedFarm.toString());
        toast.success(t('farmSelected'));
        router.push('/dashboard');
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>, action: () => void) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            action();
        }
    };

    return (
        <div className={classNames(
            'surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden',
            { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
        )}>

            <div className="absolute top-0 right-0 m-4">
                <LanguageToggle />
            </div>
            
            <div className="flex flex-column align-items-center justify-content-center">
                <img
                    src={`/layout/images/logo-${layoutConfig.colorScheme === 'light' ? 'dark' : 'white'}.svg`}
                    alt="Logo"
                    className="mb-5 w-6rem flex-shrink-0"
                />
                <div style={{ borderRadius: '56px', padding: '0.3rem', background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)' }}>
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        {farms.length === 0 ? (
                            <>
                                <div className="text-center mb-5">
                                    <img src="/demo/images/login/avatar.png" alt="Avatar" height="50" className="mb-3" />
                                    <div className="text-900 text-3xl font-medium mb-3">{t('welcomeBack')}</div>
                                    <span className="text-600 font-medium">{t('signInToContinue')}</span>
                                </div>

                                <div>
                                    <label htmlFor="username" className="block text-900 text-xl font-medium mb-2">{t('username')}</label>
                                    <InputText
                                        id="username"
                                        type="text"
                                        placeholder={t('enterUsername')}
                                        className="w-full md:w-30rem mb-5 p-3"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onKeyDown={(e) => handleKeyPress(e, () => document.getElementById('password')?.focus())}
                                    />

                                    <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">{t('password')}</label>
                                    <Password
                                        inputId="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        feedback={false}
                                        placeholder={t('enterPassword')}
                                        toggleMask
                                        className="w-full mb-5"
                                        inputClassName="w-full p-3 md:w-30rem"
                                        onKeyDown={(e) => handleKeyPress(e, login)}
                                    />

                                    <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                        <div className="flex align-items-center">
                                            <Checkbox
                                                inputId="rememberme"
                                                checked={checked}
                                                onChange={(e) => setChecked(e.checked ?? false)}
                                                className="mr-2"
                                            />
                                            <label htmlFor="rememberme">{t('rememberMe')}</label>
                                        </div>
                                        <a className="font-medium no-underline text-right cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                                            {t('forgotPassword')}
                                        </a>
                                    </div>

                                    <Button label={loading ? t('signingIn') : t('signIn')} className="w-full p-3 text-xl" onClick={login} disabled={loading} />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-center mb-5">
                                    <div className="text-900 text-3xl font-medium mb-3">{t('selectFarm')}</div>
                                    <span className="text-600 font-medium">{t('multipleFarms')}</span>
                                </div>

                                <div className="mb-5">
                                    <label htmlFor="farm" className="block text-900 font-medium text-xl mb-2">{t('chooseFarm')}</label>
                                    <select
                                        id="farm"
                                        className="w-full p-3 border-round"
                                        value={selectedFarm ?? ""}
                                        onChange={(e) => setSelectedFarm(Number(e.target.value))}
                                    >
                                        <option value="">{t('selectFarmPlaceholder')}</option>
                                        {farms.map((farm) => (
                                            <option key={farm.farmId} value={farm.farmId}>
                                                {farm.farmName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <Button label={t('confirmFarm')} className="w-full p-3 text-xl" onClick={selectFarm} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
