import React from 'react';

export default function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };

  const paths = {
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <path d="M12 14v3" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.8" />
      </>
    ),
    eyeoff: (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a17.4 17.4 0 0 1-3.2 3.6" />
        <path d="M6.2 6.2C3.5 8.1 2 12 2 12s3.5 6 10 6c1.2 0 2.3-.2 3.3-.6" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    ruler: (
      <>
        <path d="m4 20 16-16" />
        <path d="M5 15 9 19" />
        <path d="M9 11l4 4" />
        <path d="M13 7l4 4" />
        <path d="M17 3l4 4" />
      </>
    ),
    bed: (
      <>
        <path d="M3 18v-8h18v8" />
        <path d="M3 14h18" />
        <path d="M6 10V7h5v3" />
        <path d="M3 18v2M21 18v2" />
      </>
    ),
    bath: (
      <>
        <path d="M4 12h16" />
        <path d="M5 12v3a5 5 0 0 0 5 5h4a5 5 0 0 0 5-5v-3" />
        <path d="M6 12V6a2 2 0 0 1 4 0v1" />
      </>
    ),
    building: (
      <>
        <path d="M5 21V4h9v17" />
        <path d="M14 9h5v12" />
        <path d="M8 8h2M8 12h2M8 16h2M16 13h1M16 17h1" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    car: (
      <>
        <path d="m5 16 1.5-6h11L19 16" />
        <path d="M4 16h16v3H4z" />
        <circle cx="7" cy="19" r="1" />
        <circle cx="17" cy="19" r="1" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 20 6v5c0 5-3.3 8.6-8 10-4.7-1.4-8-5-8-10V6l8-3Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5M4 19h16" />
        <path d="m7 15 3-4 3 2 5-6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <path d="m14 10 4-4" />
        <path d="m18 6-2 .5.5 2" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
    arrowLeft: (
      <>
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </>
    ),
    chevronRight: <polyline points="9 18 15 12 9 6" />,
    chevronDown: <polyline points="6 9 12 15 18 9" />,
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
    user: (
      <>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </>
    ),
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    sliders: (
      <>
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </>
    ),
    refresh: (
      <>
        <path d="M21.5 2v6h-6" />
        <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
      </>
    ),
    whatsapp: (
      <>
        <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
        <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
      </>
    ),
    instagram: (
      <>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </>
    ),
    facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
    twitter: <path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768M20 4l-6.768 6.768" />,
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </>
    ),
    check: <polyline points="20 6 9 17 4 12" />,
  };

  return <svg {...common}>{paths[name] || null}</svg>;
}
