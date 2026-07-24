import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import CostDashboard from './components/CostDashboard';

const isProd = import.meta.env.VITE_ENV === 'prod';
const basename = isProd ? '/cost-dashboard-demo' : '/';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(auth === 'true');
  }, []);

  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  return (
    <Router basename={basename}>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ?
              <Navigate to="/dashboard" replace /> :
              <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/dashboard/*"
          element={
            isAuthenticated ?
              <CostDashboard onLogout={handleLogout} /> :
              <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
