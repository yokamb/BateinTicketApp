import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-baseline select-none font-extrabold text-[3.25rem] hover:scale-105 transition-transform ${className}`} style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
       <span className="text-[#0096C7] relative z-10" style={{ textShadow: '4px 4px 0px #4A4A4A' }}>B</span>
       <span className="text-[#FF5733] relative z-20 translate-y-1 -ml-1 -rotate-3" style={{ textShadow: '4px 4px 0px #4A4A4A' }}>a</span>
       <span className="text-[#0096C7] relative z-10 ml-0.5" style={{ textShadow: '4px 4px 0px #4A4A4A' }}>t</span>
       <span className="text-[#FF5733] relative z-20 -translate-y-1 ml-0.5 rotate-2" style={{ textShadow: '4px 4px 0px #4A4A4A' }}>e</span>
       <span className="text-[#0096C7] relative z-10 ml-0.5" style={{ textShadow: '4px 4px 0px #4A4A4A' }}>!</span>
       <span className="text-[#FF5733] relative z-20 translate-y-1 ml-0.5" style={{ textShadow: '4px 4px 0px #4A4A4A' }}>n</span>
    </Link>
  );
}
