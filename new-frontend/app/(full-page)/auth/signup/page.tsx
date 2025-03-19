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

const RegisterPage = () => {
    const router = useRouter();

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rePassword, setRePassword] = useState('');
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [checked, setChecked] = useState(false);

    // Validation logic
    const validate = () => {
        if (!name || !email || !password || !rePassword) {
            toast.error('There are empty fields');
            return false;
        }
        if (!email.match(/^\S+@\S+\.\S+$/)) {
            toast.error('Invalid email address is provided');
            return false;
        }
        if (password.length < 5) {
            toast.error('Password must be at least 5 characters');
            return false;
        }
        if (password !== rePassword) {
            toast.error('Passwords do not match');
            return false;
        }
        if (!checked) { 
            toast.error('You must agree to the terms & conditions');
            return false;
        }
        return true;
    };
    
    // Upload profile pic
    const onUpload = (event: any) => {
        const file = event.files[0]; // Get the uploaded file
        if (file) {
            setProfileImage(file);
            toast.success('Profile image selected successfully!');
        }
    };

    // Form submission
    const submit = async () => {
        logout(); // Clear local storage & session

        if (!validate()) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        if (profileImage) formData.append('file', profileImage);

        try {
            await api.post('/auth/signup', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Successful registration');
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } catch (error: unknown) {
            if (error.response?.status === 403) {
                if (error.response.data.message === "Email is already taken") {
                    toast.error('Email is already taken');
                } else if (error.response.data.message === "Username is already taken") {
                    toast.error('Username is already taken');
                }
            } else {
                toast.error(`An error occurred: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
            <div className="flex flex-column align-items-center justify-content-center">
                <img src="/layout/images/logo-dark.svg" alt="Sakai logo" className="mb-5 w-6rem flex-shrink-0" />
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
                            <div className="text-900 text-3xl font-medium mb-3">Create an Account</div>
                            <span className="text-600 font-medium">Sign up to get started</span>
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-900 text-xl font-medium mb-2">
                                Name
                            </label>
                            <InputText
                                id="name"
                                type="text"
                                placeholder="Enter your name"
                                className="w-full md:w-30rem mb-5 p-3"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <label htmlFor="email" className="block text-900 text-xl font-medium mb-2">
                                Email
                            </label>
                            <InputText
                                id="email"
                                type="text"
                                placeholder="Enter your email"
                                className="w-full md:w-30rem mb-5 p-3"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <label htmlFor="password" className="block text-900 text-xl font-medium mb-2">
                                Password
                            </label>
                            <Password
                                inputId="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                toggleMask
                                className="w-full mb-5"
                                inputClassName="w-full p-3 md:w-30rem"
                            />

                            <label htmlFor="rePassword" className="block text-900 text-xl font-medium mb-2">
                                Repeat Password
                            </label>
                            <Password
                                inputId="rePassword"
                                value={rePassword}
                                onChange={(e) => setRePassword(e.target.value)}
                                feedback={false}
                                placeholder="Confirm your password"
                                className="w-full mb-5"
                                inputClassName="w-full p-3 md:w-30rem"
                            />

                            <div className="mb-5">
                                <h5>Upload Profile Image</h5>
                                <FileUpload 
                                    mode="basic"
                                    name="profile"
                                    accept="image/*"
                                    maxFileSize={1000000}
                                    chooseLabel="Select Image"
                                    customUpload
                                    uploadHandler={onUpload}
                                    className="p-button-success"
                                />
                            </div>

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <div className="flex align-items-center">
                                    <Checkbox
                                        inputId="agree"
                                        checked={checked}
                                        onChange={(e) => setChecked(e.checked ?? false)}
                                        className="mr-2"
                                    />
                                    <label htmlFor="agree">I agree to the terms & conditions</label>
                                </div>
                            </div>

                            <Button
                                label={loading ? 'Creating Account...' : 'Sign Up'}
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
