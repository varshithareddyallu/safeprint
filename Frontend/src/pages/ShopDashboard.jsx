import React, { useState } from 'react';
import axios from 'axios';
import { SERVER_URL } from '../config';
import { BarChart3, Activity, Printer, Store, Settings, Power } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ShopDashboard = () => {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [isLoginView, setIsLoginView] = useState(true);

  // Register State
  const [regName, setRegName] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regUpi, setRegUpi] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (isLoginView) {
        res = await axios.post(`${SERVER_URL}/api/shops/login`, { ownerEmail: email, password });
      } else {
        // Try to get geolocation during registration
        let coords = [17.4401, 78.3489]; // default
        if (navigator.geolocation) {
          try {
            const pos = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            coords = [pos.coords.latitude, pos.coords.longitude];
          } catch (e) {
            console.warn("Geolocation failed, using default");
          }
        }

        res = await axios.post(`${SERVER_URL}/api/shops/register`, { 
          name: regName,
          address: regAddress,
          ownerEmail: email, 
          password,
          upiId: regUpi,
          lat: coords[0],
          lng: coords[1]
        });
      }
      setShop(res.data.shop);
      setLoginError('');
    } catch (err) {
      console.error("Full Error:", err);
      if (err.response) {
         const data = err.response.data;
         const msg = typeof data === 'object' && data !== null 
            ? (data.error || JSON.stringify(data)) 
            : typeof data === 'string' ? data.slice(0, 100) : 'Server rejected the request';
         setLoginError(`Server Error: ${err.response.status} - ${msg}`);
      } else {
        setLoginError(`Network Error: Make sure your Backend Node server is running correctly (details in console)`);
      }
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await axios.post(`${SERVER_URL}/api/shops/${shop.id}/status`, { status: newStatus });
      setShop({ ...shop, status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  if (!shop) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans tracking-tight py-12">
        <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
          <h2 className="text-3xl font-extrabold text-white mb-2 text-center">Owner Portal</h2>
          <p className="text-slate-400 text-sm text-center mb-8">Manage your SafePrint Shop</p>
          
          <div className="flex bg-slate-800 rounded-lg p-1 mb-6">
             <button onClick={() => setIsLoginView(true)} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition ${isLoginView ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>Login</button>
             <button onClick={() => setIsLoginView(false)} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition ${!isLoginView ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>Register</button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLoginView && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Shop Name</label>
                  <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-white outline-none text-sm" placeholder="Campus Digital Printers" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Address</label>
                  <input type="text" required value={regAddress} onChange={e => setRegAddress(e.target.value)} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-white outline-none text-sm" placeholder="Street layout" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">UPI ID</label>
                  <input type="text" value={regUpi} onChange={e => setRegUpi(e.target.value)} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-white outline-none text-sm" placeholder="shop@okicici" />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-white outline-none text-sm" placeholder="owner@safeprint.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-white outline-none text-sm" placeholder="password123" />
            </div>
            {loginError && <p className="text-red-400 text-sm text-center">{loginError}</p>}
            <button type="submit" className="w-full py-3 mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl transition duration-200">
              {isLoginView ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {isLoginView && <p className="text-xs text-center text-slate-500 mt-6">(Demo Credentials: owner1@safeprint.com / password123)</p>}
          <div className="mt-6 text-center border-t border-slate-800 pt-4">
             <button onClick={() => navigate('/')} className="text-slate-500 hover:text-white text-sm font-semibold">Return Home</button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'free': return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]';
      case 'moderate': return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]';
      case 'busy': return 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]';
      case 'closed': return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 selection:bg-emerald-500/30">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="text-emerald-500" />
            <span className="font-bold text-white text-xl">{shop.name}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-400 uppercase tracking-widest text-xs">Live Status:</span>
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                 <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(shop.status)}`} />
                 <span className="text-sm font-bold text-white capitalize">{shop.status}</span>
              </div>
            </div>
            <button onClick={() => setShop(null)} className="text-slate-400 hover:text-white"><Power size={20} /></button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold text-white mb-2">Shop Dashboard</h1>
        <p className="text-slate-400 mb-8">Manage your shop traffic and view live metrics.</p>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4 text-emerald-400">
               <Activity /> <span className="font-bold">Current Status</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
               {['free', 'moderate', 'busy', 'closed'].map(st => (
                 <button 
                   key={st}
                   onClick={() => updateStatus(st)}
                   className={`p-3 rounded-xl border text-sm font-bold capitalize transition ${
                     shop.status === st 
                     ? 'bg-slate-800 border-emerald-500 text-white' 
                     : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                   }`}
                 >
                   {st}
                 </button>
               ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4 text-blue-400">
               <Printer /> <span className="font-bold">Today's Prints</span>
            </div>
            <div className="text-5xl font-extrabold text-white mb-2">124</div>
            <p className="text-emerald-400 text-sm font-medium">+12% from yesterday</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-5"><BarChart3 size={150} /></div>
            <div className="flex items-center gap-3 mb-4 text-purple-400">
               <Settings /> <span className="font-bold">Configuration</span>
            </div>
            <div className="space-y-4 relative z-10">
              <div>
                <span className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">UPI ID</span>
                <span className="text-white bg-slate-800 px-3 py-1.5 rounded-lg text-sm inline-block">{shop.upiId}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Email</span>
                <span className="text-white text-sm">{shop.ownerEmail}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-start">
           <button onClick={() => navigate('/print')} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold py-4 px-8 rounded-2xl shadow-lg transition">
             Open Print Receiver (Shop Mode)
           </button>
        </div>

      </div>
    </div>
  );
};

export default ShopDashboard;
