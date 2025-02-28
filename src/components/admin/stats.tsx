"use client";

import { GameStats } from "@/types";
import { Card } from "@/components/ui/card";

export function AdminStats({ stats }: { stats: GameStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
        <p className="text-2xl font-bold">{stats.totalUsers}</p>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
        <p className="text-2xl font-bold">{stats.activeUsers}</p>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Current Games</h3>
        <div className="space-y-1 mt-2">
          <p className="text-sm">Strength: {stats.gameDistribution.strength}</p>
          <p className="text-sm">Mind: {stats.gameDistribution.mind}</p>
          <p className="text-sm">Chance: {stats.gameDistribution.chance}</p>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Actions</h3>
        <button
          onClick={() => {
            const csvContent = `data:text/csv;charset=utf-8,
              Name,Email,Mobile,Branch,Year,Registration,Current Game,Last Active\n${
                stats.totalUsers > 0 ? "Download to see data" : "No users yet"
              }`;
            const link = document.createElement("a");
            link.href = encodeURI(csvContent);
            link.target = "_blank";
            link.download = "users.csv";
            link.click();
          }}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Export User Data
        </button>
      </Card>
    </div>
  );
}