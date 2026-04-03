import { CalendarDays, Pill, BellRing, Sparkles, Activity } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full pt-20 pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-4">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-400/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-emerald-300/20 rounded-full blur-[100px] -z-10" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-200 bg-teal-50 text-teal-700 text-sm font-medium mb-8 animate-fade-in">
          <Sparkles size={16} className="text-teal-500" />
          <span>Next Generation Healthcare Platform</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl animate-slide-up">
          Smart Care & <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">Scheduling Platform</span>
        </h1>
        
        <p className="mt-6 text-xl text-slate-600 max-w-2xl animate-fade-in" style={{animationDelay: '100ms'}}>
          Reduce no-shows, improve medication adherence, and empower doctors with proactive AI-driven patient decisions.
        </p>
        
        <div className="mt-10 flex gap-4 animate-slide-up" style={{animationDelay: '200ms'}}>
          <Link href="/register" className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold transition-all shadow-xl shadow-slate-900/20 hover:scale-105">
            Get Started Free
          </Link>
          <Link href="/login" className="px-8 py-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-900 rounded-full font-semibold transition-all shadow-sm hover:scale-105">
            Login
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full bg-slate-50 py-24 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Unified Healthcare Solutions</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Everything patients, doctors, and clinics need to maintain healthy relationships and schedules.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: CalendarDays,
                title: "Smart Appointment System",
                desc: "Live queue, wait time estimates, and AI no-show prediction to keep clinics running smoothly.",
                color: "teal"
              },
              {
                icon: Pill,
                title: "Medication Adherence",
                desc: "Track daily prescriptions, log adherence, and improve health outcomes effortlessly.",
                color: "emerald"
              },
              {
                icon: BellRing,
                title: "Multi-Channel Notifications",
                desc: "In-app alerts, simulated SMS, and WhatsApp integrations to make sure patients never miss out.",
                color: "blue"
              }
            ].map((feat, i) => (
              <div key={i} className="glass p-8 rounded-2xl flex flex-col items-start transition-all hover:-translate-y-1 hover:shadow-xl shadow-slate-200/50">
                <div className={`w-12 h-12 rounded-xl bg-${feat.color}-100 flex items-center justify-center mb-6`}>
                  <feat.icon size={24} className={`text-${feat.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{feat.title}</h3>
                <p className="mt-3 text-slate-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
