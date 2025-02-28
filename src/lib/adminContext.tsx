"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  checkIsAdmin: (email: string | null) => Promise<boolean>;
}

const ADMIN_EMAILS = ['admin@gitam.in', 'tgantasa@gitam.in'];

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  isLoading: true,
  checkIsAdmin: async () => false,
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkIsAdmin = async (email: string | null): Promise<boolean> => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // First check if the email is in the admin list
        const adminStatus = await checkIsAdmin(user.email);
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          // If user is an admin but doesn't have a profile yet, create a basic one
          if (adminStatus && !userDoc.exists()) {
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
            setIsAdmin(userDoc.data()?.role === 'admin');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(adminStatus); // Fall back to email check if database fails
        }
      } else {
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