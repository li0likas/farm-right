'use client';
import { useRouter } from 'next/navigation';
import { useState, useContext, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '../../../../layout/context/layoutcontext';

const LoginPage = () => {
    const router = useRouter();
    const { layoutConfig } = useContext(LayoutContext);

    // State for login
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);

    const passwordInputRef = useRef<HTMLInputElement | null>(null);

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
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/signin`, {
                username,
                password
            });
    
            const { access_token } = response.data;
            localStorage.setItem('accessToken', access_token);
    
            // Navigate to dashboard after successful login
            toast.success('Successful login');
            router.push('/dashboard');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 403 && error.response?.data?.message === "Incorrect credentials") {
                    toast.error('Incorrect credentials');
                } else {
                    toast.error(`An error has occurred: ${error.message}`);
                }
            } else {
                toast.error('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    }; 

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>, action: () => void) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            action();
        }
    };

    const containerClassName = classNames(
        'surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden',
        { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
    );

    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center">
                <img
                    src={`/layout/images/logo-${layoutConfig.colorScheme === 'light' ? 'dark' : 'white'}.svg`}
                    alt="Sakai logo"
                    className="mb-5 w-6rem flex-shrink-0"
                />
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <img src="/demo/images/login/avatar.png" alt="Avatar" height="50" className="mb-3" />
                            <div className="text-900 text-3xl font-medium mb-3">Welcome Back</div>
                            <span className="text-600 font-medium">Sign in to continue</span>
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-900 text-xl font-medium mb-2">
                                Username
                            </label>
                            <InputText
                                id="username"
                                type="text"
                                placeholder="Enter your username"
                                className="w-full md:w-30rem mb-5 p-3"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyDown={(e) => handleKeyPress(e, () => passwordInputRef.current?.focus())}
                                />

                            <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">
                                Password
                            </label>
                            <Password
                                inputId="password"
                                value={password}
                                //onChange={(e) => setPassword(e.target.value)} // su weak ir t.t.
                                onChange={(e) => setPassword(e.target.value)}
                                feedback={false}
                                tabIndex={1}
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
                                    ></Checkbox>
                                    <label htmlFor="rememberme">Remember me</label>
                                </div>
                                <a className="font-medium no-underline text-right cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                                    Forgot password?
                                </a>
                            </div>

                            <Button label={loading ? 'Signing In...' : 'Sign In'} className="w-full p-3 text-xl" onClick={login} disabled={loading} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
