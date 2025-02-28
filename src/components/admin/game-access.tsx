"use client";

import { useState, useEffect } from "react";
import { UserProfile, GameType } from "@/types";
import { db } from "@/lib/firebase";
import { doc, updateDoc, writeBatch, getDoc, setDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AdminGameAccess({ users }: { users: UserProfile[] }) {
  const [loading, setLoading] = useState(false);
  const [localUsers, setLocalUsers] = useState<UserProfile[]>(users);
  const [operationMessage, setOperationMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [testUserCounter, setTestUserCounter] = useState(1);

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  // Clear operation message after 5 seconds
  useEffect(() => {
    if (operationMessage) {
      const timer = setTimeout(() => {
        setOperationMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [operationMessage]);

  // Function to create a test user for demonstration purposes
  const createTestUser = async () => {
    setLoading(true);
    setOperationMessage(null);
    try {
      const testUserNumber = testUserCounter;
      setTestUserCounter(prev => prev + 1);
      
      const timestamp = new Date().toISOString();
      const testUserId = `test-user-${timestamp}-${testUserNumber}`;
      
      const testUserData: Omit<UserProfile, 'uid'> = {
        name: `Test User ${testUserNumber}`,
        email: `testuser${testUserNumber}@example.com`,
        gitamEmail: `testuser${testUserNumber}@gitam.in`,
        role: 'user',
        mobileNumber: `999999${testUserNumber.toString().padStart(4, '0')}`,
        branch: 'Computer Science',
        year: '2',
        registrationNumber: `REG${testUserNumber.toString().padStart(6, '0')}`,
        gameAccess: {
          strength: false,
          mind: false,
          chance: false
        },
        lastActive: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await setDoc(doc(db, 'users', testUserId), testUserData);
      
      // Add the new user to the local state to avoid needing a refresh
      setLocalUsers(prevUsers => [
        ...prevUsers,
        { uid: testUserId, ...testUserData }
      ]);
      
      setOperationMessage({
        type: 'success',
        message: `Test user "${testUserData.name}" created successfully`
      });
    } catch (error) {
      console.error('Error creating test user:', error);
      setOperationMessage({
        type: 'error',
        message: `Error creating test user: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleGameAccess = async (userId: string, game: GameType) => {
    setLoading(true);
    setOperationMessage(null);
    try {
      const userRef = doc(db, 'users', userId);
      const user = localUsers.find(u => u.uid === userId);
      if (!user) {
        throw new Error(`User not found with ID: ${userId}`);
      }

      // Toggle the access for the specific game
      const newAccess = !user.gameAccess[game];
      
      console.log(`Updating ${game} access to ${newAccess} for user: ${user.name} (${userId})`);
      
      // Update in Firestore
      await updateDoc(userRef, {
        [`gameAccess.${game}`]: newAccess,
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state to reflect the change immediately
      setLocalUsers(prevUsers => 
        prevUsers.map(u => 
          u.uid === userId 
            ? {
                ...u,
                gameAccess: {
                  ...u.gameAccess,
                  [game]: newAccess
                }
              }
            : u
        )
      );
      
      // Verify the update was successful by fetching the latest data
      const updatedUserDoc = await getDoc(userRef);
      if (updatedUserDoc.exists()) {
        const updatedData = updatedUserDoc.data();
        const actualAccess = updatedData.gameAccess?.[game];
        
        if (actualAccess === newAccess) {
          console.log(`Successfully verified ${game} access is now ${newAccess} for user: ${user.name}`);
          setOperationMessage({
            type: 'success',
            message: `${game} access ${newAccess ? 'granted' : 'revoked'} for ${user.name}`
          });
        } else {
          console.error(`Verification failed: Expected ${game} access to be ${newAccess} but got ${actualAccess}`);
          setOperationMessage({
            type: 'error',
            message: `Failed to update ${game} access for ${user.name}. Database state mismatch.`
          });
        }
      }
    } catch (error) {
      console.error('Error updating game access:', error);
      setOperationMessage({
        type: 'error',
        message: `Error updating game access: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const resetUserGame = async (userId: string) => {
    setLoading(true);
    setOperationMessage(null);
    try {
      const userRef = doc(db, 'users', userId);
      const user = localUsers.find(u => u.uid === userId);
      if (!user) {
        throw new Error(`User not found with ID: ${userId}`);
      }
      
      await updateDoc(userRef, {
        currentGame: null,
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setLocalUsers(prevUsers => 
        prevUsers.map(u => 
          u.uid === userId 
            ? { ...u, currentGame: undefined }
            : u
        )
      );
      
      setOperationMessage({
        type: 'success',
        message: `Game reset successful for ${user.name}`
      });
    } catch (error) {
      console.error('Error resetting user game:', error);
      setOperationMessage({
        type: 'error',
        message: `Error resetting game: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeAllAccess = async () => {
    if (!window.confirm('Are you sure you want to revoke all game access for all users? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setOperationMessage(null);
    try {
      const batch = writeBatch(db);
      const nonAdminUsers = localUsers.filter(u => u.role !== 'admin');
      const userRefs = nonAdminUsers.map(user => doc(db, 'users', user.uid));
      
      if (userRefs.length === 0) {
        throw new Error('No non-admin users found to update');
      }
      
      console.log(`Revoking access for ${userRefs.length} users`);
      
      userRefs.forEach(userRef => {
        batch.update(userRef, {
          'gameAccess.strength': false,
          'gameAccess.mind': false,
          'gameAccess.chance': false,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      
      // Update local state
      setLocalUsers(prevUsers => 
        prevUsers.map(u => 
          u.role !== 'admin' 
            ? {
                ...u,
                gameAccess: {
                  strength: false,
                  mind: false,
                  chance: false
                }
              }
            : u
        )
      );
      
      setOperationMessage({
        type: 'success',
        message: `Access revoked for all ${userRefs.length} users`
      });
    } catch (error) {
      console.error('Error revoking all access:', error);
      setOperationMessage({
        type: 'error',
        message: `Error revoking access: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
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
    setOperationMessage(null);
    try {
      const batch = writeBatch(db);
      const nonAdminUsers = localUsers.filter(u => u.role !== 'admin');
      const userRefs = nonAdminUsers.map(user => doc(db, 'users', user.uid));
      
      if (userRefs.length === 0) {
        throw new Error('No non-admin users found to update');
      }
      
      console.log(`Granting access for ${userRefs.length} users`);
      
      userRefs.forEach(userRef => {
        batch.update(userRef, {
          'gameAccess.strength': true,
          'gameAccess.mind': true,
          'gameAccess.chance': true,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      
      // Update local state
      setLocalUsers(prevUsers => 
        prevUsers.map(u => 
          u.role !== 'admin' 
            ? {
                ...u,
                gameAccess: {
                  strength: true,
                  mind: true,
                  chance: true
                }
              }
            : u
        )
      );
      
      setOperationMessage({
        type: 'success',
        message: `Access granted for all ${userRefs.length} users`
      });
    } catch (error) {
      console.error('Error granting all access:', error);
      setOperationMessage({
        type: 'error',
        message: `Error granting access: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Get the count of users with any game access
  const usersWithAccess = localUsers.filter(user => 
    user.gameAccess.strength || user.gameAccess.mind || user.gameAccess.chance
  ).length;

  // Get the count of users without any game access
  const usersWithoutAccess = localUsers.filter(user => 
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
        
        {operationMessage && (
          <div className={`mb-4 p-4 rounded-md ${
            operationMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {operationMessage.message}
          </div>
        )}
        
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

      <div className="mb-6">
        {localUsers.length === 0 && (
          <div className="text-center p-6 bg-gray-50 rounded-md border border-gray-200">
            <p className="mb-4 text-gray-600">No users found. Users will appear here after they sign up.</p>
            <Button
              onClick={createTestUser}
              disabled={loading}
              variant="outline"
              className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
            >
              Create Test User (For Demo Only)
            </Button>
            <p className="mt-2 text-xs text-gray-500">
              This will create a test user in the database to demonstrate the game access functionality.
            </p>
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
            {localUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No users found. Users will appear here after they sign up or you create test users.
                </td>
              </tr>
            ) : (
              localUsers.map((user) => {
                const hasAnyAccess = Object.values(user.gameAccess).some(access => access);
                const isLoggedIn = user.lastActive && 
                  (new Date().getTime() - new Date(user.lastActive).getTime() < 10 * 60 * 1000);
                
                return (
                  <tr key={user.uid} className={hasAnyAccess ? "bg-blue-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.gitamEmail}</div>
                      <div className="text-xs text-gray-400">{user.role}</div>
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
              })
            )}
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