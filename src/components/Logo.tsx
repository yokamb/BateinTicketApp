import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  const textColor = "#004F6C"; // Exact Dark Blue/Teal from the logo image
  const barColor = "#EF4444";  // Exact Solid Red from the logo image
  
  return (
    <Link href="/" className={`inline-flex items-center hover:scale-105 transition-transform ${className}`}>
      <svg width="180" height="48" viewBox="0 0 180 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-10 md:h-12">
        {/* Three stacked solid red bars */}
        <rect x="0" y="6" width="38" height="8" fill={barColor} />
        <rect x="0" y="20" width="38" height="8" fill={barColor} />
        <rect x="0" y="34" width="38" height="8" fill={barColor} />

        {/* Batein Text */}
        <text 
          x="48" 
          y="35" 
          fill={textColor}
          style={{ 
            fontFamily: '"Roboto Mono", "Courier New", monospace',
            fontSize: '34px',
            fontWeight: 700,
            letterSpacing: '0.1em'
          }}
        >
          Batein
        </text>
      </svg>
    </Link>
  );
}




