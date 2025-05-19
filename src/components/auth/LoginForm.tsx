
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
}

export default function LoginForm({ onSwitchToRegister, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="space-y-4 w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-chat-primary mb-2">ConnectWithSaurabh</h1>
        <p className="text-muted-foreground">Sign in to your account</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Button 
              type="button" 
              variant="link" 
              className="px-0 font-normal text-xs" 
              onClick={onForgotPassword}
            >
              Forgot password?
            </Button>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {error && (
          <div className="text-sm font-medium text-destructive">{error}</div>
        )}
        
        <Button type="submit" className="w-full bg-chat-primary hover:bg-chat-secondary" disabled={isLoading}>
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>
      </form>
      
      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Button variant="link" className="p-0" onClick={onSwitchToRegister}>
            Sign up
          </Button>
        </p>
      </div>
    </div>
  );
}
