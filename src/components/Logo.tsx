export default function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="neonLogo" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g filter="url(#neonLogo)">
        <path d="M40 120 L80 100 L60 50 L20 70 Z" fill="currentColor" opacity="0.8" stroke="currentColor" strokeWidth="3" />
        <path d="M120 120 L160 100 L180 150 L140 170 Z" fill="currentColor" opacity="0.8" stroke="currentColor" strokeWidth="3" />
        <rect x="75" y="85" width="50" height="70" rx="4" fill="currentColor" opacity="0.9" />
        <circle cx="100" cy="120" r="15" fill="var(--color-surface, #000)" stroke="currentColor" strokeWidth="3" />
        <circle cx="100" cy="120" r="5" fill="currentColor" />
        <line x1="100" y1="85" x2="100" y2="30" stroke="currentColor" strokeWidth="4" />
        <path d="M85 45 Q 100 20 115 45" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="90" x2="85" y2="105" stroke="currentColor" strokeWidth="4" />
        <line x1="115" y1="105" x2="130" y2="115" stroke="currentColor" strokeWidth="4" />
      </g>
    </svg>
  );
}
