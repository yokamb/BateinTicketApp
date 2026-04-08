"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Star } from "lucide-react";

const REVIEWS = [
  { name: "Aarav Sharma", role: "Software Architect", country: "India", text: "Batein has transformed how I manage my freelance projects. The ITIL naming makes everything so organized!", rating: 5, color: "from-indigo-400/20 to-blue-400/20" },
  { name: "Li Wei", role: "Frontend Developer", country: "China", text: "The workspace isolation is perfect for keeping my different clients' data secure and separate.", rating: 5, color: "from-emerald-400/20 to-teal-400/20" },
  { name: "Juliette Morel", role: "Creative Director", country: "France", text: "L'interface est magnifique. It's the most elegant ticketing system I've ever used for my design agency.", rating: 5, color: "from-rose-400/20 to-pink-400/20" },
  { name: "James Wilson", role: "Marketing Lead", country: "USA", text: "Finally, a tool that actually understands the freelance workflow. No more messy email threads!", rating: 5, color: "from-blue-400/20 to-indigo-400/20" },
  { name: "Isabella Santos", role: "Product Manager", country: "Brazil", text: "The change approval feature is a lifesaver. It keeps everyone accountable and projects on track.", rating: 5, color: "from-amber-400/20 to-orange-400/20" },
  { name: "Yuki Tanaka", role: "Full Stack Dev", country: "Japan", text: "Highly recommended for developers. The clean API and robust ticketing system are top-notch.", rating: 5, color: "from-cyan-400/20 to-blue-400/20" },
  { name: "Hans Schmidt", role: "DevOps Engineer", country: "Germany", text: "Efficient and reliable. Batein's automation features save me hours of manual work every week.", rating: 5, color: "from-slate-400/20 to-indigo-400/20" },
  { name: "Chloe Thompson", role: "Content Strategist", country: "Australia", text: "I love how easy it is to share progress with clients. Batein makes me look so much more professional.", rating: 5, color: "from-purple-400/20 to-indigo-400/20" },
  { name: "Elena Popova", role: "Data Scientist", country: "Russia", text: "The project tracker is excellent for long-term data projects. It keeps everything transparent.", rating: 4, color: "from-blue-400/20 to-cyan-400/20" },
  { name: "Ahmed Hassan", role: "Backend Developer", country: "Egypt", text: "Secure and scalable. Batein is the perfect partner for my growing tech consultancy.", rating: 5, color: "from-emerald-400/20 to-green-400/20" },
  { name: "Sofia Rossi", role: "UX Researcher", country: "Italy", text: "Il design è intuitivo. My clients find it incredibly easy to use, which is a huge win for us.", rating: 5, color: "from-amber-400/20 to-yellow-400/20" },
  { name: "Mateo Garcia", role: "Mobile Developer", country: "Mexico", text: "Great support and great features. Batein is a must-have for any serious freelancer.", rating: 5, color: "from-rose-400/20 to-orange-400/20" },
  { name: "Kim Ji-hoon", role: "Game Dev", country: "South Korea", text: "The dedicated workspaces for each game project are a game-changer. Perfect organization!", rating: 5, color: "from-purple-400/20 to-pink-400/20" },
  { name: "Lars Eriksen", role: "Systems Architect", country: "Norway", text: "Robust and reliable. Batein handles complex workflows with ease. Extremely impressed.", rating: 5, color: "from-slate-400/20 to-blue-400/20" },
  { name: "Fatima Al-Sayed", role: "Digital Strategist", country: "UAE", text: "Batein has elevated my client interactions. It's premium, efficient, and exactly what I needed.", rating: 5, color: "from-amber-400/20 to-yellow-400/20" },
];

const MAX_VISIBLE = 3;

