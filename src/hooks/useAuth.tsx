
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';

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
  getAllUsers: () => User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Empty array for users - no demo accounts
const MOCK_USERS: User[] = [];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('chat_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Get all users for chat functionality
  const getAllUsers = () => {
    return MOCK_USERS;
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      // Check if user exists and password matches stored password
      if (foundUser) {
        const storedPassword = localStorage.getItem(`password_${foundUser.id}`);
        if (storedPassword === password) {
          setUser(foundUser);
          localStorage.setItem('chat_user', JSON.stringify(foundUser));
          toast.success('Login successful!');
          return true;
        }
      }
      
      toast.error('Invalid email or password');
      return false;
    } catch (error) {
      toast.error('An error occurred during login');
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
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user with this email already exists
      const existingUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        toast.error('User with this email already exists');
        return false;
      }
      
      // Create new user - first user is admin, rest are normal users
      const isAdmin = MOCK_USERS.length === 0;
      
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        isAdmin,
        avatar: avatar || `https://i.pravatar.cc/150?u=${Date.now()}`,
        securityQuestion,
        securityAnswer
      };
      
      // Add user to mock database
      MOCK_USERS.push(newUser);
      
      // Store password separately for security
      localStorage.setItem(`password_${newUser.id}`, password);
      
      // Log in the new user
      setUser(newUser);
      localStorage.setItem('chat_user', JSON.stringify(newUser));
      
      toast.success(`Registration successful! ${isAdmin ? 'You are set as an admin.' : ''}`);
      return true;
    } catch (error) {
      toast.error('An error occurred during registration');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string, securityAnswer: string, newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user
      const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!foundUser) {
        toast.error('User with this email does not exist');
        return false;
      }
      
      // Verify security answer
      if (foundUser.securityAnswer?.toLowerCase() !== securityAnswer.toLowerCase()) {
        toast.error('Incorrect security answer');
        return false;
      }
      
      // Update password
      localStorage.setItem(`password_${foundUser.id}`, newPassword);
      
      toast.success('Password has been reset successfully');
      return true;
    } catch (error) {
      toast.error('An error occurred during password reset');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('chat_user');
    toast.success('Logged out successfully');
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
