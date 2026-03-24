import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Results from './pages/Results';
import Navbar from './components/Navbar';

export default function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('arka_user') || 'null')
  );

  const login = (userData) => {
    localStorage.setItem('arka_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('arka_user');
    localStorage.removeItem('arka_scan_id');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar user={user} onLogout={logout} />
        <Routes>
          <Route path="/"
            element={user
              ? <Navigate to="/dashboard" />
              : <Landing onLogin={login} />}
          />
          <Route path="/dashboard"
            element={user
              ? <Dashboard user={user} />
              : <Navigate to="/" />}
          />
          <Route path="/results/:scanId"
            element={user
              ? <Results user={user} />
              : <Navigate to="/" />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
