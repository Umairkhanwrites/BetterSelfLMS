'use client';

import React from 'react';

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
  showText?: boolean;
  textClassName?: string;
  variant?: 'light' | 'dark';
}

export function BrandMark({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <img
      src="/brand-monogram.png"
      alt="BetterSelf Brand Mark"
      className={`object-contain inline-block shrink-0 ${className}`}
      loading="eager"
    />
  );
}

export default function BrandLogo({
  className = 'flex items-center gap-2.5',
  markClassName = 'w-9 h-9',
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
