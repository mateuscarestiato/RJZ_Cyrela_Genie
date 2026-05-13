import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login, { LoginCallback } from './components/Login';
import Dashboard from './components/Dashboard';
import './index.css';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    const logged = localStorage.getItem('isLoggedIn') === 'true';
    const hasUser = localStorage.getItem('user');
    if (logged && hasUser) return true;
    if (logged === false) return false;
    return null;
  });

  useEffect(() => {
    const logged = localStorage.getItem('isLoggedIn') === 'true';
    const savedUser = localStorage.getItem('user');
    
    if (logged && savedUser) {
      try {
        if (!user) {
          setUser(JSON.parse(savedUser));
        }
        setIsAuthenticated(true);
      } catch (e) {
        handleLogout();
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = (userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
  };

  console.log("App Render - Auth:", isAuthenticated, "User:", !!user);

  if (isAuthenticated === null) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">Carregando Portal RJZ Cyrela...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/spaces" />} 
        />
        <Route 
          path="/login/callback" 
          element={<LoginCallback onLogin={handleLogin} />} 
        />
        <Route 
          path="/*" 
          element={isAuthenticated ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
};

export default App;
