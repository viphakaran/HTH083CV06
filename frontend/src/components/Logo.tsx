import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  isLight?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', isLight = false }) => {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2.5 font-semibold text-lg tracking-tight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1F3864] rounded-md transition-opacity hover:opacity-90 ${className}`}
      aria-label="LowKeySigns Home"
    >
      {/* Minimal abstract geometric mark: soundwave/signal bars (NO hand/robot icons) */}
      <span
        className={`w-7 h-7 rounded-md flex items-center justify-center gap-[2.5px] p-1 shadow-xs ${
          isLight ? 'bg-white' : 'bg-[#1F3864]'
        }`}
        aria-hidden="true"
      >
        <span
          className={`w-[2.5px] h-2.5 rounded-full ${
            isLight ? 'bg-[#1F3864]/70' : 'bg-white/70'
          }`}
        />
        <span
          className={`w-[2.5px] h-4.5 rounded-full ${
            isLight ? 'bg-[#1F3864]' : 'bg-white'
          }`}
        />
        <span
          className={`w-[2.5px] h-3.5 rounded-full ${
            isLight ? 'bg-[#1F3864]' : 'bg-white'
          }`}
        />
        <span
          className={`w-[2.5px] h-1.5 rounded-full ${
            isLight ? 'bg-[#1F3864]/70' : 'bg-white/70'
          }`}
        />
      </span>
      <span className={isLight ? 'text-white' : 'text-[#1F3864]'}>
        LowKey<span className={isLight ? 'text-slate-300' : 'text-slate-700'}>Signs</span>
      </span>
    </Link>
  );
};
