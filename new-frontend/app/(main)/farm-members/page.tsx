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
import api from "@/utils/api";

type Role = {
  id: number;
  name: string;
};

const FarmMembersPage = () => {
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState<{ label: string; value: number }[]>([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [visible, setVisible] = useState(false);
  const [roleChanges, setRoleChanges] = useState<{ [key: number]: number }>({});
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const user = getUser();
    if (user?.id) {
      setCurrentUserId(parseInt(user.id, 10));
    }

    fetchMembers();
    fetchRoles();
  }, []);

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
      setRoles(response.data.map((role: Role) => ({ label: role.name, value: role.id })));
    } catch (error) {
      toast.error("Failed to load roles");
    }
  };

  const addMember = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      await api.post("/farm-members", { userId: selectedUser, roleId: selectedRole });
      toast.success("Member added successfully!");
      setVisible(false);
      fetchMembers();
    } catch (error) {
      toast.error("Failed to add member");
    }
  };

  const removeMember = async (userId: number) => {
    try {
      await api.delete(`/farm-members/${userId}`);
      toast.success("Member removed!");
      fetchMembers();
    } catch (error) {
      toast.error("Failed to remove member");
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
      await removeMember(memberToDelete);
      setDeleteDialogVisible(false);
      setMemberToDelete(null);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card title="Farm Members" className="mb-6">
        <Button label="Add Member" className="p-button-success mb-4" onClick={() => setVisible(true)} />

        {/* Members Table */}
        <DataTable value={members} responsiveLayout="scroll">
          <Column field="username" header="Name" />
          <Column field="email" header="Email" />

          <Column
            header="Role"
            body={(rowData) => {
              const isEditing = roleChanges[rowData.id] !== undefined;
              const isCurrentUser = rowData.id === currentUserId; // check if this row is the logged-in user

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
                      <span>{roles.find(role => role.value === rowData.roleId)?.label || "Unknown Role"}</span>
                      {!isCurrentUser && (
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

          <Column
            header="Remove"
            body={(rowData) => {
              const isCurrentUser = rowData.id === currentUserId; // check if this row is the logged-in user

              return isCurrentUser ? null : (
                <Button
                  icon="pi pi-trash"
                  className="p-button-danger"
                  onClick={() => confirmDelete(rowData.id)}
                />
              );
            }}
          />
        </DataTable>
      </Card>

      {/* Delete Confirmation Dialog */}
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

      {/* Add Member Dialog */}
      <Dialog header="Add Farm Member" visible={visible} onHide={() => setVisible(false)}>
        <div className="p-fluid">
          <Dropdown
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.value)}
            placeholder="Select User"
            className="w-full mb-3"
          />
          <Dropdown
            value={selectedRole}
            options={roles}
            onChange={(e) => setSelectedRole(e.value)}
            placeholder="Select Role"
            className="w-full mb-3"
          />
          <Button label="Add" className="p-button-success" onClick={addMember} disabled={!selectedUser || !selectedRole} />
        </div>
      </Dialog>
    </div>
  );
};

export default FarmMembersPage;
