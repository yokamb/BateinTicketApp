import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  
  return (
    <Link href="/" className={`inline-flex items-center hover:scale-105 transition-transform ${className}`}>
      <img 
        src="/logo.png" 
        alt="Batein Logo" 
        className="h-10 md:h-12 w-auto object-contain"
      />
    </Link>
  );
}




