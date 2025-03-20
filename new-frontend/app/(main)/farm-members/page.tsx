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
import api from "@/utils/api"; // ✅ Use API interceptor
import { usePermissions } from "@/context/PermissionsContext"; // ✅ Import Permissions Context

type Member = {
  id: number;
  username: string;
  email: string;
  role: string;
  roleId: number;
};

const FarmMembersPage = () => {
  const router = useRouter();
  const { hasPermission, permissions } = usePermissions(); // ✅ Get user permissions

  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<{ label: string; value: number }[]>([]);
  const [roleChanges, setRoleChanges] = useState<{ [key: number]: number }>({});
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // ✅ Permission Helpers
  const canRead = hasPermission("FARM_MEMBER_READ");
  const canInvite = hasPermission("FARM_MEMBER_INVITE");
  const canUpdate = hasPermission("FARM_MEMBER_UPDATE_ROLE");
  const canDelete = hasPermission("FARM_MEMBER_REMOVE");

  useEffect(() => {
    const user = getUser();
    if (user?.id) {
      setCurrentUserId(parseInt(user.id, 10));
    }

    if (canRead) fetchMembers();
    if (canUpdate) fetchRoles();
  }, [permissions]); // ✅ Fetch only after permissions load

  const fetchMembers = async () => {
    try {
      const response = await api.get("/farm-members");
      setMembers(response.data);
    } catch (error) {
      toast.error("Failed to load members");
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get("/roles");
      setRoles(response.data.map((role: { name: any; id: any; }) => ({ label: role.name, value: role.id })));
    } catch (error) {
      toast.error("Failed to load roles");
    }
  };

  const handleRoleChange = (userId: number, newRoleId: number) => {
    setRoleChanges((prev) => ({ ...prev, [userId]: newRoleId }));
  };

  const saveRoleChange = async (userId: number) => {
    if (!roleChanges[userId]) return;

    try {
      await api.patch(`/farm-members/${userId}`, { roleId: roleChanges[userId] });
      toast.success("Role updated successfully!");
      fetchMembers();
      setRoleChanges((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    } catch (error) {
      toast.error("Failed to update role");
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
        toast.success("Member removed!");
        fetchMembers();
      } catch (error) {
        toast.error("Failed to remove member.");
      }
      setDeleteDialogVisible(false);
      setMemberToDelete(null);
    }
  };

  // ✅ Hide entire page if user lacks `FARM_MEMBER_READ`
  if (!canRead) {
    return (
      <div className="container mx-auto p-6 text-center text-lg text-red-600 font-semibold">
        🚫 You do not have permission to view farm members.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card title="Farm Members" className="mb-6">

        {/* ✅ Show "Add Member" Button Only If User Has `FARM_MEMBER_INVITE` */}
        {canInvite && (
          <Button label="Add Member" className="p-button-success mb-4" onClick={() => setVisible(true)} />
        )}

        {/* Members Table */}
        <DataTable value={members} responsiveLayout="scroll">
          <Column field="username" header="Name" />
          <Column field="email" header="Email" />

          {/* ✅ Role Column (Always Visible) */}
          <Column
            header="Role"
            body={(rowData: Member) => {
              const isEditing = roleChanges[rowData.id] !== undefined;
              const isCurrentUser = rowData.id === currentUserId; // Prevent editing own role

              return (
                <div className="flex align-items-center gap-2">
                  {isEditing ? (
                    <>
                      <Dropdown
                        value={roleChanges[rowData.id] || rowData.roleId}
                        options={roles}
                        onChange={(e) => handleRoleChange(rowData.id, e.value)}
                        placeholder="Select Role"
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
                      <span>{rowData.role || "Unknown Role"}</span>
                      {canUpdate && !isCurrentUser && (
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

          {/* ✅ Remove Member Column - Only If `FARM_MEMBER_REMOVE` */}
          {canDelete && (
            <Column
              header="Remove"
              body={(rowData: Member) => {
                const isCurrentUser = rowData.id === currentUserId; // Prevent self-removal
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

      {/* ✅ Delete Confirmation Dialog */}
      <Dialog
        header="Confirm Deletion"
        visible={deleteDialogVisible}
        onHide={() => setDeleteDialogVisible(false)}
        footer={
          <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={() => setDeleteDialogVisible(false)} />
            <Button label="Delete" icon="pi pi-check" className="p-button-danger" onClick={handleDelete} />
          </>
        }
      >
        <p>Are you sure you want to remove this member?</p>
      </Dialog>
    </div>
  );
};

export default FarmMembersPage;
