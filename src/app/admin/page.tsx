"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/adminContext';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { UserProfile, GameStats } from '@/types';
import { AdminUserList } from '@/components/admin/user-list';
import { AdminStats } from '@/components/admin/stats';
import { AdminGameAccess } from '@/components/admin/game-access';

export default function AdminDashboard() {
  const router = useRouter();
  const { isAdmin, isLoading } = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
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

    const fetchUsers = async () => {
      try {
        // First try with getDocs to see if we can access the users collection
        const querySnapshot = await getDocs(collection(db, 'users'));
        if (querySnapshot.empty) {
          console.log('No users found in database.');
        } else {
          console.log(`Found ${querySnapshot.size} users with getDocs.`);
        }
      } catch (err) {
        console.error("Error fetching users with getDocs:", err);
      }
    };

    fetchUsers();

    // Set up real-time listener
    const usersQuery = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(
      usersQuery, 
      (snapshot) => {
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
        console.log(`Snapshot received with ${userData.length} users.`);
      },
      (err) => {
        console.error("Error in snapshot listener:", err);
        setError(`Error loading users: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        <AdminStats stats={stats} />
        <AdminGameAccess users={users} />
        <AdminUserList users={users} />
        {users.length === 0 && !error && (
          <div className="p-6 text-center bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">No users found in the database. This could be due to:</p>
            <ul className="list-disc text-left mt-2 ml-8 text-yellow-700">
              <li>No users have signed up yet</li>
              <li>Firebase security rules preventing access to user data</li>
              <li>Network connectivity issues</li>
            </ul>
            <p className="mt-2 text-yellow-700">Check the debug information above for more details.</p>
          </div>
        )}
      </div>
    </div>
  );
}