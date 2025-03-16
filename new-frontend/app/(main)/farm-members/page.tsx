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

const FarmMembersPage = () => {
  const router = useRouter();
  const [farmId, setFarmId] = useState<number | null>(null);
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // ✅ Redirect if not logged in
    if (!isLoggedIn()) {
      toast.error("Unauthorized. Login first.");
      router.push("/auth/login");
      return;
    }

    // ✅ Get farmId from local storage
    const storedFarmId = localStorage.getItem("selectedFarmId");
    if (!storedFarmId) {
      toast.error("No farm selected. Redirecting...");
      router.push("/select-farm");
      return;
    }
    setFarmId(Number(storedFarmId));

    // ✅ Fetch Data
    fetchMembers(Number(storedFarmId));
    fetchRoles();
    fetchUsers();
  }, []);

  // ✅ Fetch farm members
  const fetchMembers = async (farmId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/farm-members/${farmId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(response.data);
    } catch (error) {
      toast.error("Failed to load members");
    }
  };

  // ✅ Fetch available roles
  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(response.data.map((role) => ({ label: role.name, value: role.id })));
    } catch (error) {
      toast.error("Failed to load roles");
    }
  };

  // ✅ Fetch users to invite
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.map((user) => ({ label: user.username, value: user.id })));
    } catch (error) {
      toast.error("Failed to load users");
    }
  };

  // ✅ Add a member
  const addMember = async () => {
    if (!farmId) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/farm-members`,
        {
          farmId,
          userId: selectedUser,
          roleId: selectedRole,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Member added successfully!");
      setVisible(false);
      fetchMembers(farmId);
    } catch (error) {
      toast.error("Failed to add member");
    }
  };

  // ✅ Remove a member
  const removeMember = async (userId: number) => {
    if (!farmId) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/farm-members/${farmId}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Member removed!");
      fetchMembers(farmId);
    } catch (error) {
      toast.error("Failed to remove member");
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
          <Column field="role" header="Role" />
          <Column
            header="Remove"
            body={(rowData) => (
              <Button icon="pi pi-trash" className="p-button-danger" onClick={() => removeMember(rowData.id)} />
            )}
          />
        </DataTable>
      </Card>

      {/* Add Member Dialog */}
      <Dialog header="Add Farm Member" visible={visible} onHide={() => setVisible(false)}>
        <div className="p-fluid">
          <Dropdown
            value={selectedUser}
            options={users}
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
