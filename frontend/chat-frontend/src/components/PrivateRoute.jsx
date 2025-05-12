// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken } from '../utils/token'; // Assuming getToken is correct and returns your JWT

const PrivateRoute = ({ children }) => {
    // Check if the user has a token (indicating they are authenticated)
    const isAuthenticated = !!getToken(); // getToken() should return the JWT or null/undefined

    if (!isAuthenticated) {
        // If not authenticated, redirect them to the login page
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render the child components (the protected page)
    return children;
};

export default PrivateRoute;