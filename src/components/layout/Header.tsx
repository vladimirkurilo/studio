"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, LogIn, LogOut, UserPlus, KeyRound, UserCircle, LayoutDashboard } from 'lucide-react';
import { useAuthStore, useHydratedAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export default function Header() {
  const { user, logout } = useHydratedAuthStore(state => ({ user: state.user, logout: state.logout }));
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const userNameInitial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold flex items-center gap-2">
          <KeyRound size={28} />
          Hotel Access Hub
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/" passHref>
            <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
              <Home className="mr-2 h-4 w-4" /> Booking
            </Button>
          </Link>
          {user ? (
            <>
              {user.role === 'guest' && (
                <Link href={`/my-booking`} passHref>
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                    My Booking
                  </Button>
                </Link>
              )}
              {user.role === 'admin' && (
                <Link href="/admin" passHref>
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Dashboard
                  </Button>
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full text-primary-foreground hover:bg-primary/80">
                    <Avatar className="h-9 w-9">
                       {/* Placeholder for user avatar image if available */}
                       {/* <AvatarImage src="https://placehold.co/100x100.png" alt={user.name} /> */}
                      <AvatarFallback className="bg-accent text-accent-foreground">{userNameInitial}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login" passHref>
              <Button variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <LogIn className="mr-2 h-4 w-4" /> Login / Register
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
