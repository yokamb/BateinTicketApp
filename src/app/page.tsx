import Link from "next/link";
import { ArrowRight, CheckCircle, Shield, Zap, Layers, MessageSquare, Briefcase, Star, PenTool } from "lucide-react";
import Logo from "@/components/Logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0514] text-white selection:bg-purple-500/30 overflow-hidden font-sans">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[800px] h-[800px] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[150px] animate-blob animation-delay-4000"></div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-purple-200 hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/register" className="text-sm font-bold bg-white text-slate-900 px-5 py-2.5 rounded-full hover:bg-purple-50 transition-colors shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-purple-300 text-sm font-medium mb-8 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
          The Ultimate Ticketing OS & Project tracker for Freelancers
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          Manage clients like a <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
            Fortune 500 agency.
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Create isolated workspaces, handle Incidents with ITIL naming, track Change approvals, and manage projects. Stop using chaotic emails for client support.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full text-white font-bold text-lg hover:from-purple-500 hover:to-indigo-500 transition-all shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] flex items-center justify-center gap-2 group">
            Start Free Trial
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </Link>
          <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-white font-bold text-lg transition-all backdrop-blur-sm">
            View Features
          </Link>
        </div>
      </main>

      {/* Feature Highlights */}
      <section id="features" className="relative z-10 py-24 bg-black/40 border-y border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to deliver.</h2>
            <p className="text-slate-400 text-lg">Powerful features wrapped in an elegant, minimal interface.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-purple-500/50 transition-colors group">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Layers size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Isolated Workspaces</h3>
              <p className="text-slate-400 leading-relaxed">Give every client their own branded portal. Keep their data, tickets, and communications completely separate and secure.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-pink-500/50 transition-colors group">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Change Approvals</h3>
              <p className="text-slate-400 leading-relaxed">Enforce rigorous workflows. Require explicit sign-off from designated client stakeholders before resolving critical Changes.</p>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-indigo-500/50 transition-colors group">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Briefcase size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Project Tracker</h3>
              <p className="text-slate-400 leading-relaxed">Let clients follow progress in real-time. Share milestones, task updates, and timelines directly within their dedicated workspace.</p>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-blue-500/50 transition-colors group">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">ITIL-Ready Naming</h3>
              <p className="text-slate-400 leading-relaxed">Automatically organize work streams with industry-standard tags like INC- (Incidents), REQ- (Requests), and CHG- (Changes).</p>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-emerald-500/50 transition-colors group">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Email Notifications</h3>
              <p className="text-slate-400 leading-relaxed">Stay updated with automated Resend alerts. Get notified instantly for new tickets, status changes, and client comments.</p>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-yellow-500/50 transition-colors group">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-400 mb-6 group-hover:scale-110 transition-transform">
                <PenTool size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Secure Authentication</h3>
              <p className="text-slate-400 leading-relaxed">Professional security for you and your clients. Dual-option login via Google OAuth or verified email registration.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Reviews */}
      <section className="relative z-10 py-32 w-full overflow-hidden border-t border-white/5 bg-black/20">
        <div className="text-center mb-24 px-6 relative z-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 animate-lightbulb shadow-2xl shadow-yellow-500/50">
             <Star className="text-white" size={32} fill="currentColor" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Loved by Top Professionals</h2>
          <p className="text-slate-400 text-lg">Real feedback from freelancers and agencies using Batein.</p>
        </div>

        {/* Cloud/Lightbulb Floating Container */}
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 pt-8 pb-16">
          {(() => {
            const reviews = [
              { name: "Sarah Jenkins", role: "UI/UX Designer", rating: 5, color: "from-purple-500 to-indigo-500", text: "Batein completely eliminated email tag with my clients. They log into their workspaces and approve design changes instantly.", delayClass: "" },
              { name: "Alex Chen", role: "DevOps Consultant", rating: 5, color: "from-blue-500 to-cyan-500", text: "The Change Approval workflow feature alone is worth $100/mo. It protects me from scope creep and undocumented client demands.", delayClass: "delay-1" },
              { name: "Maria Rodriguez", role: "Digital Agency Owner", rating: 4, color: "from-pink-500 to-rose-500", text: "We manage 15 distinct clients across 15 workspaces. Batein is the elegant, lightweight solution Jira could never be.", delayClass: "delay-2" },
              { name: "David Kim", role: "Freelance", rating: 5, color: "from-emerald-500 to-teal-500", text: "I tried Zendesk but it was too complex. Batein is built exactly for solo devs handling multiple retainers.", delayClass: "delay-3" },
              { name: "Emma Wilson", role: "Marketing", rating: 5, color: "from-amber-500 to-orange-500", text: "My clients love having their own branded portal. It makes my 1-person business look like a Fortune 500 agency.", delayClass: "delay-4" },
            ];
            return reviews.map((review, i) => (
              <div 
                key={i} 
                className={`relative p-8 md:p-10 bg-white/5 border-2 border-white/10 backdrop-blur-md transition-transform animate-cloud-morph ${review.delayClass} hover:bg-white/10 hover:border-yellow-500/50 hover:shadow-[0_0_50px_rgba(234,179,8,0.2)] flex flex-col items-center text-center`}
              >
                {/* Floating Lightbulb Accent */}
                <div className="absolute top-[-20px] bg-gradient-to-br from-yellow-300 to-amber-500 w-10 h-10 rounded-full animate-lightbulb border-[3px] border-[#0A0514] flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.6)]">
                   <Star size={14} className="text-[#0A0514]" fill="currentColor" />
                </div>
                
                <div className="flex text-yellow-400 mb-5 gap-1 justify-center">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={18} fill={j < review.rating ? "currentColor" : "none"} className={j >= review.rating ? "text-slate-600" : ""} />
                  ))}
                </div>
                <p className="text-slate-300 mb-8 italic text-[16px] leading-relaxed">"{review.text}"</p>
                
                <div className="flex items-center gap-4 mt-auto">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${review.color} flex items-center justify-center font-bold text-white shadow-lg text-lg`}>
                    {review.name[0]}
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-white text-base">{review.name}</h4>
                    <p className="text-sm text-slate-400 font-medium">{review.role}</p>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-24 bg-black/40 border-t border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 text-lg">Start for free. Upgrade when you need more power.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col">
               <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
               <div className="text-4xl font-black text-white mb-6">$0<span className="text-lg text-slate-400 font-medium">/mo</span></div>
               <ul className="space-y-3 mb-8 text-slate-400 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-purple-400"/> 1 Workspace</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-purple-400"/> Up to 50 Tickets</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-purple-400"/> 1 Notebook (5 Pages)</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-purple-400"/> Share with 2 Customers</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-purple-400"/> 100 MB Storage</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-purple-400"/> 5 MB Max File Size</li>
               </ul>
               <Link href="/register" className="mt-auto block w-full text-center py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-colors">Get Started</Link>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-900/40 to-indigo-900/20 border-2 border-purple-500 transform md:-translate-y-4 shadow-[0_0_30px_rgba(168,85,247,0.2)] flex flex-col">
               <div className="inline-block px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full mb-4 self-start">RECOMMENDED</div>
               <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
               <div className="text-4xl font-black text-white mb-6">$2<span className="text-lg text-purple-200 font-medium">/mo</span></div>
               <ul className="space-y-3 mb-8 text-purple-100 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-white"/> 10 Workspaces</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-white"/> Unlimited Tickets</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-white"/> Unlimited Notebooks</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-white"/> Unlimited Customer Sharing</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-white"/> 1 GB Storage</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-white"/> 5 MB Max File Size</li>
               </ul>
               <Link href="/register" className="mt-auto block w-full text-center py-3 rounded-full bg-purple-500 hover:bg-purple-600 text-white font-bold transition-colors shadow-lg shadow-purple-500/30">Upgrade Now</Link>
            </div>

            {/* Max */}
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col">
               <h3 className="text-2xl font-bold text-white mb-2">Max</h3>
               <div className="text-4xl font-black text-white mb-6">$6<span className="text-lg text-slate-400 font-medium">/mo</span></div>
               <ul className="space-y-3 mb-8 text-slate-400 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-purple-400"/> Unlimited Workspaces</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-purple-400"/> Unlimited Tickets</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-purple-400"/> Unlimited Notebooks</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-purple-400"/> Priority 24/7 Support</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-purple-400"/> 5 GB Storage</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-purple-400"/> 10 MB Max File Size</li>
                  <li className="mt-4 pt-4 border-t border-white/10 text-xs text-purple-300 font-medium italic">
                    Additional storage: $1 per 1GB
                  </li>
               </ul>
               <Link href="/register" className="mt-auto block w-full text-center py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-colors">Get Max</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 py-32 bg-gradient-to-b from-transparent to-purple-900/20 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to elevate your client experience?</h2>
          <Link href="/register" className="inline-flex items-center gap-2 px-10 py-5 bg-white text-slate-900 rounded-full font-extrabold text-xl hover:bg-slate-200 transition-colors shadow-2xl shadow-white/10 hover:scale-105 transform">
            Get Started For Free
          </Link>
          <p className="mt-6 text-slate-500">No credit card required. Upgrade anytime.</p>
        </div>
      </section>
    </div>
  );
}
