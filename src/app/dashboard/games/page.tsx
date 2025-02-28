"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { GameType } from "@/types";

const gameCategories = [
  {
    title: "Game of Strength",
    description: "Test your physical prowess and endurance",
    href: "/dashboard/games/confirmation",
    bgClass: "from-red-500 to-red-700",
    type: "strength" as GameType
  },
  {
    title: "Mind Games",
    description: "Challenge your intellect and strategy",
    href: "/dashboard/games/confirmation",
    bgClass: "from-blue-500 to-blue-700",
    type: "mind" as GameType
  },
  {
    title: "Game of Chance",
    description: "Try your luck and test your fortune",
    href: "/dashboard/games/confirmation",
    bgClass: "from-green-500 to-green-700",
    type: "chance" as GameType
  }
];

export default function GamesPage() {
  const router = useRouter();
  const [gameAccess, setGameAccess] = useState<Record<GameType, boolean>>({
    strength: false,
    mind: false,
    chance: false
  });
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      
      // Set up a real-time listener for the user document
      const userDocRef = doc(db, "users", user.uid);
      const unsubscribeSnapshot = onSnapshot(
        userDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            // Update game access in real-time
            setGameAccess(userData.gameAccess || {
              strength: false,
              mind: false,
              chance: false
            });
            
            // If user has already selected a game, redirect to confirmation
            if (userData.currentGame) {
              router.push("/dashboard/games/confirmation");
            }

            // Update user's last active time
            updateDoc(userDocRef, {
              lastActive: new Date().toISOString()
            }).catch(err => console.error("Error updating last active time:", err));
          } else {
            // If user document doesn't exist, redirect to profile setup
            router.push("/profile-setup");
          }
          setLoading(false);
        },
        (err) => {
          console.error("Error getting user data:", err);
          setError("Error loading game access. Please try again.");
          setLoading(false);
        }
      );

      return () => {
        unsubscribeSnapshot();
      };
    });

    return () => {
      unsubscribeAuth();
    };
  }, [router]);

  const handleGameClick = async (game: GameType) => {
    const user = auth.currentUser;
    if (!user || !gameAccess[game] || selecting) return;

    try {
      setSelecting(true);
      await updateDoc(doc(db, "users", user.uid), {
        currentGame: game,
        lastActive: new Date().toISOString(),
        gameSelectedAt: new Date().toISOString()
      });

      // Redirect to confirmation page
      router.push("/dashboard/games/confirmation");
    } catch (error) {
      console.error("Error updating current game:", error);
      setError("Failed to select game. Please try again.");
      setSelecting(false);
    }
  };

  const hasNoAccess = !Object.values(gameAccess).some(access => access);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="animate-pulse">Loading your game options...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center">Choose Your Challenge</h1>
        
        {error && (
          <div className="mb-8 p-4 bg-red-600/20 border border-red-500/50 rounded-lg text-center">
            <p className="text-red-200">{error}</p>
          </div>
        )}
        
        {hasNoAccess && (
          <div className="mb-8 p-4 bg-yellow-600/20 border border-yellow-500/50 rounded-lg text-center">
            <h2 className="text-xl font-semibold mb-2 text-yellow-400">Action Required</h2>
            <p className="text-yellow-200">
              You don&apos;t have access to any games yet. Please wait for an administrator to grant you access to participate.
              <br />
              Contact the organizers if you believe this is an error.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {gameCategories.map((category) => {
            const isAccessible = gameAccess[category.type];

            return (
              <div
                key={category.title}
                className={`
                  relative block p-6 rounded-lg shadow-lg
                  ${isAccessible ? `bg-gradient-to-br ${category.bgClass} cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl` : 'bg-gray-700 opacity-75'}
                `}
                onClick={() => isAccessible && handleGameClick(category.type)}
              >
                <h2 className="text-2xl font-bold mb-3">{category.title}</h2>
                <p className="text-gray-100 mb-4">{category.description}</p>
                <div className="flex items-center text-sm">
                  {!isAccessible ? (
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.374-14c1.453 0 2.626 1.173 2.626 2.626v8.748c0 1.453-1.173 2.626-2.626 2.626H4.626C3.173 17 2 15.827 2 14.374V5.626C2 4.173 3.173 3 4.626 3h16.748z" />
                      </svg>
                      <span>Waiting for Access</span>
                    </div>
                  ) : selecting ? (
                    <span>Selecting...</span>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Click to Select This Game</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}