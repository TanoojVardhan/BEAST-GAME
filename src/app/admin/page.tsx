"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/adminContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { UserProfile, GameStats } from '@/types';
import { AdminUserList } from '@/components/admin/user-list';
import { AdminStats } from '@/components/admin/stats';
import { AdminGameAccess } from '@/components/admin/game-access';

export default function AdminDashboard() {
  const router = useRouter();
  const { isAdmin, isLoading } = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<GameStats>({
    totalUsers: 0,
    activeUsers: 0,
    gameDistribution: { strength: 0, mind: 0, chance: 0 }
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (!isAdmin) return;

    const usersQuery = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const userData: UserProfile[] = [];
      let activeUsers = 0;
      const gameDistribution = { strength: 0, mind: 0, chance: 0 };

      snapshot.forEach((doc) => {
        const user = { uid: doc.id, ...doc.data() } as UserProfile;
        userData.push(user);

        // Update stats
        if (user.lastActive && 
            new Date().getTime() - new Date(user.lastActive).getTime() < 5 * 60 * 1000) {
          activeUsers++;
        }
        if (user.currentGame) {
          gameDistribution[user.currentGame as keyof typeof gameDistribution]++;
        }
      });

      setUsers(userData);
      setStats({
        totalUsers: userData.length,
        activeUsers,
        gameDistribution
      });
    });

    return () => unsubscribe();
  }, [isAdmin]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        
        {/* Stats Overview */}
        <AdminStats stats={stats} />

        {/* Game Access Management */}
        <AdminGameAccess users={users} />

        {/* User List and Management */}
        <AdminUserList users={users} />
      </div>
    </div>
  );
}