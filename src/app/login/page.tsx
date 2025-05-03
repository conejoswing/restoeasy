
'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/AuthContext';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, isAuthenticated } = useAuth(); // Get login function and state
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    // Redirection is now handled by AuthGuard based on isAuthenticated state change
    // if (success) {
    //   router.push('/tables'); // No longer needed here
    // }
  };

   // AuthGuard handles redirection, so no need for loading/auth checks here
   // if (isLoading) {
   //   return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
   // }
   // if (!isLoading && isAuthenticated) {
   //   // Already handled by AuthGuard, return null or let AuthGuard handle redirect
   //   return null;
   // }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle> {/* Login */}
          <CardDescription className="text-center">
            Ingrese sus credenciales para acceder.
          </CardDescription> {/* Enter your credentials */}
        </CardHeader>
         <form onSubmit={handleLogin}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Usuario</Label> {/* Username */}
                <Input
                  id="username"
                  type="text"
                  // placeholder="admin" // Removed placeholder
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label> {/* Password */}
                <Input
                  id="password"
                  type="password"
                  // placeholder="admin" // Removed placeholder
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                   autoComplete="current-password"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}> {/* Disable button while logging in */}
                <LogIn className="mr-2 h-4 w-4" /> {isLoading ? 'Accediendo...' : 'Acceder'} {/* Access */}
              </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
