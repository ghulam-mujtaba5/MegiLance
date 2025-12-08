'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/Button/Button';
import Card from '@/app/components/Card/Card';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Shield, User, Briefcase, X, ChevronRight } from 'lucide-react';

export default function QuickLogin() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // Show in all environments for demo purposes
  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!isVisible) return null;

  const handleLogin = async (role: 'admin' | 'client' | 'freelancer') => {
    setLoading(role);
    try {
      let email = '';
      let password = '';

      // Updated to match actual demo users in local_dev.db
      switch (role) {
        case 'admin':
          email = 'admin@megilance.com';
          password = 'Password123';
          break;
        case 'client':
          email = 'client@demo.com';
          password = 'Password123';
          break;
        case 'freelancer':
          email = 'freelancer@demo.com';
          password = 'Password123';
          break;
      }

      await authApi.login(email, password);
      
      // Redirect based on role
      switch (role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'client':
          router.push('/client/dashboard');
          break;
        case 'freelancer':
          router.push('/freelancer/dashboard');
          break;
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Quick login failed:', error);
      alert('Login failed. Make sure the user exists (check README for seed data).');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-end gap-2">
      {isOpen && (
        <Card 
          title="Dev Quick Login"
          className="w-64 shadow-2xl border-primary/20 bg-background/95 backdrop-blur animate-in slide-in-from-right-10 relative"
          variant="glass"
        >
          <div className="absolute top-2 right-2 z-10">
             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2 mt-2">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => handleLogin('admin')}
              isLoading={loading === 'admin'}
              iconBefore={<Shield className="h-4 w-4 text-red-500" />}
            >
              Admin
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              onClick={() => handleLogin('client')}
              isLoading={loading === 'client'}
              iconBefore={<User className="h-4 w-4 text-blue-500" />}
            >
              Client
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20"
              onClick={() => handleLogin('freelancer')}
              isLoading={loading === 'freelancer'}
              iconBefore={<Briefcase className="h-4 w-4 text-green-500" />}
            >
              Freelancer
            </Button>
          </div>
          <div className="mt-3 text-xs text-muted-foreground text-center">
            Password for all: Password123
          </div>
        </Card>
      )}
      
      <Button 
        className={cn(
          "rounded-full shadow-lg transition-all",
          isOpen ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
        )}
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronRight /> : <Shield className="h-5 w-5" />}
      </Button>
    </div>
  );
}
