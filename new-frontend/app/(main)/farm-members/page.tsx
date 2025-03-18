"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { toast } from "sonner";
import { Dialog } from "primereact/dialog";
import { isLoggedIn } from "@/utils/auth";
import { getUser } from "@/utils/user";

// ✅ Function to get auth headers (including farm ID)
const getAuthHeaders = () => {
  const accessToken = localStorage.getItem("accessToken");
  const selectedFarmId = localStorage.getItem("x-selected-farm-id");

  if (!accessToken || !selectedFarmId) {
    toast.error("Missing authentication or farm selection.");
    return null;
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "x-selected-farm-id": selectedFarmId
  };
};

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
    if (!isLoggedIn()) {
      toast.error("Unauthorized. Login first.");
      router.push("/auth/login");
      return;
    }

    const user = getUser();
    if (user?.id) {
      setCurrentUserId(parseInt(user.id, 10));
    }

    fetchMembers();
    fetchRoles();
  }, []);

  // ✅ Fetch farm members (uses `getAuthHeaders()`)
  const fetchMembers = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/farm-members`, { headers });
      setMembers(response.data);
    } catch (error) {
      toast.error("Failed to load members");
    }
  };

  // ✅ Fetch available roles (uses `getAuthHeaders()`)
  const fetchRoles = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`, { headers });
      setRoles(response.data.map((role: Role) => ({ label: role.name, value: role.id })));
    } catch (error) {
      toast.error("Failed to load roles");
    }
  };

  // ✅ Add a member (uses `getAuthHeaders()`)
  const addMember = async () => {
    const headers = getAuthHeaders();
    if (!headers || !selectedUser || !selectedRole) return;

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/farm-members`, { userId: selectedUser, roleId: selectedRole }, { headers });

      toast.success("Member added successfully!");
      setVisible(false);
      fetchMembers();
    } catch (error) {
      toast.error("Failed to add member");
    }
  };

  // ✅ Remove a member (uses `getAuthHeaders()`)
  const removeMember = async (userId: number) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/farm-members/${userId}`, { headers });

      toast.success("Member removed!");
      fetchMembers();
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  // Function to confirm deletion
  const confirmDelete = (userId: number) => {
    setMemberToDelete(userId);
    setDeleteDialogVisible(true);
  };

  // Function to handle the deletion
  const handleDelete = async () => {
    if (memberToDelete !== null) {
      await removeMember(memberToDelete);
      setDeleteDialogVisible(false);
      setMemberToDelete(null);
    }
  };

  // ✅ Handle role change (store updates in state)
  const handleRoleChange = (userId: number, newRoleId: number) => {
    setRoleChanges((prev) => ({ ...prev, [userId]: newRoleId }));
  };

  // ✅ Save role change (uses `getAuthHeaders()`)
  const saveRoleChange = async (userId: number) => {
    const headers = getAuthHeaders();
    if (!headers || !roleChanges[userId]) return;

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/farm-members/${userId}`,
        { roleId: roleChanges[userId] },
        { headers }
      );

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
