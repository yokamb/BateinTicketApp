import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ArrowRight, CheckCircle, Shield, Zap, Layers, MessageSquare, Briefcase, Star, PenTool } from "lucide-react";
import Logo from "@/components/Logo";
import { DynamicReviews } from "@/components/landing/DynamicReviews";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-white text-[#0d0d0d] selection:bg-indigo-100 overflow-hidden font-sans antialiased relative">
      {/* Background blobs - RESTORED BUT SUBTLE */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-[#f0f0f0] bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="scale-100 sm:scale-110 origin-left" />
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-sm">
            {!session ? (
              <>
                <Link href="/login" className="font-medium text-[#666] hover:text-[#0d0d0d] transition-colors text-xs sm:text-sm">
                  Log in
                </Link>
                <Link href="/register" className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-95 shadow-md text-xs sm:text-sm">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors text-xs sm:text-sm">
                  Dashboard
                </Link>
                <Link href="/api/auth/signout" className="font-medium text-slate-500 hover:text-rose-600 transition-colors text-xs sm:text-sm">
                  Sign out
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold mb-6 sm:mb-8 border border-indigo-100/50">
          <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          The Ultimate Ticketing OS for Freelancers
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-4 sm:mb-6 leading-[1.15] text-[#0d0d0d]">
          Manage clients like a <br />
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Fortune 500 agency.</span>
        </h1>
        <p className="text-base sm:text-lg text-[#555] max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-medium">
          Create isolated workspaces, handle Incidents with ITIL naming, track Change approvals, and manage projects. Stop using chaotic emails for client support.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link href={session ? "/dashboard" : "/register"} className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white font-bold text-base sm:text-lg hover:shadow-2xl hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]">
            {session ? "Enter Workspace" : "Start Free Trial"}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </Link>
          <Link href="#features" className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white border border-[#e5e5e5] hover:border-indigo-200 hover:bg-indigo-50/20 rounded-2xl text-[#0d0d0d] font-bold text-base sm:text-lg transition-all shadow-sm">
            View Features
          </Link>
        </div>
      </main>

      {/* Feature Highlights */}
      <section id="features" className="relative z-10 py-16 sm:py-24 bg-white border-y border-[#f0f0f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-[#0d0d0d]">Everything you need to deliver.</h2>
            <p className="text-[#666] text-sm sm:text-base font-medium">Powerful features wrapped in an elegant, minimal interface.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Layers, title: "Isolated Workspaces", desc: "Give every client their own branded portal. Keep their data, tickets, and communications completely separate and secure.", bg: "bg-indigo-50", color: "text-indigo-600" },
              { icon: Shield, title: "Change Approvals", desc: "Enforce rigorous workflows. Require explicit sign-off from designated client stakeholders before resolving critical Changes.", bg: "bg-purple-50", color: "text-purple-600" },
              { icon: Briefcase, title: "Project Tracker", desc: "Let clients follow progress in real-time. Share milestones, task updates, and timelines directly within their dedicated workspace.", bg: "bg-cyan-50", color: "text-cyan-600" },
              { icon: Zap, title: "ITIL-Ready Naming", desc: "Automatically organize work streams with industry-standard tags like INC- (Incidents), REQ- (Requests), and CHG- (Changes).", bg: "bg-amber-50", color: "text-amber-600" },
              { icon: MessageSquare, title: "Email Notifications", desc: "Stay updated with automated Resend alerts. Get notified instantly for new tickets, status changes, and client comments.", bg: "bg-emerald-50", color: "text-emerald-600" },
              { icon: PenTool, title: "Secure Authentication", desc: "Professional security for you and your clients. Dual-option login via Google OAuth or verified email registration.", bg: "bg-rose-50", color: "text-rose-600" }
            ].map((f, i) => (
              <div key={i} className="p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-white border border-[#e5e5e5] hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${f.bg} rounded-xl sm:rounded-2xl flex items-center justify-center ${f.color} mb-4 sm:mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
                  <f.icon size={20} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-[#0d0d0d]">{f.title}</h3>
                <p className="text-[#666] text-sm leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Dynamic Reviews - RESTORED ANIMATIONS & DYNAMIC CONTENT */}
      <section className="relative z-10 py-32 bg-[#fafafa] flex flex-col items-center overflow-hidden border-b border-[#f0f0f0]">
        <div className="text-center mb-4 px-6 relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full mb-6 border border-amber-200 shadow-lg shadow-amber-500/10">
             <Star className="text-amber-500" size={24} fill="currentColor" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-3 text-[#0d0d0d] tracking-tight">Trust of Professionals World Wide</h2>
        </div>

        <DynamicReviews />
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-[#0d0d0d]">Simple, Transparent Pricing</h2>
            <p className="text-[#666] text-sm sm:text-base font-medium">Start for free. Upgrade when you need more power.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="p-7 sm:p-10 rounded-[2rem] bg-white border border-[#e5e5e5] flex flex-col hover:shadow-xl transition-all group">
               <h3 className="text-xl font-bold text-[#666] mb-1">Free</h3>
               <div className="text-4xl font-black text-[#0d0d0d] mb-6 sm:mb-8 font-mono tracking-tighter">$0<span className="text-sm text-[#888] font-medium">/mo</span></div>
               <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 text-[#555] text-[13px] font-medium">
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500 shrink-0"/> 1 Active Workspace</li>
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500 shrink-0"/> 50 Lifecycle Tickets</li>
                  <li className="flex items-center gap-3 text-indigo-600 font-bold"><CheckCircle size={16} className="text-indigo-500 shrink-0"/> Universal Time Tracker</li>
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500 shrink-0"/> Base SLA Monitoring</li>
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500 shrink-0"/> 100 MB Cloud Storage</li>
               </ul>
               <Link href={session ? "/dashboard" : "/register"} className="mt-auto block w-full text-center py-3.5 rounded-2xl border-2 border-[#eee] hover:border-indigo-400 hover:text-indigo-600 text-[#666] font-bold transition-all text-sm">
                 {session ? "Dashboard" : "Get Started"}
               </Link>
            </div>

            {/* Pro — removed scale-105 on mobile */}
            <div className="p-7 sm:p-10 rounded-[2rem] bg-white border-2 border-indigo-600 flex flex-col shadow-2xl shadow-indigo-500/10 relative md:scale-105 z-10">
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-black rounded-full shadow-lg">MOST POPULAR</div>
               <h3 className="text-xl font-bold text-indigo-600 mb-1">Pro</h3>
               <div className="text-4xl font-black text-[#0d0d0d] mb-6 sm:mb-8 font-mono tracking-tighter">$2<span className="text-sm text-[#888] font-medium">/mo</span></div>
               <ul className="space-y-3 mb-8 sm:mb-10 text-[#555] text-[12px] font-medium">
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-indigo-500 shrink-0"/> 10 Active Workspaces</li>
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-indigo-500 shrink-0"/> Unlimited Support Tickets</li>
                  <li className="flex items-center gap-3 text-indigo-600 font-bold"><CheckCircle size={16} className="text-indigo-500 shrink-0"/> Enhanced Analytics (30d)</li>
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-indigo-500 shrink-0"/> Custom Ticket Types & Labels</li>
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-indigo-500 shrink-0"/> File & Media Attachments</li>
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-indigo-500 shrink-0"/> Team Collaboration Nodes</li>
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-indigo-500 shrink-0"/> Priority Pulse Email Support</li>
               </ul>
               <Link href={session ? "/dashboard" : "/register"} className="mt-auto block w-full text-center py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-2xl hover:shadow-indigo-500/40 text-white font-bold transition-all text-sm ring-4 ring-indigo-50">
                 {session ? "Upgrade Now" : "Get Pro Now"}
               </Link>
            </div>

            {/* Max */}
            <div className="p-7 sm:p-10 rounded-[2rem] bg-white border border-[#e5e5e5] flex flex-col hover:shadow-xl transition-all">
               <h3 className="text-xl font-bold text-[#666] mb-1">Max</h3>
               <div className="text-4xl font-black text-[#0d0d0d] mb-6 sm:mb-8 font-mono tracking-tighter">$6<span className="text-sm text-[#888] font-medium">/mo</span></div>
               <ul className="space-y-3 mb-8 sm:mb-10 text-[#555] text-[11px] font-medium">
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500 shrink-0"/> Unlimited Everything</li>
                  <li className="flex items-center gap-3 text-indigo-600 font-bold"><CheckCircle size={16} className="text-indigo-500 shrink-0"/> Full Analytics Intelligence</li>
                  <li className="flex items-center gap-3 text-indigo-600 font-bold"><CheckCircle size={16} className="text-indigo-500 shrink-0"/> SLA Resolution Heatmaps</li>
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500 shrink-0"/> Change Request Approvals</li>
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500 shrink-0"/> Workflow Triggers & Automation</li>
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500 shrink-0"/> Role-Based Access (RBAC)</li>
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500 shrink-0"/> White-Label Portal Config</li>
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500 shrink-0"/> 24/7 Elite Support Channel</li>
                  <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500 shrink-0"/> 5 GB Global Cloud Storage</li>
               </ul>
               <Link href={session ? "/dashboard" : "/register"} className="mt-auto block w-full text-center py-3.5 rounded-2xl border-2 border-[#eee] hover:border-emerald-400 hover:text-emerald-600 text-[#666] font-bold transition-all text-sm">
                 {session ? "Upgrade to Max" : "Get Max"}
               </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-8 text-[#0d0d0d] tracking-tight leading-tight">Ready to elevate your <br /> <span className="text-indigo-600">client experience?</span></h2>
          <Link href="/register" className="inline-flex items-center gap-3 px-10 py-5 bg-[#0d0d0d] text-white rounded-[2rem] font-black text-xl hover:bg-[#222] hover:shadow-2xl hover:shadow-black/20 transition-all hover:scale-105 active:scale-95 shadow-xl">
            Get Started For Free
            <ArrowRight size={22} />
          </Link>
          <p className="mt-6 text-[#888] text-sm font-bold uppercase tracking-widest">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-[#f0f0f0] bg-white text-center relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <Logo className="scale-100 opacity-60 grayscale hover:grayscale-0 transition-all mb-6 mx-auto cursor-pointer" />
          <div className="flex justify-center gap-8 mb-8 text-sm font-bold text-[#888]">
            <Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-indigo-600 transition-colors">Login</Link>
          </div>
          <p className="text-xs text-[#aaa] font-medium tracking-wide prose max-w-none">© 2026 Batein Software Architecture. Built for modern freelancers worldwide.</p>
        </div>
        
        {/* Subtle Footer Blob */}
        <div className="absolute bottom-[-50%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 rounded-[100%] blur-[100px] pointer-events-none"></div>
      </footer>
    </div>
  );
}