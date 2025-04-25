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

const InvitationPage = () => {
  const { token } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [error, setError] = useState('');
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    // Only verify invitation details, don't accept automatically
    if (token) {
      verifyInvitationDetails();
    }
  }, [token]);

  useEffect(() => {
    if (error) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingInvitation');
      }
    }
  }, [error]);
  
  // Add this new function that only checks invitation details without accepting
  const verifyInvitationDetails = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // Make a GET request to verify the invitation only (not accept it)
      // We'll modify the controller to handle this verification without accepting
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/farm-invitations/${token}/verify`,
        isLoggedIn() ? {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        } : {}
      );
      
      setInvitationData(response.data);
      
      // If response indicates user is already a member
      if (response.data.alreadyMember || response.data.alreadyProcessed) {
        setAlreadyMember(true);
      }
      
      // If user is not logged in and this invitation requires registration
      if (response.data.requiresRegistration && !isLoggedIn()) {
        toast.info("Please register or log in to accept this invitation");
      }
      
    } catch (error) {
      console.error('Error verifying invitation:', error);
      setError('This invitation is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token) return;
  
    setProcessing(true);
    try {
      // Check if user is logged in
      if (!isLoggedIn()) {
        localStorage.setItem('pendingInvitation', token as string);
        router.push('/auth/login');
        return;
      }
  
      // If already a member, just redirect
      if (alreadyMember) {
        localStorage.removeItem('pendingInvitation'); // ✅ clean up if already member
        router.push('/dashboard');
        return;
      }
  
      // Accept the invitation
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/farm-invitations/${token}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
  
      // Update invitation data
      setInvitationData(response.data);
  
      if (response.data.alreadyMember) {
        setAlreadyMember(true);
        toast.info(`You are already a member of ${response.data.farmName || 'this farm'}`);
        localStorage.removeItem('pendingInvitation'); // ✅ clean up
      } else {
        toast.success(`You have successfully joined ${response.data.farmName || 'the farm'}!`);
        localStorage.removeItem('pendingInvitation'); // ✅ clean up
      }
  
      // Refresh user's farms
      const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/farms`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
  
      if (userResponse.data && userResponse.data.length > 0) {
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
  
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        if (invitationData?.success) {
          toast.info(`You are already a member of ${invitationData.farmName || 'this farm'}`);
          localStorage.removeItem('pendingInvitation'); // ✅ clean up even on fallback
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
          return;
        }
        setError('This invitation link is no longer valid. It may have been already used or expired.');
      } else {
        if (axios.isAxiosError(error)) {
          toast.error('Failed to accept invitation: ' + (error.response?.data?.message || 'Unknown error'));
        } else {
          toast.error('Failed to accept invitation: Unknown error');
        }
      }
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
    <div className="surface-ground flex justify-content-center align-items-center min-h-screen">
      <Card title="Farm Invitation" className="w-full md:w-6 shadow-2">
        <div className="text-center mb-5">
          {loading ? (
            <ProgressSpinner />
          ) : error ? (
            <>
              <div className="bg-red-100 text-red-800 p-3 border-round mb-3">
                <i className="pi pi-exclamation-circle text-2xl mr-2"></i>
                <span className="text-xl">Invitation Error</span>
              </div>
              <p>{error}</p>
              <div className="flex justify-content-center mt-4">
                <Link href="/auth/login">
                  <Button label="Back to Login" />
                </Link>
              </div>
            </>
          ) : alreadyMember ? (
            <>
              <div className="bg-blue-100 text-blue-800 p-3 border-round mb-3">
                <i className="pi pi-info-circle text-2xl mr-2"></i>
                <span className="text-xl">Already a Member</span>
              </div>
              
              <p className="text-lg mt-3">
                You are already a member of the farm:
                <span className="font-bold block text-2xl text-primary">
                  {invitationData?.farmName || 'this farm'}
                </span>
              </p>
              
              <Divider />
              
              <div className="mt-4">
                <Button 
                  label="Go to Dashboard" 
                  icon="pi pi-home" 
                  className="p-button-primary" 
                  onClick={() => router.push('/dashboard')}
                />
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-100 text-green-800 p-3 border-round mb-3">
                <i className="pi pi-envelope text-2xl mr-2"></i>
                <span className="text-xl">You've been invited!</span>
              </div>
              
              {invitationData?.farmName && (
                <p className="text-lg mt-3">
                  You have been invited to join farm:
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
                      You need an account with email <strong>{invitationData.email}</strong> to join this farm.
                    </p>
                    <div className="flex flex-column md:flex-row gap-3 justify-content-center">
                      <Link href="/auth/signup">
                        <Button label="Create Account" icon="pi pi-user-plus" className="p-button-success" />
                      </Link>
                      <Link href="/auth/login">
                        <Button label="Log In" icon="pi pi-sign-in" className="p-button-primary" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <Button 
                    label={processing ? "Processing..." : "Accept Invitation"} 
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