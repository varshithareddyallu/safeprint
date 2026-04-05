import React, { useState } from 'react';
import axios from 'axios';
import { SERVER_URL } from '../config';
import { Store, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ShopAuthPage = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  
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
          name: regName, address: regAddress, ownerEmail: email, password, upiId: regUpi, lat: coords[0], lng: coords[1]
        });
      }
      
      // Store in simple local storage for this demo to pass state
      localStorage.setItem('safeprint_shop_session', JSON.stringify(res.data.shop));
      navigate('/business/dashboard');
      
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Error connecting to server. Is it running?';
      setLoginError(msg);
    }
  };

  // Skip Login for Mock Demo purposes easily
  const skipToDemo = () => {
      navigate('/business/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans tracking-tight py-12 px-4 relative">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <button onClick={() => navigate('/business')} className="absolute top-8 left-8 text-slate-600 hover:text-slate-900 flex items-center gap-2 font-bold transition">
        <ArrowLeft className="w-5 h-5" /> Back to Business
      </button>

      <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl relative overflow-hidden z-10">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-emerald-500" />
        
        <div className="flex justify-center mb-6">
           <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-300 shadow-inner">
             <Store className="w-8 h-8 text-cyan-500" />
           </div>
        </div>

        <h2 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">Owner Portal</h2>
        <p className="text-slate-600 text-sm text-center mb-8">Access your SafePrint Command Center</p>
        
        <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8 border border-slate-300/50">
           <button onClick={() => setIsLoginView(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLoginView ? 'bg-slate-700 text-slate-900 shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>Sign In</button>
           <button onClick={() => setIsLoginView(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLoginView ? 'bg-slate-700 text-slate-900 shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>Register Shop</button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLoginView && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-cyan-500 transition text-sm font-medium" placeholder="Official Shop Name" />
              <input type="text" required value={regAddress} onChange={e => setRegAddress(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-cyan-500 transition text-sm font-medium" placeholder="Street Address / Building" />
              <input type="text" value={regUpi} onChange={e => setRegUpi(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-cyan-500 transition text-sm font-medium" placeholder="Shop UPI Payment ID (e.g. shop@okhdfc)" />
            </div>
          )}
          
          <div className="space-y-4">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-cyan-500 transition text-sm font-medium" placeholder="owner@safeprint.com" />
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-cyan-500 transition text-sm font-medium" placeholder="Password" />
          </div>

          {loginError && <p className="text-rose-400 text-sm text-center font-bold bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{loginError}</p>}
          
          <button type="submit" className="w-full py-4 mt-6 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-lg rounded-xl shadow-lg transition transform hover:-translate-y-0.5">
            {isLoginView ? 'Access Dashboard' : 'Launch Shop Hub'}
          </button>
        </form>

        {isLoginView && (
           <div className="mt-8 text-center pt-6 border-t border-slate-200">
             <button onClick={skipToDemo} className="text-cyan-500 hover:text-cyan-400 text-sm font-bold underline underline-offset-4 decoration-cyan-500/30 hover:decoration-cyan-500 transition">
                Bypass Login (Hackathon Demo Mode)
             </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default ShopAuthPage;