export function DynamicReviews() {
  const [activeReviews, setActiveReviews] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const getSafeRandomPos = useCallback((existingPos: any[]) => {
    let bestPos = { top: 0, left: 0 };
    let maxMinDist = -1;

    // Try multiple random attempts and pick the one with most space from neighbors
    for (let i = 0; i < 50; i++) {
      const top = Math.random() * 65 + 5; // 5% to 70%
      const left = Math.random() * 65 + 5; // 5% to 70%

      let minDist = 1000;
      existingPos.forEach(p => {
        const d = Math.sqrt(Math.pow(p.top - top, 2) + Math.pow(p.left - left, 2));
        if (d < minDist) minDist = d;
      });

      if (minDist > maxMinDist) {
        maxMinDist = minDist;
        bestPos = { top, left };
      }

      // If we found a very safe spot (35% diameter), stop early
      if (minDist > 35) break;
    }
    return { top: `${bestPos.top}%`, left: `${bestPos.left}%`, rawTop: bestPos.top, rawLeft: bestPos.left };
  }, []);

  const spawnReview = useCallback((excludeNames: string[], existingPos: any[]) => {
    const available = REVIEWS.filter(r => !excludeNames.includes(r.name));
    const review = available[Math.floor(Math.random() * available.length)];
    const pos = getSafeRandomPos(existingPos);

    return {
      id: Math.random(),
      review,
      pos,
      visible: true,
      delayClass: `delay-${Math.floor(Math.random() * 4) + 1}`
    };
  }, [getSafeRandomPos]);

  useEffect(() => {
    // Initial spawn
    let initial: any[] = [];
    for (let i = 0; i < MAX_VISIBLE; i++) {
      initial.push(spawnReview(initial.map(ir => ir.review.name), initial.map(ir => ir.pos)));
    }
    setActiveReviews(initial);

    const interval = setInterval(() => {
      setActiveReviews(prev => {
        if (prev.length < MAX_VISIBLE) return prev;

        const newReviews = [...prev];
        const indexToReplace = Math.floor(Math.random() * MAX_VISIBLE);
        const oldId = newReviews[indexToReplace].id;

        // 1. Mark for fade out
        newReviews[indexToReplace] = { ...newReviews[indexToReplace], visible: false };

        // 2. Schedule replacement
        setTimeout(() => {
          setActiveReviews(current => {
            const updated = [...current];
            const targetIdx = updated.findIndex(r => !r.visible && r.id === oldId);
            if (targetIdx === -1) return current;

            const visibleOthers = updated.filter(r => r.visible);
            const currentNames = visibleOthers.map(r => r.review.name);
            const currentPos = visibleOthers.map(r => ({ top: r.pos.rawTop, left: r.pos.rawLeft }));

            updated[targetIdx] = spawnReview(currentNames, currentPos);
            return updated;
          });
        }, 1000);

        return newReviews;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [spawnReview]);

  return (
    <div ref={containerRef} className="relative w-full max-w-7xl h-[1000px] border-y border-dashed border-[#eee] bg-transparent overflow-hidden mt-12 mb-24">
      {/* Background Decorative center element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-0 opacity-10 pointer-events-none">
        <div className="w-40 h-40 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-6 border border-indigo-100/50 animate-pulse">
          <Star size={80} className="text-indigo-600" fill="currentColor" />
        </div>
        <p className="text-6xl font-black text-indigo-900 tracking-[0.4em] uppercase opacity-20 text-center">Batein Reviews</p>
      </div>

      {activeReviews.map((ar) => (
        <div
          key={ar.id}
          style={{
            top: ar.pos.top,
            left: ar.pos.left,
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: ar.visible ? 1 : 0,
            transform: ar.visible ? 'scale(1) rotate(0deg)' : 'scale(0.8) rotate(-10deg)',
          }}
          className={`absolute p-8 bg-slate-950 border border-slate-800/50 amoeba-border animate-cloud-morph ${ar.delayClass} w-[320px] shadow-2xl shadow-black/40 hover:z-50 hover:scale-105 transition-all flex flex-col items-center text-center`}
        >
          {/* Yellow Star Icon Overlapping the top border */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
            <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center border-4 border-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.5)]">
              <Star className="text-slate-900" size={20} fill="currentColor" />
            </div>
          </div>

          <div className="flex text-amber-500 gap-1 mb-5 mt-4 justify-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} fill={i < ar.review.rating ? "currentColor" : "none"} className={i >= ar.review.rating ? "text-slate-700" : ""} />
            ))}
          </div>

          <p className="text-sm text-slate-300 font-medium leading-relaxed mb-6 italic px-2">
            "{ar.review.text}"
          </p>

          <div className="mt-auto w-full pt-5 border-t border-slate-800/50 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-lg shrink-0">
              {ar.review.name[0]}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-white text-xs truncate">{ar.review.name}</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{ar.review.role}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
