import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const securityQuestions = [
  "What was your first pet's name?",
  "In what city were you born?",
  "What is your mother's maiden name?",
  "What high school did you attend?",
  "What was the make of your first car?",
  "What is your favorite movie?",
  "What is your favorite color?"
];

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState(securityQuestions[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [error, setError] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { register, isLoading } = useAuth();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatar(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!securityAnswer.trim()) {
      setError('Security answer is required');
      return;
    }
    
    const success = await register(name, email, password, securityQuestion, securityAnswer, avatar);
    if (success) {
      // Registration successful - user is automatically logged in by useAuth hook
    }
  };

  return (
    <div className="space-y-4 w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-chat-primary mb-2">ConnectWithSaurabh</h1>
        <p className="text-muted-foreground">Create a new account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-chat-primary cursor-pointer">
              {avatar ? (
                <AvatarImage src={avatar} alt="Profile" />
              ) : (
                <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div 
              className="absolute bottom-0 right-0 bg-chat-primary rounded-full p-2 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4 text-white" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="securityQuestion">Security Question</Label>
          <Select value={securityQuestion} onValueChange={setSecurityQuestion}>
            <SelectTrigger>
              <SelectValue placeholder="Select a security question" />
            </SelectTrigger>
            <SelectContent>
              {securityQuestions.map((question, index) => (
                <SelectItem key={index} value={question}>
                  {question}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="securityAnswer">Security Answer</Label>
          <Input
            id="securityAnswer"
            placeholder="Answer to your security question"
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
            required
          />
        </div>
        
        {error && (
          <div className="text-sm font-medium text-destructive">{error}</div>
        )}
        
        <Button type="submit" className="w-full bg-chat-primary hover:bg-chat-secondary" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Button variant="link" className="p-0" onClick={onSwitchToLogin}>
            Sign in
          </Button>
        </p>
      </div>
    </div>
  );
}
