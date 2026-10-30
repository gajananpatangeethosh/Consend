import React from "react";

interface ConsendLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export function ConsendIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {/* Outer ambient atmospheric glow */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-cyan-500/40 via-emerald-500/30 to-cyan-400/20 blur-md opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Main emblem container */}
      <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-b from-[#091528] via-[#050D1C] to-[#020612] p-2 border border-cyan-500/30 shadow-[0_4px_20px_-2px_rgba(6,182,212,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] group-hover:border-cyan-400/50 transition-colors">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full drop-shadow-[0_2px_8px_rgba(6,182,212,0.5)]"
        >
          <defs>
            {/* Primary Cyan-to-Emerald Wing Gradient */}
            <linearGradient id="consend-wing" x1="6" y1="6" x2="34" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            {/* Inner Shield / Lock Loop Gradient */}
            <linearGradient id="consend-shield" x1="10" y1="18" x2="30" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Specular Edge Highlight */}
            <linearGradient id="consend-edge" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#34D399" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Interlocking Futuristic Emblem:
              Upper Path: Aerodynamic Forward 'Send' Chevron & Document Wing */}
          <path
            d="M20 5L33 13.5V23.5C33 29.5 27.5 34.5 20 37C12.5 34.5 7 29.5 7 23.5V13.5L20 5Z"
            stroke="url(#consend-edge)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="opacity-40"
          />

          {/* Forward Transmission Wing (Send) */}
          <path
            d="M20 8L30 15L20 22L10 15L20 8Z"
            fill="url(#consend-wing)"
            fillOpacity="0.9"
          />

          {/* Interlocking Secure Consent Clasp (Consent Anchor) */}
          <path
            d="M14 18L20 22.5L26 18V24.5C26 28.5 23.5 31.5 20 33C16.5 31.5 14 28.5 14 24.5V18Z"
            fill="url(#consend-shield)"
          />

          {/* Central Cryptographic Pulse Node */}
          <circle cx="20" cy="20" r="2.5" fill="#FFFFFF" className="animate-pulse" />
          <circle cx="20" cy="20" r="4.5" stroke="#67E8F9" strokeWidth="1" strokeOpacity="0.6" />
        </svg>
      </div>
    </div>
  );
}

export function ConsendLogo({
  size = "md",
  showText = true,
  className = "",
}: ConsendLogoProps) {
  const iconSizes = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
    xl: "h-14 w-14",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-[16px]",
    lg: "text-xl",
    xl: "text-2xl",
  };

  const subSizes = {
    sm: "text-[8px]",
    md: "text-[9px]",
    lg: "text-[10px]",
    xl: "text-[11px]",
  };

  return (
    <div className={`flex items-center gap-3 group select-none ${className}`}>
      <ConsendIcon className={iconSizes[size]} />
      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-extrabold tracking-tight text-white flex items-center ${textSizes[size]}`}>
            <span>Con</span>
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              send
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 ml-1 shadow-[0_0_8px_#22D3EE]" />
          </div>
          <div className={`font-mono uppercase tracking-[0.22em] text-emerald-400/80 mt-1 font-semibold ${subSizes[size]}`}>
            MST Blockchain
          </div>
        </div>
      )}
    </div>
  );
}

