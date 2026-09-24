import React from 'react';
import { Logo } from './Logo';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo />
            <p className="text-xs text-slate-500 max-w-sm text-center md:text-left">
              Real-time sign language interpretation designed for civic counters, healthcare, and public intake desks.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-md border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-[#1F3864]" aria-hidden="true" />
            <span>Built on open, research-grade sign language datasets (WLASL benchmark).</span>
          </div>

          <div className="text-xs text-slate-400 text-center md:text-right">
            &copy; {new Date().getFullYear()} LowKeySigns. Accessibility Tech & Public Services Hackathon.
          </div>
        </div>
      </div>
    </footer>
  );
};
