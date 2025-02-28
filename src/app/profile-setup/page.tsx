"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { ProfileSetupForm } from "@/components/profile-setup-form";
import { useAdmin } from "@/lib/adminContext";
import { Button } from "@/components/ui/button";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useAdmin();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
      } else if (isAdmin && !isLoading) {
        // If user is an admin, redirect to dashboard (no profile setup needed)
        router.push("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [router, isAdmin, isLoading]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // If we're still loading admin status or user is not an admin, show the form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            Sign Out
          </Button>
        </div>
        {isLoading ? (
          <div className="text-center">Loading...</div>
        ) : !isAdmin ? (
          <ProfileSetupForm />
        ) : null}
      </div>
    </div>
  );
}