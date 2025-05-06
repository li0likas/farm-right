// new-frontend/app/(main)/configuration/roles-permissions/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { toast } from 'sonner';
import { ProgressSpinner } from 'primereact/progressspinner';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tooltip } from 'primereact/tooltip';
import { InputText } from 'primereact/inputtext';
import api from '@/utils/api';
import { usePermissions } from '@/context/PermissionsContext';
import { useTranslations } from 'next-intl';
import ProtectedRoute from "@/utils/ProtectedRoute";

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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [activePermissionTab, setActivePermissionTab] = useState(0);
  const [unsavedChanges, setUnsavedChanges] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (canRead) {
      fetchData();
    }
  }, [canRead]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions')
      ]);
      
      setRoles(rolesRes.data);
      setPermissions(permissionsRes.data);
      
      // Automatically select the first role
      if (rolesRes.data.length > 0) {
        setSelectedRole(rolesRes.data[0]);
      }
    } catch (error) {
      toast.error(r('fetchError'));
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e) => {
    // Check for unsaved changes before switching
    if (Object.keys(unsavedChanges).length > 0) {
      if (confirm(r('unsavedChangesWarning'))) {
        setUnsavedChanges({});
        setSelectedRole(e.value);
      }
    } else {
      setSelectedRole(e.value);
    }
  };

  const roleHasPermission = (permissionId) => {
    return selectedRole?.farmPermissions?.some((p) => p.permissionId === permissionId);
  };

  const togglePermission = (permissionId) => {
    if (!canAssign && !canRemove) return;
    
    const currentlyHasPermission = roleHasPermission(permissionId);
    
    // Track unsaved changes
    setUnsavedChanges((prev) => {
      const newChanges = { ...prev };
      
      // If returning to original state, remove from changes
      if ((currentlyHasPermission && prev[permissionId] === 'remove') ||
          (!currentlyHasPermission && prev[permissionId] === 'add')) {
        delete newChanges[permissionId];
      } else {
        // Otherwise, track the change
        newChanges[permissionId] = currentlyHasPermission ? 'remove' : 'add';
      }
      
      return newChanges;
    });
  };

  const saveChanges = async () => {
    if (Object.keys(unsavedChanges).length === 0) return;
    
    setSaving(true);
    try {
      // Process all changes in parallel
      await Promise.all(
        Object.entries(unsavedChanges).map(([permissionId, action]) => {
          if (action === 'add') {
            return api.post(`/roles/${selectedRole.id}/permissions`, { permissionId });
          } else if (action === 'remove') {
            return api.delete(`/roles/${selectedRole.id}/permissions/${permissionId}`);
          }
        })
      );
      
      toast.success(r('changesSaved'));
      setUnsavedChanges({});
      
      // Refresh data
      const updatedRoles = await api.get('/roles');
      setRoles(updatedRoles.data);
      
      // Update selected role
      const updatedRole = updatedRoles.data.find(r => r.id === selectedRole.id);
      if (updatedRole) {
        setSelectedRole(updatedRole);
      }
      
    } catch (error) {
      toast.error(r('saveFailed'));
      console.error('Failed to save changes:', error);
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((groups, perm) => {
    const [group] = perm.name.split('_');
    if (!groups[group]) groups[group] = [];
    groups[group].push(perm);
    return groups;
  }, {});

  // Filter permissions based on search
  const filterPermissions = (perms) => {
    if (!filter) return perms;
    return perms.filter(p => 
      p.name.toLowerCase().includes(filter.toLowerCase()) || 
      (r(`permissions.${p.name}`) || '').toLowerCase().includes(filter.toLowerCase())
    );
  };

  // Create permission category tabs
  const permissionTabs = Object.entries(groupedPermissions).map(([group, perms], index) => ({
    title: r(`permissionGroups.${group}`) || group,
    content: filterPermissions(perms),
    index
  }));

  if (!canRead) {
    return (
      <ProtectedRoute>
        <Card className="p-4 text-center">
          <i className="pi pi-lock text-4xl text-yellow-500 mb-3"></i>
          <h3>{r('noPermission')}</h3>
          <p className="text-gray-600">{r('contactAdmin')}</p>
        </Card>
      </ProtectedRoute>
    );
  }

  const getPermissionColor = (permId) => {
    if (unsavedChanges[permId] === 'add') return 'text-green-500';
    if (unsavedChanges[permId] === 'remove') return 'text-red-500 line-through';
    return '';
  };

  const isPermissionModified = (permId) => {
    return unsavedChanges[permId] !== undefined;
  };

  return (
    <ProtectedRoute>
      <div className="grid">
        <div className="col-12">
          <Card className="shadow-4">
            <div className="flex align-items-center justify-content-between mb-4">
              <div>
                <h2 className="text-2xl font-bold m-0">{r('title')}</h2>
                <p className="text-gray-600 mt-1">{r('subtitle')}</p>
              </div>
              {Object.keys(unsavedChanges).length > 0 && (
                <Button 
                  label={saving ? r('saving') : r('saveChanges')} 
                  icon={saving ? "pi pi-spin pi-spinner" : "pi pi-save"} 
                  className="p-button-success" 
                  onClick={saveChanges}
                  disabled={saving}
                />
              )}
            </div>

            {loading ? (
              <div className="flex justify-content-center my-6">
                <ProgressSpinner />
              </div>
            ) : (
              <div className="grid">
                <div className="col-12 lg:col-3">
                  <Card className="shadow-2 h-full">
                    <h3 className="text-xl font-semibold mb-3">{r('roles')}</h3>
                    <p className="text-sm text-gray-500 mb-3">{r('selectRoleDesc')}</p>
                    
                    <div className="role-cards">
                      {roles.map(role => (
                        <div 
                          key={role.id}
                          onClick={() => handleRoleChange({ value: role })}
                          className={`
                            cursor-pointer p-3 mb-2 border-round-lg transition-colors transition-duration-150
                            hover:surface-hover 
                            ${selectedRole?.id === role.id ? 'bg-primary-50 border-primary' : 'border-gray-200'}
                            border-1 
                          `}
                        >
                          <div className="flex align-items-center">
                            <div className={`
                              rounded-circle mr-2 flex align-items-center justify-content-center
                              ${selectedRole?.id === role.id ? 'bg-primary' : 'bg-gray-200'}
                              text-white w-2rem h-2rem
                            `}>
                              <i className="pi pi-user text-sm"></i>
                            </div>
                            <div>
                              <div className="font-medium">{r(`roleNames.${role.name}`) || role.name}</div>
                              <div className="text-xs text-gray-500">
                                {role.farmPermissions?.length || 0} {r('permissionsAssigned')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="col-12 lg:col-9">
                  {selectedRole ? (
                    <Card className="shadow-2">
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold mb-3">
                          {r('permissionsForRole')} 
                          <span className="text-primary"> {r(`roleNames.${selectedRole.name}`) || selectedRole.name}</span>
                        </h3>
                        
                        <div className="p-inputgroup mb-3">
                          <span className="p-inputgroup-addon">
                            <i className="pi pi-search"></i>
                          </span>
                          <InputText 
                            placeholder={r('searchPermissions')} 
                            value={filter} 
                            onChange={(e) => setFilter(e.target.value)} 
                            className="w-full"
                          />
                          {filter && (
                            <Button 
                              icon="pi pi-times" 
                              className="p-button-outlined" 
                              onClick={() => setFilter('')}
                              tooltip={r('clearSearch')}
                            />
                          )}
                        </div>
                        
                        <div className="permission-status-legend flex gap-3 mb-3">
                          <div className="flex align-items-center gap-1">
                            <div className="w-1rem h-1rem border-circle bg-green-500"></div>
                            <span className="text-sm">{r('toBeAdded')}</span>
                          </div>
                          <div className="flex align-items-center gap-1">
                            <div className="w-1rem h-1rem border-circle bg-red-500"></div>
                            <span className="text-sm">{r('toBeRemoved')}</span>
                          </div>
                        </div>
                      </div>

                      <TabView
                        activeIndex={activePermissionTab}
                        onTabChange={(e) => setActivePermissionTab(e.index)}
                        className="permissions-tabs"
                      >
                        {permissionTabs.map((tab) => (
                          <TabPanel key={tab.title} header={tab.title}>
                            <div className="grid">
                              {tab.content.length > 0 ? (
                                tab.content.map((perm) => (
                                  <div key={perm.id} className="col-12 md:col-6 lg:col-4">
                                    <div className={`
                                      border-1 border-gray-200 p-3 mb-2 border-round-lg
                                      hover:surface-hover transition-colors transition-duration-150
                                      ${isPermissionModified(perm.id) ? 'border-primary-200 bg-primary-50' : ''}
                                    `}>
                                      <div className="flex justify-content-between align-items-center">
                                        <div className="flex-1">
                                          <Tooltip target={`#perm-${perm.id}`} content={perm.name} position="top" />
                                          <div 
                                            id={`perm-${perm.id}`} 
                                            className={`font-medium ${getPermissionColor(perm.id)}`}
                                          >
                                            {r(`permissions.${perm.name}`) || perm.name}
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <Checkbox
                                            checked={
                                              (roleHasPermission(perm.id) && unsavedChanges[perm.id] !== 'remove') || 
                                              unsavedChanges[perm.id] === 'add'
                                            }
                                            onChange={() => togglePermission(perm.id)}
                                            disabled={!canAssign && !canRemove}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-12 text-center p-4">
                                  <i className="pi pi-search text-gray-400 text-4xl mb-3"></i>
                                  <p className="text-gray-600">{r('noPermissionsFound')}</p>
                                </div>
                              )}
                            </div>
                          </TabPanel>
                        ))}
                      </TabView>
                    </Card>
                  ) : (
                    <Card className="shadow-2 text-center py-6">
                      <i className="pi pi-users text-4xl text-gray-300 mb-3"></i>
                      <h3 className="font-light text-gray-600">{r('selectRolePrompt')}</h3>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default RolesPermissionsPage;