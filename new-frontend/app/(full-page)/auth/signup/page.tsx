'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
import { FileUpload } from 'primereact/fileupload';
import { logout } from "@/utils/auth";
import api from '@/utils/api';
import { useTranslations } from 'next-intl';
import LanguageToggle from '@/app/components/LanguageToggle';

const RegisterPage = () => {
    const router = useRouter();
    const t = useTranslations('auth');

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rePassword, setRePassword] = useState('');
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [checked, setChecked] = useState(false);

    const validate = () => {
        if (!name || !email || !password || !rePassword) {
            toast.error(t('emptyFields'));
            return false;
        }
        if (!email.match(/^\S+@\S+\.\S+$/)) {
            toast.error(t('invalidEmail'));
            return false;
        }
        if (password.length < 5) {
            toast.error(t('passwordTooShort'));
            return false;
        }
        if (password !== rePassword) {
            toast.error(t('passwordsDoNotMatch'));
            return false;
        }
        if (!checked) {
            toast.error(t('agreeTerms'));
            return false;
        }
        return true;
    };

    const onUpload = (event: any) => {
        const file = event.files[0];
        if (file) {
            setProfileImage(file);
            toast.success(t('profileImageSelected'));
        }
    };

    const submit = async () => {
        logout();

        if (!validate()) return;

        setLoading(true);
        
        try {
            const requestData = {
                name: name,
                email: email,
                password: password
            };

            await api.post('/auth/signup', requestData, {
                headers: { 'Content-Type': 'application/json' }
            });

            toast.success(t('registrationSuccess'));

            const pendingInvitation = localStorage.getItem('pendingInvitation');
            if (pendingInvitation) {
                toast.info(t('loginToAcceptInvitation'));
            }

            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } catch (error: any) {
            if (error.response?.status === 403) {
                if (error.response.data.message === "Email is already taken") {
                    toast.error(t('emailTaken'));
                } else if (error.response.data.message === "Username is already taken") {
                    toast.error(t('usernameTaken'));
                }
            } else {
                toast.error(`${t('errorOccurred')}: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
            
            <div className="absolute top-0 right-0 m-4">
                <LanguageToggle />
            </div>

            <div className="flex flex-column align-items-center justify-content-center">
                <img src="/layout/images/zuvs-logo.png" alt="ZUVS logo" className="mb-5 w-6rem flex-shrink-0" />
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <div className="text-900 text-3xl font-medium mb-3">{t('createAccount')}</div>
                            <span className="text-600 font-medium">{t('signUpToStart')}</span>
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-900 text-xl font-medium mb-2">{t('name')}</label>
                            <InputText
                                id="name"
                                type="text"
                                placeholder={t('enterName')}
                                className="w-full md:w-30rem mb-5 p-3"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <label htmlFor="email" className="block text-900 text-xl font-medium mb-2">{t('email')}</label>
                            <InputText
                                id="email"
                                type="text"
                                placeholder={t('enterEmail')}
                                className="w-full md:w-30rem mb-5 p-3"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <label htmlFor="password" className="block text-900 text-xl font-medium mb-2">{t('password')}</label>
                            <Password
                                inputId="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('enterPassword')}
                                toggleMask
                                className="w-full mb-5"
                                inputClassName="w-full p-3 md:w-30rem"
                            />

                            <label htmlFor="rePassword" className="block text-900 text-xl font-medium mb-2">{t('repeatPassword')}</label>
                            <Password
                                inputId="rePassword"
                                value={rePassword}
                                onChange={(e) => setRePassword(e.target.value)}
                                feedback={false}
                                placeholder={t('confirmPassword')}
                                className="w-full mb-5"
                                inputClassName="w-full p-3 md:w-30rem"
                            />

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <div className="flex align-items-center">
                                    <Checkbox
                                        inputId="agree"
                                        checked={checked}
                                        onChange={(e) => setChecked(e.checked ?? false)}
                                        className="mr-2"
                                    />
                                    <label htmlFor="agree">{t('agreeTerms')}</label>
                                </div>
                            </div>

                            <Button
                                label={loading ? t('creatingAccount') : t('signUp')}
                                className="w-full p-3 text-xl"
                                onClick={submit}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
