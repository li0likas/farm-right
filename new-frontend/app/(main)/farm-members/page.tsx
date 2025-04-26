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
import { getUser } from "@/utils/user";
import api from '@/utils/api';
import { usePermissions } from "@/context/PermissionsContext";
import InvitationForm from "@/app/components/InvitationForm";
import { useTranslations } from "next-intl"; // ✅ Add translation

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

  useEffect(() => {
    const user = getUser();
    if (user?.id) {
      setCurrentUserId(parseInt(user.id, 10));
    }

    if (canRead) fetchMembers();
    if (canUpdateRole) fetchRoles();
  }, [permissions]);

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
      const response = await api.get("/roles");
      setRoles(response.data.map((role: { name: any; id: any; }) => ({ label: role.name, value: role.id })));
    } catch (error) {
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
      <div className="container mx-auto p-6 text-center text-lg text-red-600 font-semibold">
        {fm('noPermission')}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card title={fm('title')} className="mb-6">

        {canInvite && (
          <div className="flex gap-2 mb-4">
            <Button label={fm('inviteByEmail')} className="p-button-info" onClick={handleInviteMember} icon="pi pi-envelope" />
          </div>
        )}

        <DataTable value={members} responsiveLayout="scroll">
          <Column field="username" header={fm('name')} />
          <Column field="email" header={fm('email')} />

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
                      />
                    </>
                  ) : (
                    <>
                      <span>{rowData.role || fm('unknownRole')}</span>
                      {canUpdateRole && !isCurrentUser && (
                        <Button 
                          icon="pi pi-pencil" 
                          className="p-button-sm p-button-text" 
                          onClick={() => setRoleChanges((prev) => ({ ...prev, [rowData.id]: rowData.roleId }))} 
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
              header={fm('remove')}
              body={(rowData: Member) => {
                const isCurrentUser = rowData.id === currentUserId;
                return isCurrentUser ? null : (
                  <Button
                    icon="pi pi-trash"
                    className="p-button-danger"
                    onClick={() => confirmDelete(rowData.id)}
                  />
                );
              }}
            />
          )}
        </DataTable>
      </Card>

      <Dialog
        header={fm('confirmDeletion')}
        visible={deleteDialogVisible}
        onHide={() => setDeleteDialogVisible(false)}
        footer={
          <>
            <Button label={t('cancel')} icon="pi pi-times" className="p-button-text" onClick={() => setDeleteDialogVisible(false)} />
            <Button label={fm('delete')} icon="pi pi-check" className="p-button-danger" onClick={handleDelete} />
          </>
        }
      >
        <p>{fm('confirmDeleteBody')}</p>
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