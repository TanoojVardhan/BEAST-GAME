"use client";

import { useState } from "react";
import { UserProfile, GameType } from "@/types";
import { db } from "@/lib/firebase";
import { doc, updateDoc, writeBatch } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AdminGameAccess({ users }: { users: UserProfile[] }) {
  const [loading, setLoading] = useState(false);

  const toggleGameAccess = async (userId: string, game: GameType) => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', userId);
      const user = users.find(u => u.uid === userId);
      if (!user) return;

      // Toggle the access for the specific game
      await updateDoc(userRef, {
        [`gameAccess.${game}`]: !user.gameAccess[game],
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating game access:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetUserGame = async (userId: string) => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        currentGame: null,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error resetting user game:', error);
    } finally {
      setLoading(false);
    }
  };

  const revokeAllAccess = async () => {
    if (!window.confirm('Are you sure you want to revoke all game access for all users? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const userRefs = users.filter(u => u.role !== 'admin').map(user => doc(db, 'users', user.uid));
      
      userRefs.forEach(userRef => {
        batch.update(userRef, {
          'gameAccess.strength': false,
          'gameAccess.mind': false,
          'gameAccess.chance': false,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error revoking all access:', error);
    } finally {
      setLoading(false);
    }
  };

  // New function to grant access to all games for all users
  const grantAllAccess = async () => {
    if (!window.confirm('Are you sure you want to grant access to ALL games for ALL users?')) {
      return;
    }
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const userRefs = users.filter(u => u.role !== 'admin').map(user => doc(db, 'users', user.uid));
      
      userRefs.forEach(userRef => {
        batch.update(userRef, {
          'gameAccess.strength': true,
          'gameAccess.mind': true,
          'gameAccess.chance': true,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error granting all access:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get the count of users with any game access
  const usersWithAccess = users.filter(user => 
    user.gameAccess.strength || user.gameAccess.mind || user.gameAccess.chance
  ).length;

  // Get the count of users without any game access
  const usersWithoutAccess = users.filter(user => 
    !user.gameAccess.strength && !user.gameAccess.mind && !user.gameAccess.chance && user.role !== 'admin'
  ).length;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold mb-2">Game Access Management</h2>
          <div className="space-x-2">
            <Button 
              onClick={grantAllAccess} 
              disabled={loading || usersWithoutAccess === 0}
              variant="default"
              className="mb-2 bg-green-600 hover:bg-green-700"
            >
              Grant All Access
            </Button>
            <Button 
              onClick={revokeAllAccess} 
              disabled={loading || usersWithAccess === 0}
              variant="destructive"
              className="mb-2"
            >
              Revoke All Access
            </Button>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-2">
          Enable or disable access to specific games for each user. Users can only participate in games they have access to.
        </p>
        
        {usersWithoutAccess > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium text-yellow-700">
                {usersWithoutAccess} user{usersWithoutAccess !== 1 ? 's' : ''} waiting for game access
              </span>
            </div>
          </div>
        )}
        
        {usersWithAccess > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-blue-700">
                {usersWithAccess} user{usersWithAccess !== 1 ? 's' : ''} have game access
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Game
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Login Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Strength
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mind
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const hasAnyAccess = Object.values(user.gameAccess).some(access => access);
              const isLoggedIn = user.lastActive && 
                (new Date().getTime() - new Date(user.lastActive).getTime() < 10 * 60 * 1000);
              
              return (
                <tr key={user.uid} className={hasAnyAccess ? "bg-blue-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.gitamEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${user.currentGame ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      {user.currentGame || 'None'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isLoggedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      <span className={`h-2 w-2 rounded-full mr-1 ${isLoggedIn ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                      {isLoggedIn ? 'Online' : 'Offline'}
                    </div>
                  </td>
                  {['strength', 'mind', 'chance'].map((game) => (
                    <td key={game} className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant={user.gameAccess[game as GameType] ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleGameAccess(user.uid, game as GameType)}
                        disabled={loading || user.role === 'admin'}
                        className={user.gameAccess[game as GameType] ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {user.gameAccess[game as GameType] ? 'Enabled' : 'Disabled'}
                      </Button>
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => resetUserGame(user.uid)}
                      disabled={loading || user.role === 'admin' || !user.currentGame}
                    >
                      Reset Game
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>• Enable access to allow users to participate in specific games</p>
        <p>• Users with active games cannot change their selection unless reset</p>
        <p>• &quot;Grant All Access&quot; enables all games for all users</p>
        <p>• &quot;Revoke All Access&quot; removes access for all non-admin users</p>
      </div>
    </Card>
  );
}