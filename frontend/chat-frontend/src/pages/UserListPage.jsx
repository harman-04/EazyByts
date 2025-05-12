// src/pages/UserListPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { getToken } from '../utils/token';
import '../styles/ChatApp.css'; // Import the main CSS file

const UserListPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserEmail, setCurrentUserEmail] = useState(null); // State to hold current user's email

    useEffect(() => {
        const token = getToken();
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserEmail(payload.sub);
            } catch (e) {
                console.error("Error decoding token in UserListPage.jsx:", e);
            }
        }

        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                // !!! IMPORTANT: Adjust this URL to your backend's API endpoint for getting all users !!!
                const response = await axios.get('http://localhost:8081/api/users', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                // Filter out the current user from the list
                const filteredUsers = response.data.filter(user => user.email !== currentUserEmail);
                setUsers(filteredUsers);
            } catch (err) {
                console.error("Error fetching users:", err);
                setError("Failed to fetch users. Please ensure the backend is running and the API endpoint is correct.");
            } finally {
                setLoading(false);
            }
        };

        // Only fetch users if currentUserEmail is set (after token parsing)
        // This ensures the current user is correctly filtered out.
        if (currentUserEmail) {
            fetchUsers();
        }
    }, [currentUserEmail]); // Re-run when currentUserEmail changes

    return (
        <div className="container my-5">
            <div className="card shadow-lg rounded-3 user-list-card"> {/* Added user-list-card class */}
                <div className="card-header bg-info text-white text-center py-3 rounded-top-3 user-list-header"> {/* Added user-list-header class */}
                    <h2 className="mb-0">Available Users for Private Chat</h2>
                </div>
                <div className="card-body p-4">
                    {loading && <p className="text-info text-center">Loading users...</p>}
                    {error && <div className="alert alert-danger text-center" role="alert">{error}</div>}
                    {!loading && users.length === 0 && !error && <p className="text-muted text-center">No other users found. Invite friends!</p>}
                    <ul className="list-group list-group-flush user-list"> {/* Added user-list class */}
                        {users.map((user) => (
                            <li key={user.email} className="list-group-item d-flex justify-content-between align-items-center py-3 user-list-item"> {/* Added user-list-item class */}
                                <span className="fw-bold user-name-display">
                                    <i className="bi bi-person-circle me-2"></i> {/* Bootstrap Icon */}
                                    {user.username || user.email.split('@')[0]} {/* Display username, fallback to part of email */}
                                </span>
                                <Link to={`/private/${user.email}`} className="btn btn-primary btn-sm chat-button"> {/* Added chat-button class */}
                                    <i className="bi bi-chat-right-text me-1"></i> Chat
                                </Link>
                            </li>
                        ))}
                    </ul>
                    {!loading && !error && users.length > 0 && (
                        <div className="mt-4 text-center">
                            <p className="text-muted small">
                                Click "Chat" next to a user's name to start a private conversation.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserListPage;