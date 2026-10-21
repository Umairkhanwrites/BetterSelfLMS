'use client';

import React from 'react';

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
  showText?: boolean;
  textClassName?: string;
  variant?: 'light' | 'dark';
}

export function BrandMark({ className = 'w-9 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BetterSelf Brand Mark"
    >
      {/* Upper Organic Blue Pebble (#3B97D3) */}
      <path
        d="M48 6C68 6 92 18 94 36C96 52 82 59 66 59C52 59 40 54 30 51C20 48 14 38 18 24C22 10 32 6 48 6Z"
        fill="#3B97D3"
      />
      {/* Lower-left Green Leaf Pebble (#7CC157) */}
      <path
        d="M32 46C46 46 62 53 60 67C58 80 42 80 32 78C22 76 16 71 16 62C16 53 18 46 32 46Z"
        fill="#7CC157"
      />
    </svg>
  );
}

export default function BrandLogo({
  className = 'flex items-center gap-2.5',
  markClassName = 'w-9 h-8',
  showText = true,
  textClassName,
  variant = 'light'
}: BrandLogoProps) {
  const isDark = variant === 'dark';

  return (
    <div className={className}>
      <BrandMark className={markClassName} />
      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-extrabold tracking-tight text-xl leading-none ${
              textClassName || (isDark ? 'text-white' : 'text-slate-900')
            }`}
          >
            Better<span className="text-[#3B97D3]">Self</span>
          </span>
          <span
            className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            LMS Ecosystem
          </span>
        </div>
      )}
    </div>
  );
}
