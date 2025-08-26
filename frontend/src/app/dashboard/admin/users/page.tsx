"use client";

import UserManagement from "@/components/UserManagement";
import { useAuth } from "@/context/AuthContext";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">
          Manage users, roles, and permissions for the platform
        </p>
      </div>

      <UserManagement isAdmin={isAdmin} />
    </div>
  );
}
