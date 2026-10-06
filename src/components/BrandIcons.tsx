import React from 'react';

// The colorful stacked books logo seen in the brand header and student card
export const StackedBooksLogo: React.FC<{ className?: string; size?: number }> = ({ className = "w-6 h-6", size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Book 1 (Bottom - Blue/Cyan) */}
      <path
        d="M10 32C10 30.3431 11.3431 29 13 29H39C39.5523 29 40 29.4477 40 30V39C40 39.5523 39.5523 40 39 40H13C11.3431 40 10 38.6569 10 37V32Z"
        fill="#06B6D4"
      />
      <path
        d="M14 31H38V38H14C12.8954 38 12 37.1046 12 36V33C12 31.8954 12.8954 31 14 31Z"
        fill="#22D3EE"
      />
      <rect x="15" y="32.5" width="22" height="4" rx="1" fill="#FFFFFF" opacity="0.9" />
      <rect x="9" y="30" width="4" height="9" rx="2" fill="#0891B2" />

      {/* Book 2 (Middle - Coral Red/Pink) */}
      <path
        d="M8 22C8 20.3431 9.34315 19 11 19H37C37.5523 19 38 19.4477 38 20V29C38 29.5523 37.5523 30 37 30H11C9.34315 30 8 28.6569 8 27V22Z"
        fill="#F43F5E"
      />
      <path
        d="M12 21H36V28H12C10.8954 28 10 27.1046 10 26V23C10 21.8954 10.8954 21 12 21Z"
        fill="#FB7185"
      />
      <rect x="13" y="22.5" width="22" height="4" rx="1" fill="#FFFFFF" opacity="0.9" />
      <rect x="7" y="20" width="4" height="9" rx="2" fill="#E11D48" />

      {/* Book 3 (Top - Bright Lime Green) */}
      <path
        d="M6 12C6 10.3431 7.34315 9 9 9H35C35.5523 9 36 9.44772 36 10V19C36 19.5523 35.5523 20 35 20H9C7.34315 20 6 18.6569 6 17V12Z"
        fill="#84CC16"
      />
      <path
        d="M10 11H34V18H10C8.89543 18 8 17.1046 8 16V13C8 11.8954 8.89543 11 10 11Z"
        fill="#A3E635"
      />
      <rect x="11" y="12.5" width="22" height="4" rx="1" fill="#FFFFFF" opacity="0.9" />
      <rect x="5" y="10" width="4" height="9" rx="2" fill="#65A30D" />
    </svg>
  );
};

// Graduation Cap icon for the Orange squircle
export const GraduationCapLarge: React.FC<{ className?: string; size?: number }> = ({ className = "w-14 h-14", size = 56 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Cap Rhombus Top */}
      <path
        d="M32 14L56 24L32 34L8 24L32 14Z"
        fill="#1E1B4B"
      />
      {/* Cap Rim under-shadow */}
      <path
        d="M16 28V40C16 46 23.1634 50 32 50C40.8366 50 48 46 48 40V28L32 35L16 28Z"
        fill="#18181B"
      />
      {/* Tassel Button & String */}
      <circle cx="32" cy="24" r="2.5" fill="#FBBF24" />
      <path
        d="M32 24C38 25 47 30 47 36V44"
        stroke="#FBBF24"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="44.5" y="42" width="5" height="8" rx="1.5" fill="#F59E0B" />
    </svg>
  );
};

// Glowing 3D Gear Icon for the Administrator Card
export const AdminGearIcon: React.FC<{ className?: string; size?: number }> = ({ className = "w-16 h-16", size = 64 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="gearGlow" x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#FFFFFF" floodOpacity="0.3" />
        </filter>
        <linearGradient id="gearGrad" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DDD6FE" />
        </linearGradient>
      </defs>
      <g filter="url(#gearGlow)">
        <path
          d="M27.2 12H36.8L38.4 17.6C39.8 18.2 41.1 19 42.3 20L47.7 18.2L52.5 26.5L47.7 29.8C47.9 30.5 48 31.2 48 32C48 32.8 47.9 33.5 47.7 34.2L52.5 37.5L47.7 45.8L42.3 44C41.1 45 39.8 45.8 38.4 46.4L36.8 52H27.2L25.6 46.4C24.2 45.8 22.9 45 21.7 44L16.3 45.8L11.5 37.5L16.3 34.2C16.1 33.5 16 32.8 16 32C16 31.2 16.1 30.5 16.3 29.8L11.5 26.5L16.3 18.2L21.7 20C22.9 19 24.2 18.2 25.6 17.6L27.2 12Z"
          fill="url(#gearGrad)"
        />
        <circle cx="32" cy="32" r="8" fill="#6D28D9" />
      </g>
    </svg>
  );
};
