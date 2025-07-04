import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.js';
import Navbar from './components/Navbar.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import Login from './pages/Login.js';
import Signup from './pages/Signup.js';
import Dashboard from './pages/Dashboard.js';
import ResumeBuilder from './pages/ResumeBuilder.js';
import OAuthSuccess from './pages/oauth-success.js';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume-builder"
              element={
                <ProtectedRoute>
                  <ResumeBuilder />
                </ProtectedRoute>
              }
            />
            <Route path="/edit-resume/:id" element={<ResumeBuilder />} />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App; 