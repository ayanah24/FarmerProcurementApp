import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Farmers from './pages/Farmers';
import Procurement from './pages/Procurement';
import Manager from './pages/Manager';
import Header from './components/Header';
import Footer from './components/Footer';
import { useSync } from './hooks/useSync';
import './App.css';

// Simple ProtectedRoute component with optional role check
const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  useSync(); // Initialize global sync service

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
        <Header />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmers"
              element={
                <ProtectedRoute>
                  <Farmers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/procurement"
              element={
                <ProtectedRoute>
                  <Procurement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager"
              element={
                <ProtectedRoute requiredRole="OFFICE_MANAGER">
                  <Manager />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
