'use client';
import { useRouter } from 'next/navigation';
import { useState, useContext, useEffect } from 'react';
import api from '@/utils/api';
import { toast } from 'sonner';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { login as handleLogin, isLoggedIn } from '../../../../utils/auth';

const LoginPage = () => {
    const router = useRouter();
    const { layoutConfig } = useContext(LayoutContext);

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
                // User is logged in and has a pending invitation
                toast.info("Processing your invitation...");
                router.push(`/invitation/${pendingInvitation}`);
            } else {
                router.push('/dashboard');
            }
        }
    }, []);

    const validate = () => {
        if (!username || !password) {
            toast.error('There are empty fields');
            return false;
        }
        return true;
    };

    const login = async () => {
        if (!validate()) return;
    
        setLoading(true);
        try {
            const response = await api.post('/auth/signin', {
                username,
                password
            });

            const { access_token, farms } = response.data;

            console.log("🔑 Access Token:", access_token);
            console.log("🏡 Farms Data:", farms);

            // call login() function
            const success = await handleLogin(access_token);

            if (success) {
                if (farms.length === 1) {
                    // auto-select farm and proceed
                    localStorage.setItem('x-selected-farm-id', farms[0].farmId);
                    toast.success(`Welcome to ${farms[0].farmName}`);
                    router.push('/dashboard');
                } else {
                    // show farm selection
                    setFarms(farms);
                }
            } else {
                toast.error("Failed to log in.");
            }
        } catch (error: unknown) {
            if (error.response?.status === 401 && error.response?.data?.message === "Incorrect credentials") {
                toast.error('Incorrect credentials');
            } else {
                toast.error(`An error has occurred: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const selectFarm = () => {
        if (!selectedFarm) {
            toast.error("Please select a farm.");
            return;
        }
        localStorage.setItem('x-selected-farm-id', selectedFarm.toString());
        toast.success("Farm selected successfully!");
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
            <div className="flex flex-column align-items-center justify-content-center">
                <img
                    src={`/layout/images/logo-${layoutConfig.colorScheme === 'light' ? 'dark' : 'white'}.svg`}
                    alt="Sakai logo"
                    className="mb-5 w-6rem flex-shrink-0"
                />
                <div style={{ borderRadius: '56px', padding: '0.3rem', background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)' }}>
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        {farms.length === 0 ? (
                            <>
                                <div className="text-center mb-5">
                                    <img src="/demo/images/login/avatar.png" alt="Avatar" height="50" className="mb-3" />
                                    <div className="text-900 text-3xl font-medium mb-3">Welcome Back</div>
                                    <span className="text-600 font-medium">Sign in to continue</span>
                                </div>

                                <div>
                                    <label htmlFor="username" className="block text-900 text-xl font-medium mb-2">Username</label>
                                    <InputText
                                        id="username"
                                        type="text"
                                        placeholder="Enter your username"
                                        className="w-full md:w-30rem mb-5 p-3"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onKeyDown={(e) => handleKeyPress(e, () => document.getElementById('password')?.focus())}
                                    />

                                    <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">Password</label>
                                    <Password
                                        inputId="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        feedback={false}
                                        placeholder="Enter your password"
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
                                            <label htmlFor="rememberme">Remember me</label>
                                        </div>
                                        <a className="font-medium no-underline text-right cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                                            Forgot password?
                                        </a>
                                    </div>

                                    <Button label={loading ? 'Signing In...' : 'Sign In'} className="w-full p-3 text-xl" onClick={login} disabled={loading} />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-center mb-5">
                                    <div className="text-900 text-3xl font-medium mb-3">Select a Farm</div>
                                    <span className="text-600 font-medium">You have access to multiple farms</span>
                                </div>

                                <div className="mb-5">
                                    <label htmlFor="farm" className="block text-900 font-medium text-xl mb-2">Choose Farm</label>
                                    <select
                                        id="farm"
                                        className="w-full p-3 border-round"
                                        value={selectedFarm ?? ""}
                                        onChange={(e) => setSelectedFarm(Number(e.target.value))}
                                    >
                                        <option value="">-- Select Farm --</option>
                                        {farms.map((farm) => (
                                            <option key={farm.farmId} value={farm.farmId}>
                                                {farm.farmName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <Button label="Confirm Farm" className="w-full p-3 text-xl" onClick={selectFarm} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
