// src/pages/Login.jsx
import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate, Link } from 'react-router-dom'; // Import Link for registration link
import '../styles/ChatApp.css'; // Import the main CSS file

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null); // State for error messages
    const [success, setSuccess] = useState(null); // State for success messages
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        setSuccess(null); // Clear previous success
        try {
            const res = await axios.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            setSuccess('Login successful! Redirecting to chat...');
            console.log('Login successful!');
            setTimeout(() => navigate('/chat'), 1500); // Redirect after a short delay
        } catch (err) {
            const errMsg = err.response && err.response.data && err.response.data.message 
                           ? err.response.data.message 
                           : 'Login failed! Please check your credentials.';
            setError(errMsg);
            console.error("Login failed:", err.response ? err.response.data : err.message);
        }
    };

    return (
        <div className="container my-5">
            <div className="card shadow-lg rounded-3 mx-auto auth-card"> {/* Added auth-card class */}
                <div className="card-header bg-primary text-white text-center py-3 rounded-top-3 auth-header"> {/* Added auth-header class */}
                    <h2 className="mb-0">Welcome Back!</h2>
                </div>
                <div className="card-body p-4">
                    {error && <div className="alert alert-danger" role="alert">{error}</div>}
                    {success && <div className="alert alert-success" role="alert">{success}</div>}
                    <form onSubmit={handleLogin}>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email address</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button className="btn btn-primary w-100 py-2 auth-btn" type="submit"> {/* Added auth-btn class */}
                            Login
                        </button>
                    </form>
                    <p className="text-center mt-3 mb-0">
                        Don't have an account? <Link to="/register">Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;