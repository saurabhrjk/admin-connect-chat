import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isAdmin: boolean;
  securityQuestion?: string;
  securityAnswer?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, securityQuestion: string, securityAnswer: string, avatar?: string | null) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string, securityAnswer: string, newPassword: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
  getAllUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for active session
    const checkSession = async () => {
      setIsLoading(true);
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error.message);
          return;
        }
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Unexpected error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile from custom table
  const fetchUserProfile = async (authId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error.message);
        return;
      }
      
      if (data) {
        const userProfile: User = {
          id: data.id,
          name: data.name,
          email: data.email,
          avatar: data.avatar || undefined,
          isAdmin: data.is_admin,
          securityQuestion: data.security_question || undefined,
          securityAnswer: data.security_answer || undefined
        };
        
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
    }
  };

  // Get all users for chat functionality
  const getAllUsers = async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) {
        console.error('Error fetching users:', error.message);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        name: item.name,
        email: item.email,
        avatar: item.avatar || undefined,
        isAdmin: item.is_admin,
        securityQuestion: item.security_question || undefined,
        securityAnswer: item.security_answer || undefined
      }));
    } catch (error) {
      console.error('Unexpected error fetching users:', error);
      return [];
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast.error(error.message);
        return false;
      }
      
      if (data.user) {
        toast.success('Login successful!');
        return true;
      }
      
      return false;
    } catch (error) {
      toast.error('An error occurred during login');
      console.error(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (
    name: string, 
    email: string, 
    password: string, 
    securityQuestion: string, 
    securityAnswer: string, 
    avatar?: string | null
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (authError) {
        toast.error(authError.message);
        return false;
      }
      
      if (!authData.user) {
        toast.error('Registration failed');
        return false;
      }
      
      // Insert user into our custom users table
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            auth_id: authData.user.id,
            name,
            email,
            avatar: avatar || null,
            security_question: securityQuestion,
            security_answer: securityAnswer
          }
        ]);
      
      if (profileError) {
        console.error('Error creating user profile:', profileError.message);
        toast.error('Failed to create user profile');
        
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return false;
      }
      
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      toast.error('An error occurred during registration');
      console.error(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string, securityAnswer: string, newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (userError || !userData) {
        toast.error('User with this email does not exist');
        return false;
      }
      
      // Verify security answer
      if (userData.security_answer?.toLowerCase() !== securityAnswer.toLowerCase()) {
        toast.error('Incorrect security answer');
        return false;
      }
      
      // Get auth ID from user data
      const authId = userData.auth_id;
      
      if (!authId) {
        toast.error('Cannot find authentication record');
        return false;
      }
      
      // Update password directly using the auth_id
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authId,
        { password: newPassword }
      );
      
      if (updateError) {
        toast.error(updateError.message);
        return false;
      }
      
      toast.success('Password has been reset successfully');
      return true;
    } catch (error) {
      toast.error('An error occurred during password reset');
      console.error('Password reset error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        resetPassword,
        isAuthenticated: !!user,
        isLoading,
        getAllUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
