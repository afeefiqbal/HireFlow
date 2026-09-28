'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Briefcase,
  Sparkles,
  KanbanSquare,
  FileText,
  User,
  Settings,
  ShieldCheck,
  Zap,
  Layers,
  BarChart3,
  Video,
  ChevronDown,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';

const PRIMARY_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/matches', label: 'Matches', icon: Sparkles },
  { href: '/application-queue', label: 'Queue', icon: KanbanSquare },
  { href: '/interviews', label: 'Interviews', icon: Video },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const MORE_NAV = [
  { href: '/jobs', label: 'Job Directory', icon: Briefcase },
  { href: '/applications', label: 'Application Tracking', icon: Layers },
  { href: '/resume', label: 'Tailored Resume', icon: FileText },
  { href: '/profile', label: 'Candidate Profile', icon: User },
  { href: '/settings', label: 'System Settings', icon: Settings },
];

const ALL_NAV_ITEMS = [...PRIMARY_NAV, ...MORE_NAV];

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMoreActive = MORE_NAV.some((item) => pathname.startsWith(item.href));

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Brand & Positioning */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-[#00b074] shadow-2xs shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                  HIRE<span className="text-[#00b074]">flow</span>
                </span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#009a65] whitespace-nowrap">
                  AI Cockpit
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium whitespace-nowrap">Autonomous Career Engine</p>
            </div>
          </Link>
        </div>

        {/* Main Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 shrink-0">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-[#009a65] border border-emerald-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#00b074]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* More Dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isMoreActive || moreOpen
                  ? 'bg-emerald-50 text-[#009a65] border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <span>More</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-50 animate-fadeIn">
                {MORE_NAV.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-emerald-50 text-[#009a65] font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-[#00b074]' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right Section: Candidate Auth Badge / Action */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full sm:rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50 transition-all text-left"
              >
                <img
                  src={
                    user.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`
                  }
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-emerald-200 bg-emerald-50 shrink-0"
                />
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
                    Candidate
                  </div>
                </div>
                <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Connected via {user.provider === 'google' ? 'Google' : 'Email'}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                      <span>Command Dashboard</span>
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Master Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#00b074] hover:bg-[#009a65] rounded-lg shadow-xs hover:shadow-sm transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav bar with horizontal scrolling */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-100 px-2 py-2 bg-white gap-1 scrollbar-none">
        {ALL_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap rounded-md shrink-0 ${
                isActive ? 'text-[#009a65] bg-emerald-50 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};
