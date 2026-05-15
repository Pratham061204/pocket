"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/actions/auth";

interface NavbarProps {
  userName: string;
  avatarUrl?: string | null;
}

export function Navbar({ userName, avatarUrl }: NavbarProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
          <div className="w-7 h-7 rounded-lg bg-black text-white text-xs font-bold flex items-center justify-center">
            P
          </div>
          Pocket
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-8 w-8 rounded-full p-0 outline-none">
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
              <AvatarFallback className="text-xs bg-gray-100">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="text-xs text-gray-500 cursor-default">
              {userName}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-red-600 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
