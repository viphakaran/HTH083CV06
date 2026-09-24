import React from 'react';
import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import { Activity, BookOpen, ExternalLink } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'text-[#1F3864] bg-slate-100 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              Overview
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[#1F3864] bg-slate-100 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Activity className="w-3.5 h-3.5 text-[#1F3864]" aria-hidden="true" />
              Live Dashboard
            </NavLink>
            <NavLink
              to="/vocabulary"
              className={({ isActive }) =>
                `px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[#1F3864] bg-slate-100 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              Vocabulary (20)
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Standalone Demo Mode
          </span>
          <NavLink
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1F3864] hover:bg-[#162846] rounded-md shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1F3864]"
          >
            Launch Demo
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </NavLink>
        </div>
      </div>
    </header>
  );
};
