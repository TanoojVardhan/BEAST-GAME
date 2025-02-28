"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { UserProfile, GameType } from "@/types";

const gameDetails = {
  strength: {
    title: "Game of Strength",
    color: "text-red-500",
    bgGradient: "from-red-500 to-red-700",
  },
  mind: {
    title: "Mind Games",
    color: "text-blue-500",
    bgGradient: "from-blue-500 to-blue-700",
  },
  chance: {
    title: "Game of Chance",
    color: "text-green-500",
    bgGradient: "from-green-500 to-green-700",
  },
};

export default function GameConfirmationPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkGameSelection = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          router.push("/profile-setup");
          return;
        }

        const data = { uid: user.uid, ...userDoc.data() } as UserProfile;
        if (!data.currentGame) {
          router.push("/dashboard/games");
          return;
        }

        setUserData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    checkGameSelection();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!userData?.currentGame) return null;

  const game = gameDetails[userData.currentGame as GameType];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className={`inline-block px-4 py-2 rounded-full mb-8 bg-gradient-to-r ${game.bgGradient}`}>
          <span className="text-lg font-semibold">Game Selected!</span>
        </div>
        
        <h1 className="text-5xl font-bold mb-6">
          Welcome to{" "}
          <span className={game.color}>{game.title}</span>
        </h1>

        <p className="text-xl mb-8">
          Get ready, {userData.name}! Your challenge awaits.
        </p>

        <div className="bg-gray-800 p-8 rounded-lg shadow-xl mb-8">
          <h2 className="text-2xl font-semibold mb-4">Important Information</h2>
          <ul className="text-left space-y-4 text-gray-300">
            <li>• Your game selection is now locked</li>
            <li>• You cannot change your selection unless an admin resets it</li>
            <li>• Contact the organizers if you need any assistance</li>
          </ul>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg text-xl font-bold transition-all transform hover:scale-105"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}