import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, User, Mail, Lock, Heart, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { supabase, api } from '../utils/supabase/client';
import type { User } from '../App';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function AuthScreen({ onLogin, isDarkMode, onToggleDarkMode }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    petName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const validatePassword = (password: string) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;
    
    return hasUppercase && hasLowercase && hasSpecialChar && hasMinLength;
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!isLogin) {
      if (!formData.petName) {
        toast.error('Please enter your pet name');
        return;
      }

      if (!validatePassword(formData.password)) {
        toast.error('Password must be at least 8 characters with uppercase, lowercase, and special characters');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        console.log('Attempting to sign in with email:', formData.email);
        
        // First, try to find user in local storage (fallback)
        const localUsers = JSON.parse(localStorage.getItem('nimathi-local-users') || '[]');
        const localUser = localUsers.find((u: any) => u.email === formData.email);
        
        // Try Supabase authentication
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          console.log('Supabase sign in response:', { data, error });

          if (error) {
            console.warn('Supabase sign in failed:', error.message);
            
            // Fall back to local authentication
            if (localUser && localUser.password === formData.password) {
              const user: User = {
                id: localUser.id,
                petName: localUser.petName,
                email: localUser.email,
                avatar: localUser.avatar,
                rewardPoints: localUser.rewardPoints || 0,
                stressLevels: localUser.stressLevels || []
              };

              toast.success(`Welcome back, ${user.petName}! (Local Mode)`);
              onLogin(user);
              return;
            } else {
              // No local user found either
              if (error.message.includes('Invalid login credentials')) {
                toast.error('No account found with these credentials. Please sign up first or try the demo account.');
              } else {
                toast.error(error.message);
              }
              return;
            }
          }

          if (data.session) {
            console.log('Session created, getting user profile for:', data.user.id);
            
            // Try to get user profile from backend
            try {
              const userResponse = await api.getUser(data.user.id, data.session.access_token);
              
              console.log('User profile response:', userResponse);
              
              if (!userResponse.error && userResponse.user) {
                const user: User = {
                  id: userResponse.user.id,
                  petName: userResponse.user.petName,
                  email: userResponse.user.email,
                  avatar: userResponse.user.avatar,
                  rewardPoints: userResponse.user.rewardPoints || 0,
                  stressLevels: userResponse.user.stressLevels || []
                };

                // Store session data
                localStorage.setItem('nimathi-session', JSON.stringify({
                  accessToken: data.session.access_token,
                  refreshToken: data.session.refresh_token
                }));

                toast.success(`Welcome back, ${user.petName}!`);
                onLogin(user);
                return;
              }
            } catch (backendError) {
              console.warn('Backend profile fetch failed, using fallback');
            }

            // Backend failed, but we have a valid Supabase session
            // Create a user profile from available data
            const user: User = {
              id: data.user.id,
              petName: data.user.email?.split('@')[0] || 'User',
              email: data.user.email || formData.email,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
              rewardPoints: 0,
              stressLevels: []
            };

            localStorage.setItem('nimathi-session', JSON.stringify({
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token
            }));

            toast.success(`Welcome back, ${user.petName}! (Basic Mode)`);
            onLogin(user);
          }
        } catch (authError) {
          console.error('Authentication completely failed:', authError);
          
          // Final fallback: local storage only
          if (localUser && localUser.password === formData.password) {
            const user: User = {
              id: localUser.id,
              petName: localUser.petName,
              email: localUser.email,
              avatar: localUser.avatar,
              rewardPoints: localUser.rewardPoints || 0,
              stressLevels: localUser.stressLevels || []
            };

            toast.success(`Welcome back, ${user.petName}! (Offline Mode)`);
            onLogin(user);
          } else {
            toast.error('Unable to sign in. Please check your credentials or create a new account.');
          }
        }
      } else {
        console.log('Attempting to sign up with:', { petName: formData.petName, email: formData.email });
        
        // Check if user already exists locally
        const localUsers = JSON.parse(localStorage.getItem('nimathi-local-users') || '[]');
        if (localUsers.find((u: any) => u.email === formData.email)) {
          toast.error('An account with this email already exists. Please sign in instead.');
          return;
        }

        // Generate user ID
        const userId = `nimathi_${Math.random().toString(36).substr(2, 9)}`;
        
        // Try backend signup first
        let backendSuccess = false;
        let supabaseSuccess = false;
        
        try {
          const signupResponse = await api.signup(formData.petName, formData.email, formData.password);
          console.log('Backend signup response:', signupResponse);
          
          if (!signupResponse.error) {
            backendSuccess = true;
            
            // Try to sign in to Supabase to get session
            try {
              const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
              });

              if (!error && data.session) {
                supabaseSuccess = true;
                
                const user: User = {
                  id: signupResponse.user.id,
                  petName: signupResponse.user.petName,
                  email: signupResponse.user.email,
                  avatar: signupResponse.user.avatar,
                  rewardPoints: signupResponse.user.rewardPoints || 0,
                  stressLevels: signupResponse.user.stressLevels || []
                };

                localStorage.setItem('nimathi-session', JSON.stringify({
                  accessToken: data.session.access_token,
                  refreshToken: data.session.refresh_token
                }));

                toast.success('Account created successfully!');
                onLogin(user);
                return;
              }
            } catch (authError) {
              console.warn('Supabase auth failed after backend signup:', authError);
            }
          }
        } catch (backendError) {
          console.warn('Backend signup failed:', backendError);
        }

        // Fallback: Create local account
        const newUser = {
          id: backendSuccess ? undefined : userId, // Use backend ID if available
          petName: formData.petName,
          email: formData.email,
          password: formData.password, // In real app, this would be hashed
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.petName}`,
          rewardPoints: 0,
          stressLevels: [],
          createdAt: new Date().toISOString()
        };

        // If backend succeeded but Supabase auth failed, still save locally for fallback
        if (backendSuccess || !supabaseSuccess) {
          localUsers.push(newUser);
          localStorage.setItem('nimathi-local-users', JSON.stringify(localUsers));
        }

        const user: User = {
          id: newUser.id || userId,
          petName: newUser.petName,
          email: newUser.email,
          avatar: newUser.avatar,
          rewardPoints: newUser.rewardPoints,
          stressLevels: newUser.stressLevels
        };

        const mode = backendSuccess && supabaseSuccess ? '' : 
                    backendSuccess ? ' (Backend Only)' : ' (Local Mode)';
        
        toast.success(`Account created successfully!${mode}`);
        onLogin(user);
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDemoLogin = () => {
    setFormData({
      petName: 'Demo User',
      email: 'demo@nimathi.app',
      password: 'DemoPassword123!',
      confirmPassword: 'DemoPassword123!'
    });
    setIsLogin(false); // Set to signup mode to create demo account
    toast.info('Demo account details filled. Click "Create Account" to continue.');
  };

  const handleInstantDemo = () => {
    const demoUser: User = {
      id: `demo_${Date.now()}`,
      petName: 'Demo User',
      email: 'demo@nimathi.app',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      rewardPoints: 150,
      stressLevels: [
        { week: '2024-01', level: 7 },
        { week: '2024-02', level: 5 },
        { week: '2024-03', level: 3 }
      ]
    };

    toast.success('Welcome to Nimathi Demo!');
    onLogin(demoUser);
  };

  const testBackend = async () => {
    try {
      const response = await api.health();
      console.log('Backend test response:', response);
      
      if (response.healthy) {
        toast.success('✅ Backend is healthy!');
      } else {
        toast.error(`❌ Backend issue: ${response.error}`);
      }
    } catch (error) {
      console.error('Backend test failed:', error);
      toast.error('❌ Cannot reach backend server');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Dark Mode Toggle */}
      <motion.div 
        className="fixed top-4 right-4 z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button variant="ghost" size="sm" onClick={onToggleDarkMode} className="p-2">
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo and Title */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 bg-primary rounded-full flex items-center justify-center"
            >
              <Heart className="w-8 h-8 text-primary-foreground" />
            </motion.div>
          </div>
          <h1 className="text-2xl text-foreground mb-2">Nimathi</h1>
          <p className="text-muted-foreground">Your mental wellness companion</p>
        </motion.div>

        <Card className="p-6 shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-lg text-foreground mb-2">
              {isLogin ? 'Welcome Back' : 'Join Nimathi'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isLogin ? 'Sign in to continue your wellness journey' : 'Start your mental wellness journey'}
            </p>
            {isLogin && (
              <p className="text-amber-600 text-xs mt-2">
                First time here? Create an account instead.
              </p>
            )}
          </div>

          {/* Demo Account Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 space-y-2"
          >
            <Button 
              type="button" 
              variant="default" 
              onClick={handleInstantDemo}
              className="w-full"
              disabled={isLoading}
            >
              🚀 Enter Demo Mode
            </Button>
            {!isLogin && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleDemoLogin}
                className="w-full"
                disabled={isLoading}
              >
                Fill Demo Credentials
              </Button>
            )}
            <p className="text-xs text-muted-foreground text-center">
              {isLogin ? 'Skip authentication and try the app instantly' : 'Try the app without creating an account'}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="petName">Pet Name (Username)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="petName"
                    type="text"
                    placeholder="Enter your pet name"
                    value={formData.petName}
                    onChange={(e) => handleInputChange('petName', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-muted-foreground">
                  Must include uppercase, lowercase, special characters, and be 8+ characters
                </p>
              )}
            </div>

            {!isLogin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </motion.div>
            )}

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </motion.div>
          </form>

          <div className="mt-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-primary hover:text-primary/80 underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
            
            {/* Debug Section */}
            <div className="pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={testBackend}
                className="text-xs"
                disabled={isLoading}
              >
                Test Backend Connection
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}