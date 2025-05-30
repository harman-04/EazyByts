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
import NotificationManager from './components/NotificationManager';
import 'bootstrap/dist/css/bootstrap.min.css';
import Footer from './components/Footer';

// Import your global CSS file where the sticky footer styles are defined
import './styles/ChatApp.css'; // Make sure this path is correct

function App() {
    return (
        <Router>
            {/* The main container for the entire app, enabling sticky footer */}
            <div className="d-flex flex-column min-vh-100">
                <Navbar />

                {/* Main content area that will expand to fill available vertical space */}
                <main className="flex-grow-1">
                    {/* Centering the NotificationManager within the main content */}
                    <div className="container mt-4"> {/* Use Bootstrap container for consistent max-width */}
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}> {/* Added margin-bottom here */}
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
                    </div>
                </main>

                <Footer />
            </div>
        </Router>
    );
}

export default App;