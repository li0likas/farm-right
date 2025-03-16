'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from 'primereact/button';

const UnauthorizedPage = () => {
    const router = useRouter();

    return (
        <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
            <div className="flex flex-column align-items-center justify-content-center">
                {/* Logo */}
                <img src="/demo/images/notfound/logo-blue.svg" alt="Sakai logo" className="mb-5 w-6rem flex-shrink-0" />

                {/* Styled Card with Shadow and Rounded Borders */}
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, rgba(244, 67, 54, 0.4) 10%, rgba(244, 67, 54, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8 flex flex-column align-items-center" style={{ borderRadius: '53px' }}>
                        <span className="text-red-500 font-bold text-3xl">403</span>
                        <h1 className="text-900 font-bold text-5xl mb-2">Access Denied</h1>
                        <div className="text-600 mb-5">You do not have permission to access this page.</div>

                        {/* Helpful Navigation Links */}
                        <Link href="/" className="w-full flex align-items-center py-5 border-300 border-bottom-1">
                            <span className="flex justify-content-center align-items-center bg-red-400 border-round" style={{ height: '3.5rem', width: '3.5rem' }}>
                                <i className="pi pi-fw pi-home text-50 text-2xl"></i>
                            </span>
                            <span className="ml-4 flex flex-column">
                                <span className="text-900 lg:text-xl font-medium mb-1">Go to Dashboard</span>
                                <span className="text-600 lg:text-lg">Return to your main workspace.</span>
                            </span>
                        </Link>

                        <Link href="/support" className="w-full flex align-items-center py-5 border-300 border-bottom-1">
                            <span className="flex justify-content-center align-items-center bg-blue-400 border-round" style={{ height: '3.5rem', width: '3.5rem' }}>
                                <i className="pi pi-fw pi-question-circle text-50 text-2xl"></i>
                            </span>
                            <span className="ml-4 flex flex-column">
                                <span className="text-900 lg:text-xl font-medium mb-1">Contact Support</span>
                                <span className="text-600 lg:text-lg">Get help from our support team.</span>
                            </span>
                        </Link>

                        {/* Back to Home Button */}
                        <Button
                            label="Go Back to Home"
                            className="p-button-danger p-button-rounded px-6 py-3 text-lg mt-5"
                            onClick={() => router.push('/dashboard')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;
