"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { ProfileSetupForm } from "@/components/profile-setup-form";
import { useAdmin } from "@/lib/adminContext";

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

  // If we're still loading admin status or user is not an admin, show the form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        {isLoading ? (
          <div className="text-center">Loading...</div>
        ) : !isAdmin ? (
          <ProfileSetupForm />
        ) : null}
      </div>
    </div>
  );
}