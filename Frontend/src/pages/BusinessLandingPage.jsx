import React from 'react';
import { ShieldAlert, TrendingUp, Zap, Clock, ChevronRight, Store, ArrowRight, Printer, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BusinessLandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="absolute top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Store className="text-cyan-500 w-8 h-8" />
            <span className="font-extrabold text-white text-2xl tracking-tight">SafePrint<span className="text-cyan-500">Business</span></span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/business/auth')} className="text-sm font-bold text-slate-300 hover:text-white transition">Sign In</button>
            <button onClick={() => navigate('/business/auth')} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold py-2.5 px-6 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)] transition transform hover:scale-105">
              Open a Shop Hub
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-8">
          <SparkleIcon /> Powered by SafePrint AI
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight max-w-4xl">
          Transform your print shop into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">smart local hub.</span>
        </h1>
        
        <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          Get discovered by thousands of students and professionals nearby. Automate your pricing, forecast your peak hours, and accept completely secure AES-256 encrypted print jobs. No new hardware required.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <button onClick={() => navigate('/business/auth')} className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold py-4 px-8 rounded-full shadow-lg transition transform hover:-translate-y-1 flex items-center justify-center gap-2">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/nearby')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-8 rounded-full border border-slate-700 transition flex items-center justify-center gap-2">
            View Live Map
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-slate-900 border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-4">Enterprise tools for local shops.</h2>
            <p className="text-slate-400 max-w-xl mx-auto">We bring the power of machine learning and military-grade encryption directly to your local printing business.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<TrendingUp className="w-8 h-8 text-cyan-400" />}
              title="AI Traffic Forecasting"
              desc="Our ML models analyze local request data to predict when your shop will be busy, helping you manage stock and avoid queues."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-purple-400" />}
              title="Automated Surge Pricing"
              desc="When demand spikes, the AI automatically applies dynamic styling to your rates to maximize your shop's revenue during rush hours."
            />
            <FeatureCard 
              icon={<ShieldAlert className="w-8 h-8 text-emerald-400" />}
              title="AES-256 Security"
              desc="Establish trust with corporate clients. Documents remain heavily encrypted until the exact moment you hit 'Print'."
            />
            <FeatureCard 
              icon={<MapPin className="w-8 h-8 text-rose-400" />}
              title="Live Discovery Map"
              desc="App users instantly see your shop's live status (Free, Moderate, Busy) on our interactive local area map."
            />
            <FeatureCard 
              icon={<Clock className="w-8 h-8 text-blue-400" />}
              title="10-Minute Auto-Purge"
              desc="Zero liability. All customer documents and metadata are completely wiped from the servers 10 minutes after printing."
            />
            <FeatureCard 
              icon={<Printer className="w-8 h-8 text-amber-400" />}
              title="Point of Sale Integration"
              desc="Built-in dynamic UPI QR codes. Simply click 'Print' and a precise payment QR appears on screen for the customer to scan."
            />
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="py-32 px-6 text-center max-w-4xl mx-auto">
        <h2 className="text-4xl font-extrabold text-white mb-6">Ready to upgrade your shop?</h2>
        <p className="text-slate-400 mb-10 text-lg">Join the network of secure, ultra-efficient SafePrint partner shops today. Setup takes exactly 60 seconds.</p>
        <button onClick={() => navigate('/business/auth')} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-lg font-bold py-4 px-12 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.4)] transition transform hover:scale-105">
          Create Your Business Hub
        </button>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl hover:border-cyan-500/50 transition-colors group">
    <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
  </div>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default BusinessLandingPage;
