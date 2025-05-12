"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { toast } from "sonner";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { getUser } from "@/utils/user";
import api from '@/utils/api';
import { usePermissions } from "@/context/PermissionsContext";
import InvitationForm from "@/app/components/InvitationForm";
import { useTranslations } from "next-intl";

interface Member {
  id: number;
  username: string;
  email: string;
  role: string;
  roleId: number;
}

const FarmMembersPage = () => {
  const router = useRouter();
  const { hasPermission, permissions } = usePermissions();

  const t = useTranslations('common');
  const fm = useTranslations('farmMembers');
  const tr = useTranslations('roles');

  const canRead = hasPermission("FARM_MEMBER_READ");
  const canInvite = hasPermission("FARM_MEMBER_INVITE");
  const canUpdateRole = hasPermission("FARM_MEMBER_UPDATE_ROLE");
  const canDelete = hasPermission("FARM_MEMBER_REMOVE");

  const showActionsColumn = canUpdateRole || canDelete;

  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<{ label: string; value: number }[]>([]);
  const [roleChanges, setRoleChanges] = useState<{ [key: number]: number }>({});
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [inviteDialogVisible, setInviteDialogVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (user?.id) {
      setCurrentUserId(parseInt(user.id, 10));
    }

    if (canRead) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [permissions]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMembers(),
        canUpdateRole ? fetchRoles() : Promise.resolve()
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await api.get("/farm-members");
      setMembers(response.data);
    } catch (error) {
      toast.error(fm('fetchMembersError'));
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data.map((role: any) => ({
        label: tr(`roleNames.${role.name}`) || role.name,
        value: role.id
      })));
    } catch {
      toast.error(fm('fetchRolesError'));
    }
  };

  const handleRoleChange = (userId: number, newRoleId: number) => {
    setRoleChanges((prev) => ({ ...prev, [userId]: newRoleId }));
  };

  const saveRoleChange = async (userId: number) => {
    if (!roleChanges[userId]) return;

    try {
      await api.patch(`/farm-members/${userId}`, { roleId: roleChanges[userId] });
      toast.success(fm('updateRoleSuccess'));
      fetchMembers();
      setRoleChanges((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    } catch (error) {
      toast.error(fm('updateRoleError'));
    }
  };

  const confirmDelete = (userId: number) => {
    setMemberToDelete(userId);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (memberToDelete !== null) {
      try {
        await api.delete(`/farm-members/${memberToDelete}`);
        toast.success(fm('removeSuccess'));
        fetchMembers();
      } catch (error) {
        toast.error(fm('removeError'));
      }
      setDeleteDialogVisible(false);
      setMemberToDelete(null);
    }
  };

  const handleInviteMember = () => {
    setInviteDialogVisible(true);
  };

  if (!canRead) {
    return (
      <div className="grid">
        <div className="col-12">
          <Card className="shadow-4">
            <div className="flex flex-column align-items-center py-6">
              <i className="pi pi-lock text-yellow-500 text-5xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">{fm('noPermission')}</h3>
              <p className="text-gray-600 mb-4">{fm('contactAdmin')}</p>
              <Button
                label={t('dashboard')}
                icon="pi pi-home"
                className="p-button-outlined"
                onClick={() => router.push('/dashboard')}
              />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="col-12">
        <div className="card">
          <div className="flex justify-content-between align-items-center mb-4">
            <h2 className="text-2xl font-bold m-0 text-primary">{fm('title')}</h2>
            {canInvite && (
              <Button 
                label={fm('inviteByEmail')} 
                className="p-button-success" 
                onClick={handleInviteMember} 
                icon="pi pi-envelope" 
              />
            )}
          </div>

          {loading ? (
            <div className="flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
              <ProgressSpinner />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-column align-items-center justify-content-center py-6">
              <i className="pi pi-users text-gray-300 text-5xl mb-3"></i>
              <p className="text-xl font-semibold text-gray-600 mb-2">{fm('noMembersFound')}</p>
              <p className="text-gray-500 mb-4">{fm('noMembersDescription')}</p>
              {canInvite && (
                <Button
                  label={fm('inviteFirstMember')}
                  icon="pi pi-user-plus"
                  className="p-button-primary"
                  onClick={handleInviteMember}
                />
              )}
            </div>
          ) : (
            <DataTable 
              value={members} 
              responsiveLayout="scroll"
              paginator
              paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
              currentPageReportTemplate="{first} - {last} {totalRecords}"
              rows={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              className="p-datatable-striped"
            >
              <Column 
                field="username" 
                header={fm('name')} 
                sortable
              />
              <Column 
                field="email" 
                header={fm('email')} 
                sortable
              />

              <Column
                header={fm('role')}
                body={(rowData: Member) => {
                  const isEditing = roleChanges[rowData.id] !== undefined;
                  const isCurrentUser = rowData.id === currentUserId;

                  return (
                    <div className="flex align-items-center gap-2">
                      {isEditing ? (
                        <>
                          <Dropdown
                            value={roleChanges[rowData.id] || rowData.roleId}
                            options={roles}
                            onChange={(e) => handleRoleChange(rowData.id, e.value)}
                            placeholder={fm('selectRole')}
                            className="w-12rem"
                          />
                          <Button 
                            icon="pi pi-check" 
                            className="p-button-sm p-button-success" 
                            onClick={() => saveRoleChange(rowData.id)} 
                            tooltip={t('save')}
                          />
                          <Button 
                            icon="pi pi-times" 
                            className="p-button-sm p-button-text p-button-danger" 
                            onClick={() => setRoleChanges((prev) => {
                              const updated = { ...prev };
                              delete updated[rowData.id];
                              return updated;
                            })} 
                            tooltip={t('cancel')}
                          />
                        </>
                      ) : (
                        <>
                          <span className="font-medium">{tr(`roleNames.${rowData.role}`) || rowData.role}</span>
                          {canUpdateRole && !isCurrentUser && (
                            <Button 
                              icon="pi pi-pencil" 
                              className="p-button-sm p-button-text p-button-primary" 
                              onClick={() => setRoleChanges((prev) => ({ ...prev, [rowData.id]: rowData.roleId }))} 
                              tooltip={fm('editRole')}
                            />
                          )}
                        </>
                      )}
                    </div>
                  );
                }}
              />

              {canDelete && (
                <Column
                  header={fm('actions')}
                  style={{ width: '10%', textAlign: 'center' }}
                  body={(rowData: Member) => {
                    const isCurrentUser = rowData.id === currentUserId;
                    return isCurrentUser ? null : (
                      <Button
                        icon="pi pi-trash"
                        className="p-button-danger p-button-sm"
                        onClick={() => confirmDelete(rowData.id)}
                        tooltip={fm('removeMember')}
                      />
                    );
                  }}
                />
              )}
            </DataTable>
          )}
        </div>
      </div>

      <Dialog
        header={fm('confirmDeletion')}
        visible={deleteDialogVisible}
        onHide={() => setDeleteDialogVisible(false)}
        style={{ width: '450px' }}
        modal
        footer={
          <div className="flex justify-content-end gap-2">
            <Button 
              label={t('cancel')} 
              icon="pi pi-times" 
              className="p-button-text" 
              onClick={() => setDeleteDialogVisible(false)} 
            />
            <Button 
              label={fm('delete')} 
              icon="pi pi-check" 
              className="p-button-danger" 
              onClick={handleDelete} 
            />
          </div>
        }
      >
        <div className="flex align-items-center gap-3">
          <i className="pi pi-exclamation-triangle text-yellow-500 text-4xl"></i>
          <span>{fm('confirmDeleteBody')}</span>
        </div>
      </Dialog>

      <InvitationForm 
        visible={inviteDialogVisible} 
        onHide={() => setInviteDialogVisible(false)} 
        onSuccess={fetchMembers}
      />
    </div>
  );
};

export default FarmMembersPage;