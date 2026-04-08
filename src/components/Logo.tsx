import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {

  return (
    <Link href="/" className={`inline-flex items-center hover:scale-105 transition-transform ${className}`}>
      <img 
        src="/logo-batein-final-v3.png" 
        alt="Batein Logo" 
        className="h-11 md:h-14 w-auto object-contain"
        style={{ mixBlendMode: 'multiply' }}
      />
    </Link>
  );
}




