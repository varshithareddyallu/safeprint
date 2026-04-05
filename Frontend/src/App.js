import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import AppPage from './pages/AppPage.jsx';
import ShopDashboard from './pages/ShopDashboard.jsx';
import UserMap from './pages/UserMap.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<AppPage />} />
        <Route path="/print" element={<AppPage />} />
        <Route path="/dashboard" element={<ShopDashboard />} />
        <Route path="/nearby" element={<UserMap />} />
      </Routes>
    </Router>
  );
}

export default App;