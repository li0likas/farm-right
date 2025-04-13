'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { toast } from 'sonner';
import api from '@/utils/api';

interface InvitationFormProps {
  visible: boolean;
  onHide: () => void;
  onSuccess?: () => void;
}

const InvitationForm: React.FC<InvitationFormProps> = ({ visible, onHide, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState<number | null>(null);
  const [roles, setRoles] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ email?: string; role?: string }>({});

  useEffect(() => {
    if (visible) {
      fetchRoles();
      // Reset form
      setEmail('');
      setRoleId(null);
      setFormErrors({});
    }
  }, [visible]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      const roleOptions = response.data.map((role: any) => ({
        label: role.name,
        value: role.id
      }));
      setRoles(roleOptions);
    } catch (error) {
      toast.error('Failed to load roles');
    }
  };

  const validateForm = () => {
    const errors: { email?: string; role?: string } = {};
    let isValid = true;

    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    if (!roleId) {
      errors.role = 'Role is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await api.post('/farm-invitations', { email, roleId });
      toast.success('Invitation sent successfully!');
      onHide();
      if (onSuccess) onSuccess();
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.message === 'User is already a member of this farm') {
        toast.error('This user is already a member of this farm');
      } else {
        toast.error('Failed to send invitation');
      }
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div>
      <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={onHide} />
      <Button 
        label={loading ? "Sending..." : "Send Invitation"} 
        icon="pi pi-envelope" 
        className="p-button-primary" 
        onClick={handleSubmit} 
        loading={loading}
      />
    </div>
  );

  return (
    <Dialog
      header="Invite Member"
      visible={visible}
      style={{ width: '450px' }}
      footer={footer}
      onHide={onHide}
    >
      <div className="p-fluid">
        <div className="field">
          <label htmlFor="email" className="font-bold">Email</label>
          <InputText
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={formErrors.email ? 'p-invalid' : ''}
            placeholder="Enter email address"
          />
          {formErrors.email && <small className="p-error">{formErrors.email}</small>}
        </div>
        
        <div className="field mt-3">
          <label htmlFor="role" className="font-bold">Role</label>
          <Dropdown
            id="role"
            value={roleId}
            options={roles}
            onChange={(e) => setRoleId(e.value)}
            placeholder="Select a role"
            className={formErrors.role ? 'p-invalid' : ''}
          />
          {formErrors.role && <small className="p-error">{formErrors.role}</small>}
        </div>
        
        <div className="mt-4 p-2 border-1 surface-border border-round bg-gray-50">
          <p className="text-sm text-gray-600 m-0">
            <i className="pi pi-info-circle mr-1"></i>
            An invitation will be sent to this email. The user will need to create an account or log in to accept.
          </p>
        </div>
      </div>
    </Dialog>
  );
};

export default InvitationForm;