import React from 'react';

export const OFFICIAL_LOGO_SRC = '/vishwamedha_logo.jpg';

export interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'display';
  variant?: 'full' | 'symbol' | 'stacked' | 'horizontal' | 'card';
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  showSubtitle?: boolean;
  animated?: boolean;
}

/**
 * VishwamedhaSymbol
 * Renders the official dual-silhouette neural brain emblem extracted from the uploaded official logo /vishwamedha_logo.jpg.
 * Scaled and centered with optical precision on dark navy backdrop.
 */
export const VishwamedhaSymbol: React.FC<{
  size?: number | string;
  className?: string;
  animated?: boolean;
}> = ({ size = 36, className = '', animated = false }) => {
  const numericSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 36;
  const radius = Math.max(6, Math.round(numericSize * 0.26));

  return (
    <div
      style={{
        width: numericSize,
        height: numericSize,
        borderRadius: `${radius}px`,
      }}
      className={`relative shrink-0 overflow-hidden bg-[#0a0f24] border border-indigo-500/20 shadow-xs flex items-center justify-center transition-all ${
        animated ? 'hover:scale-105 hover:border-indigo-400/40 hover:shadow-indigo-500/20' : ''
      } ${className}`}
      aria-label="Vishwamedha AI Official Emblem"
    >
      <img
        src="/vishwamedha_logo.jpg"
        alt="Vishwamedha AI Symbol"
        className="w-full h-full object-cover pointer-events-none select-none"
        style={{
          objectPosition: 'center 31%',
          transform: 'scale(2.05)',
        }}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};

/**
 * VishwamedhaOfficialGraphic
 * Renders the complete, uncropped uploaded official logo graphic (/vishwamedha_logo.jpg)
 * Sharp, centered, non-stretched, and fully responsive across all device breakpoints.
 */
export const VishwamedhaOfficialGraphic: React.FC<{
  className?: string;
  maxWidth?: number | string;
  animated?: boolean;
  priority?: boolean;
}> = ({ className = '', maxWidth = 420, animated = false }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-[#090e24] border border-indigo-500/30 shadow-2xl transition-all ${
        animated ? 'hover:border-indigo-400/50 hover:shadow-indigo-500/20' : ''
      } ${className}`}
      style={{ maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }}
    >
      {/* Background ambient glow matching the dual-face violet/saffron palette */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-16 bg-indigo-950/40 pointer-events-none" />

      <img
        src="/vishwamedha_logo.jpg"
        alt="Vishwamedha AI — Intelligence Without Boundaries"
        className="relative z-10 w-full h-auto object-contain block select-none"
        loading="eager"
        decoding="async"
      />
    </div>
  );
};

/**
 * VishwamedhaLogo
 * Flexible brand component supporting full graphic, symbol, stacked, and horizontal variants.
 */
export const VishwamedhaLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  theme = 'auto',
  className = '',
  showSubtitle = true,
  animated = false,
}) => {
  // Size mappings
  const sizeConfig = {
    xs: { symbolSize: 26, text: 'text-sm', badge: 'text-[9px] px-1 py-0.2', sub: 'text-[9px]', maxW: 140 },
    sm: { symbolSize: 32, text: 'text-base', badge: 'text-[10px] px-1.5 py-0.5', sub: 'text-[10px]', maxW: 180 },
    md: { symbolSize: 42, text: 'text-lg', badge: 'text-[11px] px-2 py-0.5', sub: 'text-xs', maxW: 240 },
    lg: { symbolSize: 56, text: 'text-2xl', badge: 'text-xs px-2.5 py-0.5', sub: 'text-xs', maxW: 320 },
    xl: { symbolSize: 72, text: 'text-3xl', badge: 'text-sm px-3 py-1', sub: 'text-sm', maxW: 400 },
    '2xl': { symbolSize: 96, text: 'text-4xl', badge: 'text-base px-3.5 py-1', sub: 'text-base', maxW: 480 },
    display: { symbolSize: 128, text: 'text-5xl sm:text-6xl', badge: 'text-lg px-4 py-1.5', sub: 'text-lg', maxW: 560 },
  }[size];

  const textColor = theme === 'dark' 
    ? 'text-white' 
    : theme === 'light' 
    ? 'text-slate-900' 
    : 'text-slate-900 dark:text-white';

  const subColor = theme === 'dark' 
    ? 'text-indigo-300' 
    : theme === 'light' 
    ? 'text-slate-500' 
    : 'text-slate-500 dark:text-indigo-300';

  if (variant === 'symbol') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <VishwamedhaSymbol size={sizeConfig.symbolSize} animated={animated} />
      </div>
    );
  }

  if (variant === 'full' || variant === 'card') {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <VishwamedhaOfficialGraphic maxWidth={sizeConfig.maxW} animated={animated} />
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center gap-3 ${className}`}>
        <VishwamedhaSymbol size={sizeConfig.symbolSize} animated={animated} />
        <div>
          <div className="flex items-center justify-center gap-2">
            <span className={`font-extrabold tracking-tight font-sans ${textColor} ${sizeConfig.text}`}>
              Vishwamedha
            </span>
            <span className={`font-bold uppercase tracking-wider rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-600 text-white shadow-xs ${sizeConfig.badge}`}>
              AI
            </span>
          </div>
          {showSubtitle && (
            <p className={`font-semibold uppercase tracking-widest mt-1 ${subColor} ${sizeConfig.sub}`}>
              Intelligence Without Boundaries
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default horizontal layout
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <VishwamedhaSymbol size={sizeConfig.symbolSize} animated={animated} />

      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className={`font-extrabold tracking-tight leading-none font-sans ${textColor} ${sizeConfig.text}`}>
            Vishwamedha
          </span>
          <span className={`font-bold uppercase tracking-wider rounded-md bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-600 text-white shadow-xs leading-tight ${sizeConfig.badge}`}>
            AI
          </span>
        </div>
        {showSubtitle && (
          <p className={`font-semibold uppercase tracking-wider leading-tight mt-1 truncate ${subColor} ${sizeConfig.sub}`}>
            Intelligence Without Boundaries
          </p>
        )}
      </div>
    </div>
  );
};
