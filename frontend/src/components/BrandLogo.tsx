import type { SVGProps } from 'react';

interface BrandLogoProps extends SVGProps<SVGSVGElement> {
  brandId: string;
}

/**
 * Crisp, proportional inline vector brand marks tuned for both
 * Light Mode white cards and Dark Mode charcoal cards.
 */
export function BrandLogo({ brandId, className = '', ...props }: BrandLogoProps) {
  const shared = {
    viewBox: '0 0 120 64',
    preserveAspectRatio: 'xMidYMid meet',
    fill: 'none',
    'aria-hidden': true as const,
    className: `w-auto h-8 sm:h-9 max-w-[96px] select-none ${className}`,
    ...props,
  };

  switch (brandId) {
    case 'maruti-suzuki':
      return (
        <svg {...shared}>
          <path
            d="M60 8L82 22L68 31L77 37L60 56L38 42L52 33L43 27L60 8Z"
            fill="#DC2626"
          />
          <path
            d="M60 15L73 23.5L60 31.5L47 23.5L60 15Z"
            className="fill-blue-700 dark:fill-blue-400"
          />
          <path
            d="M60 32.5L73 40.5L60 49L47 40.5L60 32.5Z"
            fill="#DC2626"
          />
        </svg>
      );

    case 'tata':
      return (
        <svg {...shared}>
          <ellipse cx="60" cy="32" rx="34" ry="21" className="stroke-blue-700 dark:stroke-blue-400" strokeWidth="3.8" />
          <path
            d="M35 28C43 21.5 53 20 60 20C67 20 77 21.5 85 28"
            className="stroke-blue-700 dark:stroke-blue-400"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="M60 21V48" className="stroke-blue-700 dark:stroke-blue-400" strokeWidth="4.4" strokeLinecap="round" />
        </svg>
      );

    case 'kia':
      return (
        <svg {...shared}>
          <path
            d="M17 44V20H24V30.5L36.5 20H45.5L31.5 31.8L45.5 44H36.5L24 33V44H17ZM56.5 44V20H63.5V44H56.5ZM72 44L84.5 20H92L103 44H95.5L93 38H81.5L79 44H72ZM83.8 32.2H90.8L87.3 24.4L83.8 32.2Z"
            className="fill-slate-900 dark:fill-zinc-100"
          />
        </svg>
      );

    case 'toyota':
      return (
        <svg {...shared}>
          <ellipse cx="60" cy="32" rx="33" ry="21" stroke="#DC2626" strokeWidth="3.5" />
          <ellipse cx="60" cy="32" rx="10.5" ry="20.5" stroke="#DC2626" strokeWidth="3.3" />
          <ellipse cx="60" cy="23.5" rx="22.5" ry="8.5" stroke="#DC2626" strokeWidth="3.3" />
        </svg>
      );

    case 'hyundai':
      return (
        <svg {...shared}>
          <ellipse cx="60" cy="32" rx="35" ry="20" className="stroke-slate-800 dark:stroke-zinc-200" strokeWidth="3.6" />
          <path
            d="M44 43L51 21H57.5L53.5 32.5C57.5 30 62.5 29.8 66.5 31.8L70 21H76.5L69.5 43H63L66 34.5C61.5 32.8 56.8 33.2 53 35.8L50.5 43H44Z"
            className="fill-slate-800 dark:fill-zinc-200"
          />
        </svg>
      );

    case 'mahindra':
      return (
        <svg {...shared}>
          <path
            d="M23 44L34 20L52 33L60 25L68 33L86 20L97 44L89 44L82 29.5L68 40L60 32.5L52 40L38 29.5L31 44H23Z"
            className="fill-slate-900 dark:fill-zinc-100"
          />
          <path d="M53.5 44L60 36L66.5 44H53.5Z" fill="#DC2626" />
        </svg>
      );

    case 'honda':
      return (
        <svg {...shared}>
          <rect x="33" y="11" width="54" height="42" rx="9" className="stroke-slate-800 dark:stroke-zinc-200" strokeWidth="3.4" />
          <path
            d="M44 18H50.5L52 31.5H68L69.5 18H76L73 46H67L66.5 36.5H53.5L53 46H47L44 18Z"
            fill="#DC2626"
          />
        </svg>
      );

    case 'volkswagen':
      return (
        <svg {...shared}>
          <circle cx="60" cy="32" r="23" className="stroke-slate-800 dark:stroke-zinc-200" strokeWidth="3.4" />
          <path
            d="M46.5 16L60 37L73.5 16M41 24L52.5 46L60 33L67.5 46L79 24"
            className="stroke-slate-800 dark:stroke-zinc-200"
            strokeWidth="3.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'skoda':
      return (
        <svg {...shared}>
          <circle cx="60" cy="32" r="22.5" stroke="#16A34A" strokeWidth="3.2" />
          <path
            d="M43 37C46 27 55 21 67 21C63.5 24 62.5 27 65 29.5C68 27.5 72.5 26 78 26.5C74 30 72 34 73.5 38C64.5 34.5 53 34.5 43 37Z"
            fill="#16A34A"
          />
          <circle cx="63" cy="27.5" r="2" className="fill-white dark:fill-[#121215]" />
        </svg>
      );

    case 'renault':
      return (
        <svg {...shared}>
          <path
            d="M60 8L82 32L60 56L38 32L60 8Z"
            className="stroke-slate-800 dark:stroke-zinc-200"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M60 17L73 32L60 47L47 32L60 17Z"
            className="stroke-slate-800 dark:stroke-zinc-200"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <path d="M51 32L60 22L69 32L60 42L51 32Z" fill="#EAB308" />
        </svg>
      );

    case 'nissan':
      return (
        <svg {...shared}>
          <path
            d="M41 22A22 22 0 0 1 79 22M79 42A22 22 0 0 1 41 42"
            className="stroke-slate-800 dark:stroke-zinc-200"
            strokeWidth="3.3"
            strokeLinecap="round"
          />
          <line x1="25" y1="26" x2="95" y2="26" className="stroke-slate-800 dark:stroke-zinc-200" strokeWidth="2.2" />
          <line x1="25" y1="38" x2="95" y2="38" className="stroke-slate-800 dark:stroke-zinc-200" strokeWidth="2.2" />
          <text
            x="60"
            y="35"
            textAnchor="middle"
            className="fill-slate-900 dark:fill-zinc-100"
            fontSize="10.5"
            fontWeight="800"
            letterSpacing="2.4"
            fontFamily="sans-serif"
          >
            NISSAN
          </text>
        </svg>
      );

    case 'mg':
      return (
        <svg {...shared}>
          <polygon
            points="48,10 72,10 86,24 86,40 72,54 48,54 34,40 34,24"
            stroke="#DC2626"
            strokeWidth="3.4"
            className="fill-white dark:fill-zinc-900"
          />
          <text
            x="60"
            y="37.5"
            textAnchor="middle"
            className="fill-slate-900 dark:fill-zinc-100"
            fontSize="17"
            fontWeight="800"
            letterSpacing="1"
            fontFamily="sans-serif"
          >
            MG
          </text>
        </svg>
      );

    case 'bmw':
      return (
        <svg {...shared}>
          <circle cx="60" cy="32" r="23" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
          <circle cx="60" cy="32" r="16.5" fill="#F8FAFC" />
          <path d="M60 15.5A16.5 16.5 0 0 0 43.5 32H60V15.5Z" fill="#2563EB" />
          <path d="M60 48.5A16.5 16.5 0 0 0 76.5 32H60V48.5Z" fill="#2563EB" />
          <circle cx="60" cy="32" r="16.5" stroke="#0F172A" strokeWidth="1.4" />
        </svg>
      );

    case 'mercedes-benz':
      return (
        <svg {...shared}>
          <circle cx="60" cy="32" r="23" className="stroke-slate-800 dark:stroke-zinc-200" strokeWidth="3.1" />
          <path
            d="M60 11L63.4 29.8L78.2 42.5L60 35.6L41.8 42.5L56.6 29.8L60 11Z"
            className="fill-slate-800 dark:fill-zinc-200"
          />
        </svg>
      );

    case 'audi':
      return (
        <svg {...shared}>
          <circle cx="33" cy="32" r="12" className="stroke-slate-900 dark:stroke-zinc-100" strokeWidth="2.9" />
          <circle cx="51" cy="32" r="12" className="stroke-slate-900 dark:stroke-zinc-100" strokeWidth="2.9" />
          <circle cx="69" cy="32" r="12" className="stroke-slate-900 dark:stroke-zinc-100" strokeWidth="2.9" />
          <circle cx="87" cy="32" r="12" className="stroke-slate-900 dark:stroke-zinc-100" strokeWidth="2.9" />
        </svg>
      );

    case 'jeep':
      return (
        <svg {...shared}>
          <g className="fill-slate-800 dark:fill-zinc-200">
            <rect x="33" y="13" width="4.5" height="10" rx="2" />
            <rect x="41" y="13" width="4.5" height="10" rx="2" />
            <rect x="49" y="13" width="4.5" height="10" rx="2" />
            <rect x="57.75" y="13" width="4.5" height="10" rx="2" />
            <rect x="66.5" y="13" width="4.5" height="10" rx="2" />
            <rect x="74.5" y="13" width="4.5" height="10" rx="2" />
            <rect x="82.5" y="13" width="4.5" height="10" rx="2" />
          </g>
          <text
            x="60"
            y="47"
            textAnchor="middle"
            className="fill-slate-900 dark:fill-zinc-100"
            fontSize="20"
            fontWeight="800"
            letterSpacing="1.5"
            fontFamily="sans-serif"
          >
            Jeep
          </text>
        </svg>
      );

    case 'porsche':
      return (
        <svg {...shared}>
          <text
            x="60"
            y="38"
            textAnchor="middle"
            className="fill-slate-900 dark:fill-zinc-100 font-display"
            fontSize="14"
            fontWeight="900"
            letterSpacing="3.5"
            fontFamily="sans-serif"
          >
            PORSCHE
          </text>
        </svg>
      );

    case 'range-rover':
      return (
        <svg {...shared}>
          <text
            x="60"
            y="32"
            textAnchor="middle"
            className="fill-slate-900 dark:fill-zinc-100 font-display"
            fontSize="10"
            fontWeight="800"
            letterSpacing="2.5"
            fontFamily="sans-serif"
          >
            RANGE ROVER
          </text>
          <text
            x="60"
            y="44"
            textAnchor="middle"
            className="fill-amber-600 dark:fill-amber-400 font-display"
            fontSize="7"
            fontWeight="700"
            letterSpacing="1.5"
            fontFamily="sans-serif"
          >
            LAND ROVER
          </text>
        </svg>
      );

    case 'aston-martin':
      return (
        <svg {...shared}>
          <path
            d="M20 34C35 24 50 20 60 20C70 20 85 24 100 34C88 32 75 30 60 30C45 30 32 32 20 34Z"
            className="fill-emerald-700 dark:fill-emerald-400"
          />
          <text
            x="60"
            y="45"
            textAnchor="middle"
            className="fill-slate-900 dark:fill-zinc-100 font-display"
            fontSize="9"
            fontWeight="800"
            letterSpacing="2"
            fontFamily="sans-serif"
          >
            ASTON MARTIN
          </text>
        </svg>
      );

    default:
      return null;
  }
}
