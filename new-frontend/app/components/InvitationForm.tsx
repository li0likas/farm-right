'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl'; // ✅ Add this
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

  const t = useTranslations('invitationForm'); // ✅ Use namespace

  useEffect(() => {
    if (visible) {
      fetchRoles();
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
      toast.error(t('fetchRolesError'));
    }
  };

  const validateForm = () => {
    const errors: { email?: string; role?: string } = {};
    let isValid = true;

    if (!email) {
      errors.email = t('emailRequired');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = t('emailInvalid');
      isValid = false;
    }

    if (!roleId) {
      errors.role = t('roleRequired');
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
      toast.success(t('inviteSuccess'));
      onHide();
      if (onSuccess) onSuccess();
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.message === 'User is already a member of this farm') {
        toast.error(t('alreadyMemberError'));
      } else {
        toast.error(t('inviteError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div>
      <Button label={t('cancel')} icon="pi pi-times" className="p-button-text" onClick={onHide} />
      <Button 
        label={loading ? t('sending') : t('sendInvite')} 
        icon="pi pi-envelope" 
        className="p-button-primary" 
        onClick={handleSubmit} 
        loading={loading}
      />
    </div>
  );

  return (
    <Dialog
      header={t('dialogTitle')}
      visible={visible}
      style={{ width: '450px' }}
      footer={footer}
      onHide={onHide}
    >
      <div className="p-fluid">
        <div className="field">
          <label htmlFor="email" className="font-bold">{t('email')}</label>
          <InputText
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={formErrors.email ? 'p-invalid' : ''}
            placeholder={t('emailPlaceholder')}
          />
          {formErrors.email && <small className="p-error">{formErrors.email}</small>}
        </div>
        
        <div className="field mt-3">
          <label htmlFor="role" className="font-bold">{t('role')}</label>
          <Dropdown
            id="role"
            value={roleId}
            options={roles}
            onChange={(e) => setRoleId(e.value)}
            placeholder={t('selectRole')}
            className={formErrors.role ? 'p-invalid' : ''}
          />
          {formErrors.role && <small className="p-error">{formErrors.role}</small>}
        </div>
        
        <div className="mt-4 p-2 border-1 surface-border border-round bg-gray-50">
          <p className="text-sm text-gray-600 m-0">
            <i className="pi pi-info-circle mr-1"></i>
            {t('infoText')}
          </p>
        </div>
      </div>
    </Dialog>
  );
};

export default InvitationForm;
