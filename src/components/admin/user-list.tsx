"use client";

import { useState } from "react";
import { UserProfile } from "@/types";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AdminUserList({ users }: { users: UserProfile[] }) {
  const [loading, setLoading] = useState(false);

  const handleExportToSheet = async () => {
    try {
      const csvData = users.map(user => ({
        Name: user.name,
        Email: user.gitamEmail,
        Mobile: user.mobileNumber,
        Branch: user.branch,
        Year: user.year,
        'Registration Number': user.registrationNumber,
        'Current Game': user.currentGame || 'None',
        'Last Active': user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'
      }));

      // Create CSV content
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `beast_games_users_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const resetUserData = async (userId: string) => {
    if (!confirm('Are you sure you want to reset this user\'s data? This cannot be undone.')) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        gameAccess: { strength: false, mind: false, chance: false },
        currentGame: null,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error resetting user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">User Management</h2>
        <Button onClick={handleExportToSheet} disabled={users.length === 0}>
          Export to CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Academic Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.uid}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.role}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.gitamEmail}</div>
                  <div className="text-sm text-gray-500">{user.mobileNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.branch}</div>
                  <div className="text-sm text-gray-500">Year: {user.year}</div>
                  <div className="text-xs text-gray-500">{user.registrationNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resetUserData(user.uid)}
                    disabled={loading || user.role === 'admin'}
                  >
                    Reset Data
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteUser(user.uid)}
                    disabled={loading || user.role === 'admin'}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}