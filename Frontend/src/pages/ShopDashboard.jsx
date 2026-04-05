import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { SERVER_URL } from '../config';
import { BarChart3, Activity, Printer, Store, Power, MessageCircle, X, Send, TrendingUp, Zap, Sparkles, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ShopDashboard = () => {
  const navigate = useNavigate();
  const [shop, setShop] = useState(() => {
    const saved = localStorage.getItem('safeprint_shop_session');
    if (saved) return JSON.parse(saved);
    return {
      id: 'mock-shop-123',
      name: 'SafePrint Demo Shop',
      status: 'free',
      upiId: 'demo@upi',
      ownerEmail: 'demo@safeprint.com'
    };
  });

  const [isSurgePricingEnabled, setIsSurgePricingEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: "Hello! I'm your AI Shop Assistant. I've analyzed your local traffic model. How can I help you optimize today?" }
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const updateStatus = async (newStatus) => {
    try {
      await axios.post(`${SERVER_URL}/api/shops/${shop.id}/status`, { status: newStatus });
      setShop({ ...shop, status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');

    setTimeout(() => {
      let aiResponse = "I'm analyzing the data using the latest forecasting models...";
      
      const lowerMsg = userMessage.toLowerCase();
      if (lowerMsg.includes('busiest') || lowerMsg.includes('traffic')) {
        aiResponse = "Based on my ML forecasting model of student class schedules, your peak traffic will hit at exactly 2:30 PM. I suggest filling the A4 trays now.";
      } else if (lowerMsg.includes('price') || lowerMsg.includes('surge')) {
        aiResponse = "Automated dynamic pricing generated an extra 12% revenue yesterday. Because you are 'busy' right now, I've raised the per-page rate by 2 cents.";
      } else if (lowerMsg.includes('prints') || lowerMsg.includes('today')) {
        aiResponse = "You've successfully pushed 124 prints today, with 3 batches currently waiting in the secure queue.";
      }

      setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    }, 800);
  };

  const getPricingMultiplier = () => {
    if (!isSurgePricingEnabled || !shop) return { text: 'Base Rate Active', color: 'text-slate-500' };
    switch(shop.status) {
      case 'free': return { text: '10% Discount Applied (Attracting Users)', color: 'text-emerald-600' };
      case 'moderate': return { text: 'Base Demand Pricing', color: 'text-blue-600' };
      case 'busy': return { text: '+15% Surge Pricing Active (High Load)', color: 'text-amber-600' };
      case 'closed': return { text: 'Pricing Frozen', color: 'text-slate-400' };
      default: return { text: 'Base Rate Active', color: 'text-slate-500' };
    }
  };

  if (!shop) return null;

  const getStatusColor = (status) => {
    switch(status) {
      case 'free': return 'bg-emerald-500';
      case 'moderate': return 'bg-amber-500';
      case 'busy': return 'bg-orange-500';
      case 'closed': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch(status) {
      case 'free': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'moderate': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'busy': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'closed': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm">
              <Store className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-lg">{shop.name}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-400 tracking-widest text-xs">STATUS:</span>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusBadgeStyle(shop.status)}`}>
                 <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(shop.status)}`} />
                 <span className="text-sm font-bold capitalize">{shop.status}</span>
              </div>
            </div>
            <button onClick={() => setShop(null)} className="text-slate-400 hover:text-red-500 transition"><Power size={20} /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Top Header Row */}
        <div className="flex justify-between items-end mb-8">
           <div>
             <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Command Center</h1>
             <p className="text-slate-500">AI-optimized operations & live shop management.</p>
           </div>
           <button onClick={() => navigate('/business/print')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-indigo-500/20 transition flex items-center gap-2">
             <Printer size={18} /> Open Print Receiver
           </button>
        </div>

        {/* Dynamic & Predictive Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          
          {/* AI Traffic Forecaster */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-center gap-2 mb-4">
               <TrendingUp className="text-indigo-500 w-5 h-5" /> 
               <span className="font-bold text-slate-900 tracking-wide">Predictive Traffic Forecaster</span>
               <span className="bg-indigo-100 text-indigo-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ml-auto border border-indigo-200">ML Active</span>
             </div>
             
             <div className="flex items-end gap-1.5 h-32 mb-4 relative z-10">
               {[10, 20, 15, 40, 80, 50, 20, 10, 5].map((val, i) => (
                 <div key={i} className="flex-1 flex flex-col justify-end group">
                   <div style={{height: `${val}%`}} className={`w-full rounded-t transition-all duration-500 ${i === 4 ? 'bg-indigo-500 shadow-md' : 'bg-slate-200 group-hover:bg-slate-300'}`}></div>
                   <div className="text-[9px] text-slate-400 text-center mt-1.5 font-medium">{9 + i}AM</div>
                 </div>
               ))}
             </div>
             <p className="text-sm text-slate-600">
               <strong className="text-indigo-600">Insight:</strong> AI detects a probability of a print surge around <span className="font-bold text-slate-900">1:00 PM</span>. Suggest activating "Busy" status soon.
             </p>
          </div>

          {/* Automated Dynamic Pricing */}
          <div className="bg-white border border-slate-200 border-l-4 border-l-amber-400 rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-center gap-2 mb-6">
               <Zap className="text-amber-500 w-5 h-5" /> 
               <span className="font-bold text-slate-900 tracking-wide">Automated Dynamic Pricing</span>
             </div>
             
             <div className="flex-1">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm text-slate-600 font-medium tracking-wide">Surge Pricing AI</span>
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" checked={isSurgePricingEnabled} onChange={() => setIsSurgePricingEnabled(!isSurgePricingEnabled)} className="sr-only peer" />
                   <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 after:shadow-sm"></div>
                 </label>
               </div>
               
               <div className="bg-slate-50 rounded-xl p-4 mt-6 border border-slate-200">
                 <span className="block text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Current Modifiers</span>
                 <p className={`font-bold text-lg ${getPricingMultiplier().color}`}>
                   {getPricingMultiplier().text}
                 </p>
               </div>
             </div>
             <p className="text-xs text-slate-400 mt-4 leading-relaxed">
               When enabled, pricing automatically scales with your manual status setting to optimize shop revenue using market algorithms.
             </p>
          </div>
        </div>

        {/* Manual Overrides Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
               <Activity className="text-indigo-500" /> <span className="font-bold text-slate-900 tracking-wide">Manual Status Override</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
               {['free', 'moderate', 'busy', 'closed'].map(st => (
                 <button 
                   key={st}
                   onClick={() => updateStatus(st)}
                   className={`p-3 rounded-xl border text-sm font-bold capitalize transition ${
                     shop.status === st 
                     ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm' 
                     : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                   }`}
                 >
                   {st}
                 </button>
               ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center text-center items-center shadow-sm">
            <div className="absolute -right-4 -bottom-4 opacity-5"><BarChart3 size={150} /></div>
            <div className="text-5xl font-extrabold text-indigo-700 mb-2 z-10">124</div>
            <p className="text-slate-500 text-sm font-medium z-10">Total Prints Today</p>
          </div>
        </div>

      </div>

      {/* FLOATING AI CHAT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <div className={`transition-all duration-300 transform origin-bottom-right ${isChatOpen ? 'scale-100 opacity-100 mb-4' : 'scale-0 opacity-0 h-0 w-0'}`}>
           <div className="bg-white border border-slate-200 w-80 sm:w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden h-[450px]">
             
             {/* Chat Header */}
             <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-200" />
                  <span className="font-bold text-white">SafePrint Assistant</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-indigo-200 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
             </div>

             {/* Chat Body */}
             <div className="flex-1 p-4 bg-slate-50 overflow-y-auto space-y-4 text-sm" style={{scrollbarWidth: 'thin'}}>
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-2xl max-w-[85%] ${
                      msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-sm' 
                      : 'bg-white text-slate-700 rounded-bl-sm border border-slate-200 shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
             </div>

             {/* Chat Input */}
             <div className="p-3 bg-white border-t border-slate-200">
               <form onSubmit={handleSendMessage} className="relative flex items-center">
                 <input 
                   type="text" 
                   value={chatInput}
                   onChange={e => setChatInput(e.target.value)}
                   placeholder="Ask me to analyze your traffic..." 
                   className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-full py-2.5 pl-4 pr-10 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                 />
                 <button type="submit" disabled={!chatInput.trim()} className="absolute right-1 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                   <Send className="w-4 h-4 ml-0.5 mt-0.5" />
                 </button>
               </form>
             </div>

           </div>
        </div>

        {/* Floating Toggle Button */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform z-50 ${isChatOpen ? 'bg-slate-400 shadow-slate-300/30' : 'bg-indigo-600 shadow-indigo-500/30'}`}
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
        </button>
      </div>

    </div>
  );
};

export default ShopDashboard;
