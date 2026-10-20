import React, { useId } from 'react';

export interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  subtitle?: boolean | string;
  variant?: 'light' | 'dark' | 'glass';
  className?: string;
  badge?: string;
  styleVariant?: 'prism' | 'aurora' | 'minimal';
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  subtitle,
  variant = 'light',
  className = '',
  badge = '',
}) => {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9]/g, '_');

  const sizeClasses = {
    xs: {
      img: 'w-6 h-6 rounded-lg',
      title: 'text-sm font-black tracking-tight',
      subtitle: 'text-[8px]',
      badge: 'text-[8px] px-1 py-0.2',
    },
    sm: {
      img: 'w-8 h-8 rounded-xl',
      title: 'text-base font-black tracking-tight',
      subtitle: 'text-[9px]',
      badge: 'text-[9px] px-1.5 py-0.5',
    },
    md: {
      img: 'w-10 h-10 rounded-xl',
      title: 'text-xl font-black tracking-tight',
      subtitle: 'text-[10px]',
      badge: 'text-[10px] px-2 py-0.5',
    },
    lg: {
      img: 'w-12 h-12 rounded-2xl',
      title: 'text-2xl font-black tracking-tight',
      subtitle: 'text-xs',
      badge: 'text-xs px-2.5 py-0.5',
    },
    xl: {
      img: 'w-16 h-16 rounded-2xl shadow-md',
      title: 'text-3xl font-black tracking-tight',
      subtitle: 'text-xs',
      badge: 'text-xs px-3 py-1',
    },
    '2xl': {
      img: 'w-20 h-20 rounded-3xl shadow-lg',
      title: 'text-4xl font-black tracking-tight',
      subtitle: 'text-sm',
      badge: 'text-sm px-3.5 py-1',
    },
  }[size];

  const isDark = variant === 'dark';

  // Reusable single interlocking 3D aerodynamic wing path (rotated 0°, 120°, 240° around 50,50)
  const mainWingPath =
    'M 50 34.5 L 25.5 33.2 C 20.5 32.9 18.8 27.2 22.8 23.8 L 43.5 13.2 C 47.6 11.1 52.4 11.1 56.5 13.2 L 73.2 21.8 C 77.4 24.0 78.2 29.2 75.0 33.6 L 61.5 52.2 C 59.8 54.5 56.5 53.2 56.8 50.2 L 58.0 40.5 C 58.3 37.2 55.2 34.8 50 34.5 Z';

  // Inner 3D bevel fold facet for depth on each wing
  const foldFacetPath =
    'M 50 34.5 L 25.5 33.2 C 22.2 33.0 20.8 29.8 22.5 27.2 L 54.5 30.2 C 57.5 30.5 59.2 33.2 58.0 40.5 L 56.8 50.2 C 56.5 53.2 59.8 54.5 61.5 52.2 L 54.0 42.0 C 52.5 39.8 51.2 36.2 50 34.5 Z';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Emblem: Tri-Axis Isometric Vortex & Optical Core (Zero letters, bags, stars, or circuits) */}
      <div
        className={`relative shrink-0 overflow-hidden ${sizeClasses.img} transition-transform duration-300 group-hover:scale-105 shadow-xs`}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-label="NovaShop Brand Emblem"
        >
          <defs>
            {/* Deep Slate-Obsidian Canvas */}
            <linearGradient id={`nsCanvas_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="55%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0B1120" />
            </linearGradient>

            {/* Wing 1: Top — Electric Cobalt to Sky Cyan */}
            <linearGradient id={`nsWingBlue_${id}`} x1="18%" y1="35%" x2="78%" y2="20%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id={`nsFoldBlue_${id}`} x1="20%" y1="25%" x2="65%" y2="50%">
              <stop offset="0%" stopColor="#0369A1" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>

            {/* Wing 2: Bottom-Right — Warm Amber Gold to Sunset Coral */}
            <linearGradient id={`nsWingAmber_${id}`} x1="18%" y1="35%" x2="78%" y2="20%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id={`nsFoldAmber_${id}`} x1="20%" y1="25%" x2="65%" y2="50%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#9A3412" />
            </linearGradient>

            {/* Wing 3: Bottom-Left — Emerald Teal to Royal Indigo */}
            <linearGradient id={`nsWingTeal_${id}`} x1="18%" y1="35%" x2="78%" y2="20%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id={`nsFoldTeal_${id}`} x1="20%" y1="25%" x2="65%" y2="50%">
              <stop offset="0%" stopColor="#0F766E" />
              <stop offset="100%" stopColor="#312E81" />
            </linearGradient>

            {/* Central Optical Sphere Core */}
            <radialGradient id={`nsCenterCore_${id}`} cx="38%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </radialGradient>
          </defs>

          {/* Rounded Squircle Base */}
          <rect x="0" y="0" width="100" height="100" rx="23" fill={`url(#nsCanvas_${id})`} />
          <rect
            x="1.5"
            y="1.5"
            width="97"
            height="97"
            rx="21.5"
            stroke="#FFFFFF"
            strokeOpacity="0.12"
            strokeWidth="1.5"
          />

          {/* Wing 1 (0 deg — Top Sky/Cobalt) */}
          <g>
            <path d={mainWingPath} fill={`url(#nsWingBlue_${id})`} />
            <path d={foldFacetPath} fill={`url(#nsFoldBlue_${id})`} opacity="0.75" />
          </g>

          {/* Wing 2 (120 deg — Bottom-Right Amber/Coral) */}
          <g transform="rotate(120 50 50)">
            <path d={mainWingPath} fill={`url(#nsWingAmber_${id})`} />
            <path d={foldFacetPath} fill={`url(#nsFoldAmber_${id})`} opacity="0.75" />
          </g>

          {/* Wing 3 (240 deg — Bottom-Left Emerald/Indigo) */}
          <g transform="rotate(240 50 50)">
            <path d={mainWingPath} fill={`url(#nsWingTeal_${id})`} />
            <path d={foldFacetPath} fill={`url(#nsFoldTeal_${id})`} opacity="0.75" />
          </g>

          {/* Central Floating Optical Lens Core */}
          <circle cx="50" cy="50" r="8.2" fill={`url(#nsCenterCore_${id})`} />
          <circle cx="47.8" cy="47.8" r="2.4" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Clean Architectural Wordmark */}
      {showText && (
        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-center leading-none">
            <span
              className={`${sizeClasses.title} ${
                isDark ? 'text-white' : 'text-slate-900 dark:text-white'
              }`}
            >
              Nova
            </span>
            <span
              className={`${sizeClasses.title} bg-gradient-to-r from-sky-500 via-blue-600 to-amber-500 dark:from-sky-400 dark:via-blue-400 dark:to-amber-400 bg-clip-text text-transparent`}
            >
              Shop
            </span>

            {badge ? (
              <span
                className={`font-bold uppercase tracking-wider rounded border ml-1.5 ${sizeClasses.badge} ${
                  isDark
                    ? 'bg-amber-500/15 text-amber-300 border-amber-400/30'
                    : 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30'
                }`}
              >
                {badge}
              </span>
            ) : null}
          </div>

          {subtitle && (
            <span
              className={`font-semibold tracking-wider uppercase mt-0.5 ${sizeClasses.subtitle} ${
                isDark ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {typeof subtitle === 'string' ? subtitle : 'Flagship Tech Ecosystem'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
