/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, updateLastActive } from "@/lib/firebase";
import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useAdmin } from "@/lib/adminContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const { isAdmin, isLoading } = useAdmin();

  useEffect(() => {
    const checkUserAndProfile = async (user: User) => {
      try {
        // First update the last active time
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        // If the user document doesn't exist and they're not an admin (admins are handled in adminContext)
        if (!userDoc.exists() && !isAdmin) {
          router.push("/profile-setup");
          return;
        } else if (userDoc.exists()) {
          // Set the user name if document exists
          setUserName(userDoc.data().name);
        } else if (isAdmin) {
          // Admin without profile should still have a name (from adminContext auto-create)
          setUserName("Admin User");
        }
      } catch (error) {
        console.error("Error checking user profile:", error);
        if (!isAdmin) {
          router.push("/profile-setup");
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
      } else {
        checkUserAndProfile(user);
      }
    });

    return () => unsubscribe();
  }, [router, isAdmin]);

  useEffect(() => {
    const interval = setInterval(() => {
      const user = auth.currentUser;
      if (user) {
        updateLastActive(user.uid);
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600"
              >
                Beast Games
              </Link>
              {userName && (
                <span className="text-sm text-gray-300">
                  Welcome, {userName}
                </span>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="ml-4 px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
                >
                  Admin Panel
                </Link>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main>
        {children}
      </main>
    </div>
  );
}