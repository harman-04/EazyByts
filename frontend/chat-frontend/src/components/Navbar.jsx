// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearToken, getToken } from '../utils/token';
import '../styles/ChatApp.css'; // Use the new main CSS file

const Navbar = () => {
    const navigate = useNavigate();
    const isAuthenticated = !!getToken();

    const handleLogout = () => {
        clearToken();
        navigate('/login');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-gradient-primary shadow-sm"> {/* Bootstrap classes + custom gradient */}
            <div className="container-fluid">
                <Link className="navbar-brand custom-brand" to="/">
                    <i className="bi bi-chat-dots-fill me-2"></i> {/* Bootstrap Icon */}
                    ChatVerse
                </Link>

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0"> {/* Left-aligned items */}
                        {isAuthenticated && (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/chat">Public Chat</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/users">Private Chat</Link>
                                </li>

                                
                            </>
                        )}
                    </ul>
                    <ul className="navbar-nav ms-auto"> {/* Right-aligned items */}
                        {isAuthenticated ? (
                            <li className="nav-item">
                                <button className="btn btn-outline-light" onClick={handleLogout}>Logout</button>
                            </li>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="btn btn-outline-light me-2" to="/login">Login</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="btn btn-primary" to="/register">Register</Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;