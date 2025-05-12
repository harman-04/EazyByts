// src/pages/Register.jsx
import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import '../styles/ChatApp.css'; // Import the main CSS file

const Register = () => {
    const [data, setData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState(null); // State for error messages
    const [success, setSuccess] = useState(null); // State for success messages
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        setSuccess(null); // Clear previous success
        try {
            const res = await axios.post('/auth/register', data);
            localStorage.setItem('token', res.data.token);
            setSuccess('Registration successful! Redirecting to chat...');
            console.log('Registration successful!');
            setTimeout(() => navigate('/chat'), 1500); // Redirect after a short delay
        } catch (err) {
            const errMsg = err.response && err.response.data && err.response.data.message 
                           ? err.response.data.message 
                           : 'Registration failed! Please try again.';
            setError(errMsg);
            console.error("Registration failed:", err.response ? err.response.data : err.message);
        }
    };

    return (
        <div className="container my-5">
            <div className="card shadow-lg rounded-3 mx-auto auth-card"> {/* Added auth-card class */}
                <div className="card-header bg-success text-white text-center py-3 rounded-top-3 auth-header"> {/* Added auth-header class */}
                    <h2 className="mb-0">Join ChatVerse</h2>
                </div>
                <div className="card-body p-4">
                    {error && <div className="alert alert-danger" role="alert">{error}</div>}
                    {success && <div className="alert alert-success" role="alert">{success}</div>}
                    <form onSubmit={handleRegister}>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">Username</label> {/* Changed from User Name */}
                            <input
                                type="text"
                                className="form-control"
                                id="username"
                                placeholder="Choose a username"
                                onChange={(e) => setData({ ...data, username: e.target.value })}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email address</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                placeholder="Enter your email"
                                onChange={(e) => setData({ ...data, email: e.target.value })}
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
                                onChange={(e) => setData({ ...data, password: e.target.value })}
                                required
                            />
                        </div>
                        <button className="btn btn-success w-100 py-2 auth-btn" type="submit"> {/* Added auth-btn class */}
                            Register
                        </button>
                    </form>
                    <p className="text-center mt-3 mb-0">
                        Already have an account? <Link to="/login">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;