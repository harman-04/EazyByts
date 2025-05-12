// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatRoom from './pages/ChatRoom';
import PrivateChat from './pages/PrivateChat';
import UserListPage from './pages/UserListPage';
import Navbar from './components/Navbar';
import NotificationManager from './components/NotificationManager'; // Import NotificationManager
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
    return (
        <Router>
            <Navbar />
            {/* Add NotificationManager here, perhaps conditionally or styled */}
            <div style={{ textAlign: 'center', margin: '10px' }}>
                <NotificationManager />
            </div>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                    path="/chat"
                    element={
                        <PrivateRoute>
                            <ChatRoom />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/users"
                    element={
                        <PrivateRoute>
                            <UserListPage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/private/:recipientEmail"
                    element={
                        <PrivateRoute>
                            <PrivateChat />
                        </PrivateRoute>
                    }
                />

                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;