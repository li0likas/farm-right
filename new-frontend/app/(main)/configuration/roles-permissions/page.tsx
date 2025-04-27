// new-frontend/app/(main)/configuration/roles-permissions/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { toast } from 'sonner';
import api from '@/utils/api';
import { usePermissions } from '@/context/PermissionsContext';
import { useTranslations } from 'next-intl'; 

const RolesPermissionsPage = () => {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission('PERMISSION_READ');
  const canAssign = hasPermission('PERMISSION_ASSIGN');
  const canRemove = hasPermission('PERMISSION_REMOVE');

  // Get translations
  const r = useTranslations('roles');
  const common = useTranslations('common');

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    if (canRead) {
      fetchRoles();
      fetchPermissions();
    }
  }, [canRead]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data);
    } catch {
      toast.error(r('fetchRolesError'));
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/roles/permissions');
      setPermissions(response.data);
    } catch {
      toast.error(r('fetchPermissionsError'));
    }
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.value);
  };

  const roleHasPermission = (permissionId) => {
    return selectedRole?.farmPermissions?.some((p) => p.permissionId === permissionId);
  };

  const togglePermission = async (roleId, permissionId, currentlyHasPermission) => {
    if (!canAssign && !canRemove) return;

    try {
      if (currentlyHasPermission) {
        await api.delete(`/roles/${roleId}/permissions/${permissionId}`);
      } else {
        await api.post(`/roles/${roleId}/permissions`, { permissionId });
      }
      toast.success(r('permissionUpdated'));
      const updatedRoles = await api.get('/roles');
      setSelectedRole(updatedRoles.data.find((r) => r.id === roleId));
    } catch {
      toast.error(r('failedToUpdatePermission'));
    }
  };

  if (!canRead) {
    return <p className="text-center text-gray-600">{r('noPermission')}</p>;
  }

  // Group permissions by category
  const groupedPermissions = permissions.reduce((groups, perm) => {
    const [group] = perm.name.split('_');
    if (!groups[group]) groups[group] = [];
    groups[group].push(perm);
    return groups;
  }, {});

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">{r('title')}</h2>

      <Dropdown
        value={selectedRole}
        options={roles.map((role) => ({ 
          label: r(`roleNames.${role.name}`) || role.name, // Translate role name or fallback to original
          value: role 
        }))}
        onChange={handleRoleChange}
        placeholder={r('selectRole')}
        className="w-full mb-6"
      />

      {selectedRole && (
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([group, perms]) => (
            <div key={group} className="bg-white rounded shadow p-4">
              <h4 className="font-semibold text-gray-700 mb-3">
                {r(`permissionGroups.${group}`) || group}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {perms.map((perm) => (
                  <div key={perm.id} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                      {r(`permissions.${perm.name}`) || perm.name}
                    </span>
                    <Checkbox
                      checked={roleHasPermission(perm.id)}
                      onChange={() =>
                        togglePermission(selectedRole.id, perm.id, roleHasPermission(perm.id))
                      }
                      disabled={!canAssign && !canRemove}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RolesPermissionsPage;