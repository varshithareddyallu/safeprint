import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { SERVER_URL } from '../config';
import {
  BarChart3, Activity, Printer, Store, Power,
  MessageCircle, X, Send, TrendingUp, Zap, Sparkles, DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ─── Dummy data ─────────────────────────────────── */

// Hourly revenue for today (9 AM – 6 PM)
const HOURLY_REVENUE = [
  { hour: '9AM',  revenue: 42  },
  { hour: '10AM', revenue: 87  },
  { hour: '11AM', revenue: 130 },
  { hour: '12PM', revenue: 210 },
  { hour: '1PM',  revenue: 275 },
  { hour: '2PM',  revenue: 195 },
  { hour: '3PM',  revenue: 155 },
  { hour: '4PM',  revenue: 98  },
  { hour: '5PM',  revenue: 64  },
  { hour: '6PM',  revenue: 30  },
];

// Predictive traffic forecast (9 AM – 5 PM) with richer labels
const TRAFFIC_FORECAST = [
  { hour: '9AM',  pct: 12,  label: 'Low'    },
  { hour: '10AM', pct: 28,  label: 'Rising' },
  { hour: '11AM', pct: 50,  label: 'Moderate'},
  { hour: '12PM', pct: 78,  label: 'High'   },
  { hour: '1PM',  pct: 95,  label: 'Peak'   },
  { hour: '2PM',  pct: 80,  label: 'High'   },
  { hour: '3PM',  pct: 55,  label: 'Moderate'},
  { hour: '4PM',  pct: 35,  label: 'Falling'},
  { hour: '5PM',  pct: 18,  label: 'Low'    },
];

const currentHourIndex = 4; // "1PM" is the current peak

/* ─── Tiny SVG bar-chart helper ──────────────────── */
const BarChartSVG = ({ data, valueKey, colorFn, labelKey, labelFormatter }) => {
  const max = Math.max(...data.map(d => d[valueKey]));
  const W = 100, BAR_W = 7, GAP = (W - data.length * BAR_W) / (data.length + 1);

  return (
    <svg viewBox={`0 0 100 52`} className="w-full" style={{ height: 130, overflow: 'visible' }}>
      {data.map((d, i) => {
        const barH = Math.max(2, (d[valueKey] / max) * 42);
        const x = GAP + i * (BAR_W + GAP);
        const y = 44 - barH;
        const isCurrent = i === currentHourIndex;
        return (
          <g key={i} className="group">
            {/* bar */}
            <rect
              x={x} y={y} width={BAR_W} height={barH}
              rx="2"
              fill={colorFn(d, i, isCurrent)}
              opacity={isCurrent ? 1 : 0.6}
            />
            {/* tooltip on hover via title */}
            <title>{d[labelKey]}: {labelFormatter(d[valueKey])}</title>
            {/* hour label */}
            <text x={x + BAR_W / 2} y={51} textAnchor="middle"
              fontSize="3.8" fill="#94a3b8" fontFamily="sans-serif">
              {d[labelKey]}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ─── Component ──────────────────────────────────── */
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

  // Animated counter for today's total earnings
  const totalEarnings = HOURLY_REVENUE.reduce((s, d) => s + d.revenue, 0);
  const [displayEarnings, setDisplayEarnings] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = totalEarnings / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= totalEarnings) { setDisplayEarnings(totalEarnings); clearInterval(timer); }
      else setDisplayEarnings(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
      const lowerMsg = userMessage.toLowerCase();
      let aiResponse = "I'm analyzing the data using the latest forecasting models...";
      if (lowerMsg.includes('busiest') || lowerMsg.includes('traffic'))
        aiResponse = "Based on my ML forecasting model of student class schedules, your peak traffic will hit at exactly 1:00 PM (95% confidence). I suggest activating 'Busy' status now.";
      else if (lowerMsg.includes('price') || lowerMsg.includes('surge'))
        aiResponse = "Automated dynamic pricing generated an extra 12% revenue yesterday. Because you are 'busy' right now, I've raised the per-page rate by 2 cents.";
      else if (lowerMsg.includes('prints') || lowerMsg.includes('today'))
        aiResponse = "You've successfully pushed 124 prints today, with 3 batches currently waiting in the secure queue.";
      else if (lowerMsg.includes('earn') || lowerMsg.includes('money') || lowerMsg.includes('revenue'))
        aiResponse = `You've earned ₹${totalEarnings} today! Your highest-earning hour was 1 PM with ₹275. Strong performance — you're trending 18% above last Thursday.`;
      setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    }, 800);
  };

  const getPricingMultiplier = () => {
    if (!isSurgePricingEnabled || !shop) return { text: 'Base Rate Active', color: 'text-slate-500' };
    switch (shop.status) {
      case 'free':     return { text: '10% Discount Applied (Attracting Users)', color: 'text-emerald-600' };
      case 'moderate': return { text: 'Base Demand Pricing', color: 'text-blue-600' };
      case 'busy':     return { text: '+15% Surge Pricing Active (High Load)', color: 'text-amber-600' };
      case 'closed':   return { text: 'Pricing Frozen', color: 'text-slate-400' };
      default:         return { text: 'Base Rate Active', color: 'text-slate-500' };
    }
  };

  if (!shop) return null;

  const getStatusColor = (s) => ({ free: 'bg-emerald-500', moderate: 'bg-amber-500', busy: 'bg-orange-500', closed: 'bg-red-500' }[s] || 'bg-slate-400');
  const getStatusBadgeStyle = (s) => ({
    free:     'bg-emerald-50 text-emerald-700 border-emerald-200',
    moderate: 'bg-amber-50 text-amber-700 border-amber-200',
    busy:     'bg-orange-50 text-orange-700 border-orange-200',
    closed:   'bg-red-50 text-red-700 border-red-200',
  }[s] || 'bg-slate-50 text-slate-700 border-slate-200');

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

        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Command Center</h1>
            <p className="text-slate-500">AI-optimized operations &amp; live shop management.</p>
          </div>
          <button onClick={() => navigate('/business/print')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-indigo-500/20 transition flex items-center gap-2">
            <Printer size={18} /> Open Print Receiver
          </button>
        </div>

        {/* ── ROW 1: Traffic Forecast + Dynamic Pricing ── */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* AI Traffic Forecaster — rich dummy data */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="text-indigo-500 w-5 h-5" />
              <span className="font-bold text-slate-900 tracking-wide">Predictive Traffic Forecaster</span>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ml-auto border border-indigo-200">ML Active</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Estimated customer volume — based on campus schedule &amp; historical patterns</p>

            {/* Custom bar chart */}
            <div className="flex items-end gap-1.5 h-32 mb-3 relative">
              {TRAFFIC_FORECAST.map((d, i) => {
                const isCurr = i === currentHourIndex;
                return (
                  <div key={i} title={`${d.hour}: ${d.label} (${d.pct}%)`} className="flex-1 flex flex-col justify-end items-center group cursor-pointer">
                    <span className={`text-[8px] font-bold mb-0.5 transition-opacity ${isCurr ? 'opacity-100 text-indigo-600' : 'opacity-0 group-hover:opacity-100 text-slate-500'}`}>
                      {d.pct}%
                    </span>
                    <div
                      style={{ height: `${d.pct}%` }}
                      className={`w-full rounded-t transition-all duration-500 ${
                        isCurr
                          ? 'bg-indigo-500 shadow-md shadow-indigo-200'
                          : d.pct >= 70
                          ? 'bg-amber-300 group-hover:bg-amber-400'
                          : 'bg-slate-200 group-hover:bg-slate-300'
                      }`}
                    />
                    <div className="text-[9px] text-slate-400 text-center mt-1.5 font-medium">{d.hour}</div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-3 mb-3 flex-wrap">
              {[['bg-indigo-500','Now'], ['bg-amber-300','High'], ['bg-slate-200','Low']].map(([cls,lbl]) => (
                <div key={lbl} className="flex items-center gap-1">
                  <div className={`w-2.5 h-2.5 rounded-sm ${cls}`} />
                  <span className="text-[10px] text-slate-500">{lbl}</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-slate-600">
              <strong className="text-indigo-600">Insight:</strong> AI detects a <span className="font-bold text-slate-900">95% probability</span> peak arriving at <span className="font-bold text-slate-900">1:00 PM</span>. Activate "Busy" status &amp; surge pricing now.
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
                  <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 after:shadow-sm" />
                </label>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 mt-6 border border-slate-200">
                <span className="block text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Current Modifiers</span>
                <p className={`font-bold text-lg ${getPricingMultiplier().color}`}>{getPricingMultiplier().text}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              When enabled, pricing automatically scales with your manual status setting to optimize shop revenue using market algorithms.
            </p>
          </div>
        </div>

        {/* ── ROW 2: Today's Earnings (new) + Prints Counter ── */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* 💰 Today's Earnings Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <DollarSign className="text-emerald-500 w-5 h-5" />
                <span className="font-bold text-slate-900 tracking-wide">Today's Earnings</span>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-emerald-200">Live</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-emerald-600">₹{displayEarnings.toLocaleString()}</span>
                <span className="block text-xs text-slate-400 mt-0.5">Total revenue today</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4">Hourly revenue breakdown (9 AM – 6 PM)</p>

            {/* Bar chart */}
            <div className="flex items-end gap-2 h-36 mb-3">
              {HOURLY_REVENUE.map((d, i) => {
                const max = Math.max(...HOURLY_REVENUE.map(x => x.revenue));
                const heightPct = (d.revenue / max) * 100;
                const isNow = i === currentHourIndex;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer" title={`${d.hour}: ₹${d.revenue}`}>
                    <span className={`text-[9px] font-bold mb-0.5 transition-opacity ${isNow ? 'opacity-100 text-emerald-600' : 'opacity-0 group-hover:opacity-100 text-slate-500'}`}>
                      ₹{d.revenue}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t transition-all duration-700 ${
                        isNow
                          ? 'bg-emerald-500 shadow-md shadow-emerald-200'
                          : i < currentHourIndex
                          ? 'bg-emerald-300 group-hover:bg-emerald-400'
                          : 'bg-slate-200 group-hover:bg-slate-300'
                      }`}
                    />
                    <div className="text-[9px] text-slate-400 text-center mt-1.5 font-medium">{d.hour}</div>
                  </div>
                );
              })}
            </div>

            {/* Summary pills */}
            <div className="flex gap-4 flex-wrap pt-3 border-t border-slate-100">
              {[
                { label: 'Peak Hour', value: '1 PM  ·  ₹275', color: 'text-emerald-600' },
                { label: 'Avg/Hour', value: `₹${Math.round(totalEarnings / HOURLY_REVENUE.length)}`, color: 'text-slate-700' },
                { label: 'vs Yesterday', value: '+18% 📈', color: 'text-indigo-600' },
                { label: 'Projected EOD', value: '₹1,486', color: 'text-amber-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100">
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">{label}</span>
                  <span className={`text-sm font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW 3: Manual Status + Prints Today ── */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="text-indigo-500" />
              <span className="font-bold text-slate-900 tracking-wide">Manual Status Override</span>
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
            <div className="mt-4 flex gap-3 z-10">
              <div className="bg-indigo-50 rounded-lg px-3 py-1.5 text-xs text-indigo-700 font-bold border border-indigo-100">3 in queue</div>
              <div className="bg-amber-50 rounded-lg px-3 py-1.5 text-xs text-amber-700 font-bold border border-amber-100">↑12% vs avg</div>
            </div>
          </div>
        </div>

      </div>

      {/* FLOATING AI CHAT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <div className={`transition-all duration-300 transform origin-bottom-right ${isChatOpen ? 'scale-100 opacity-100 mb-4' : 'scale-0 opacity-0 h-0 w-0'}`}>
          <div className="bg-white border border-slate-200 w-80 sm:w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden h-[450px]">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-200" />
                <span className="font-bold text-white">SafePrint Assistant</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-indigo-200 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-4 bg-slate-50 overflow-y-auto space-y-4 text-sm" style={{ scrollbarWidth: 'thin' }}>
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-slate-700 rounded-bl-sm border border-slate-200 shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 bg-white border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask about earnings, traffic, pricing..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-full py-2.5 pl-4 pr-10 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                />
                <button type="submit" disabled={!chatInput.trim()} className="absolute right-1 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                  <Send className="w-4 h-4 ml-0.5 mt-0.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
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
