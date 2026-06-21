'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd handle password change logic here.
    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
    });
    router.push('/dashboard');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="mb-4">
            <Button asChild variant="ghost">
                <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
                </Link>
            </Button>
        </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-headline">
            <KeyRound className="w-8 h-8 text-primary" />
            Settings
          </CardTitle>
          <CardDescription>
            Manage your account settings and change your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveChanges} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input id="current-password" type={showCurrentPassword ? 'text' : 'password'} required />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
               <div className="relative">
                <Input id="new-password" type={showNewPassword ? 'text' : 'password'} required />
                 <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
               <div className="relative">
                <Input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} required />
                 <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
