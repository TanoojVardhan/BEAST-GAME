/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_EMAILS } from "@/lib/adminContext";

export function ProfileSetupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    branch: "",
    year: "",
    gitamEmail: "",
    registrationNumber: "",
    mobileNumber: "", // Added mobile number field
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const userId = auth.currentUser?.uid;
      const userEmail = auth.currentUser?.email;
      if (!userId) throw new Error("No user found");

      // Check if the user should be an admin
      const isAdmin = ADMIN_EMAILS.includes(userEmail || '');
      console.log(`Creating profile for ${userEmail}, admin status: ${isAdmin}`);

      // Check if the user already has a document (might have been created by admin context)
      const userDoc = await getDoc(doc(db, "users", userId));
      const existingData = userDoc.exists() ? userDoc.data() : null;

      // If the user already has game access set, don't overwrite it
      const gameAccess = existingData?.gameAccess || {
        strength: isAdmin, // Admins get access to all games by default
        mind: isAdmin,
        chance: isAdmin
      };

      await setDoc(doc(db, "users", userId), {
        ...formData,
        email: userEmail,
        role: isAdmin ? 'admin' : 'user',
        gameAccess: gameAccess,
        currentGame: existingData?.currentGame || null,
        lastActive: new Date().toISOString(),
        createdAt: existingData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(`Profile created/updated successfully for ${userEmail}`);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      console.error("Profile setup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>Please provide your details to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm bg-red-100 border border-red-200 text-red-600 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              name="mobileNumber"
              type="tel"
              pattern="[0-9]{10}"
              required
              placeholder="10-digit mobile number"
              value={formData.mobileNumber}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              name="branch"
              required
              value={formData.branch}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              name="year"
              required
              type="number"
              min="1"
              max="4"
              value={formData.year}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gitamEmail">Gitam Email ID</Label>
            <Input
              id="gitamEmail"
              name="gitamEmail"
              type="email"
              required
              placeholder="username@gitam.in"
              value={formData.gitamEmail}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Registration Number</Label>
            <Input
              id="registrationNumber"
              name="registrationNumber"
              required
              value={formData.registrationNumber}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Complete Setup"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}