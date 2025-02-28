"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignUpForm } from "@/components/signup-form";
import { auth } from "@/lib/firebase";
import { User } from "firebase/auth";

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (user) {
        router.push("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  );
}