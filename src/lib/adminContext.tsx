"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  checkIsAdmin: (email: string | null) => Promise<boolean>;
}

// Define admin emails here - make sure these match what you're using in your application
const ADMIN_EMAILS = ['tgantasa@gitam.in', 'physicalfitness_vsp@gitam.in'];

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  isLoading: true,
  checkIsAdmin: async () => false,
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Helper for checking if an email is in the admin list
  const checkIsAdmin = async (email: string | null): Promise<boolean> => {
    if (!email) return false;
    const isAdminEmail = ADMIN_EMAILS.includes(email);
    console.log(`Checking admin status for ${email}: ${isAdminEmail ? 'Is admin' : 'Not admin'}`);
    return isAdminEmail;
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log(`User authenticated: ${user.email}`);
        // First check if the email is in the admin list
        const adminByEmail = await checkIsAdmin(user.email);
        
        try {
          // Check if user has a profile in Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const isAdminRole = userData.role === 'admin';
            
            console.log(`User ${user.email} exists in Firestore with role: ${userData.role}`);
            
            // Use role from Firestore if it exists
            setIsAdmin(isAdminRole);
            
            // If the user should be an admin by email but isn't marked in Firestore, update it
            if (adminByEmail && !isAdminRole) {
              console.log(`Upgrading ${user.email} to admin role in Firestore`);
              await setDoc(doc(db, 'users', user.uid), {
                ...userData,
                role: 'admin',
                gameAccess: {
                  strength: true,
                  mind: true,
                  chance: true
                },
                updatedAt: new Date().toISOString(),
              });
              setIsAdmin(true);
            }
          } else if (adminByEmail) {
            // If the user is an admin by email but doesn't have a profile yet, create a basic one
            console.log(`Creating new admin profile for ${user.email}`);
            await setDoc(doc(db, 'users', user.uid), {
              name: user.displayName || 'Admin User',
              email: user.email,
              role: 'admin',
              gameAccess: {
                strength: true,
                mind: true,
                chance: true
              },
              mobileNumber: '',
              branch: 'Admin',
              year: '',
              gitamEmail: user.email,
              registrationNumber: '',
              lastActive: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            
            setIsAdmin(true);
          } else {
            // Not an admin
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          // Fall back to email check if database fails
          setIsAdmin(adminByEmail);
        }
      } else {
        console.log('No user authenticated');
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, isLoading, checkIsAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
export { ADMIN_EMAILS };