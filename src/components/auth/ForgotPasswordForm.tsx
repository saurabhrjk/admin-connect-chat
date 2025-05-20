
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

export default function ForgotPasswordForm({ onSwitchToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const { resetPassword, getAllUsers } = useAuth();

  const handleEmailCheck = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    setIsLoading(true);
    try {
      // Properly await the Promise returned by getAllUsers
      const users = await getAllUsers();
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!foundUser) {
        setError('No account found with this email');
        setIsLoading(false);
        return;
      }
      
      setSecurityQuestion(foundUser.securityQuestion || 'What is your favorite color?');
      setError('');
    } catch (err) {
      console.error('Error checking email:', err);
      setError('An error occurred while checking your email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    try {
      const success = await resetPassword(email, securityAnswer, newPassword);
      if (success) {
        setResetSuccess(true);
        toast.success('Password has been reset successfully. You can now log in with your new password.');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('An error occurred while resetting your password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-chat-primary mb-2">ConnectWithSaurabh</h1>
        <p className="text-muted-foreground">Reset Your Password</p>
      </div>

      {resetSuccess ? (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-md border border-green-200">
            <p className="text-green-800">
              A password reset link has been sent to your email address. Please check your inbox and follow the instructions to reset your password.
            </p>
          </div>
          <Button 
            type="button" 
            className="w-full bg-chat-primary hover:bg-chat-secondary" 
            onClick={onSwitchToLogin}
          >
            Return to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex space-x-2">
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!securityQuestion}
                required
              />
              {!securityQuestion && (
                <Button type="button" onClick={handleEmailCheck} className="whitespace-nowrap" disabled={isLoading}>
                  {isLoading ? "Checking..." : "Find Account"}
                </Button>
              )}
            </div>
          </div>
          
          {securityQuestion && (
            <>
              <div className="space-y-2">
                <Label htmlFor="securityQuestion">Security Question</Label>
                <div className="p-3 border rounded-md bg-muted">
                  {securityQuestion}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="securityAnswer">Security Answer</Label>
                <Input
                  id="securityAnswer"
                  placeholder="Enter your answer"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          
          {error && (
            <div className="text-sm font-medium text-destructive">{error}</div>
          )}
          
          {securityQuestion && (
            <Button type="submit" className="w-full bg-chat-primary hover:bg-chat-secondary" disabled={isLoading}>
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </Button>
          )}
        </form>
      )}

      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          Remember your password?{" "}
          <Button variant="link" className="p-0" onClick={onSwitchToLogin}>
            Sign in
          </Button>
        </p>
      </div>
    </div>
  );
}
