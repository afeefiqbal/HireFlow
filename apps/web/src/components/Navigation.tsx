'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/matches', label: 'Matches', icon: Sparkles },
  { href: '/application-queue', label: 'Queue', icon: KanbanSquare },
  { href: '/interviews', label: 'Interviews', icon: Video },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/applications', label: 'Tracking', icon: Layers },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const Navigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Positioning */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-[#00b074] shadow-sm">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  HIRE<span className="text-[#00b074]">flow</span>
                </span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#009a65]">
                  AI Cockpit
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Candidate-First Autonomous Engine</p>
            </div>
          </Link>

          {/* Candidate Badge */}
          <div className="hidden xl:flex items-center gap-2 border-l border-slate-200 pl-5 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-[#00b074]" />
            <span>Ground Truth:</span>
            <span className="font-semibold text-slate-800">Afeef Iqbal (7+ Yrs Full-Stack)</span>
          </div>
        </div>

        {/* Main Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-[#009a65] border border-emerald-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#00b074]' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Status Indicator & Quick CTA */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#009a65]">
            <span className="h-2 w-2 rounded-full bg-[#00b074] animate-pulse" />
            <span>24h Engine Active</span>
          </div>
          <Link
            href="/jobs"
            className="flex items-center gap-1.5 rounded-lg bg-[#00b074] hover:bg-[#009a65] text-white px-3.5 py-1.5 text-xs font-bold transition shadow-sm"
          >
            <span>Browse Jobs</span>
          </Link>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-100 px-2 py-2 bg-white gap-1 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap rounded-md ${
                isActive ? 'text-[#009a65] bg-emerald-50 font-semibold' : 'text-slate-600'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
};
