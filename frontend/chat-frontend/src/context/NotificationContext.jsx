import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import connectSocket from '../api/socket'; // Assuming this provides a global STOMP client
import { getToken as getAuthToken } from '../utils/token'; // Your authentication token getter

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [unreadCounts, setUnreadCounts] = useState({}); // { email: count, ... }
    const location = useLocation(); // To check current route path

    // Ref to store current user's email, updated on initial render/login
    const currentUserEmailRef = React.useRef(null);
    useEffect(() => {
        const token = getAuthToken();
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                currentUserEmailRef.current = payload.sub;
            } catch (e) {
                console.error("Error decoding token in NotificationProvider:", e);
            }
        }
    }, []); // Run once on mount to get current user email

    const incrementUnreadCount = useCallback((senderEmail) => {
        setUnreadCounts(prevCounts => ({
            ...prevCounts,
            [senderEmail]: (prevCounts[senderEmail] || 0) + 1
        }));
    }, []);

    const resetUnreadCount = useCallback((senderEmail) => {
        setUnreadCounts(prevCounts => {
            const newCounts = { ...prevCounts };
            delete newCounts[senderEmail];
            return newCounts;
        });
    }, []);

    // Global STOMP connection and subscription for private messages
    useEffect(() => {
        let privateSubscription;
        let stompClientDisconnect; // Store the disconnect function

        const authToken = getAuthToken();
        if (!authToken) {
            console.log("No auth token found for NotificationContext STOMP connection. Skipping.");
            return;
        }

        const { connect, disconnect, subscribe } = connectSocket();
        stompClientDisconnect = disconnect; // Save disconnect for cleanup

        connect(
            () => {
                console.log("STOMP Connected in NotificationContext for unread counts.");

                // Subscribe to the private queue for the current user
                privateSubscription = subscribe(`/user/queue/private`, (stompMessage) => {
                    // stompMessage is already a parsed object from socket.js
                    const msg = stompMessage;
                    const currentUserEmail = currentUserEmailRef.current;

                    // Check if the message is for the current user and if the user is currently NOT in that private chat
                    const isPrivateChatRoute = location.pathname.startsWith('/private/');
                    const currentRecipientEmail = location.pathname.split('/').pop(); // e.g., from /private/user@example.com

                    // Message is relevant if:
                    // 1. It's from someone else to the current user
                    // 2. And the current user is NOT actively chatting with that sender
                    if (msg.receiver === currentUserEmail && msg.sender !== currentUserEmail) {
                        if (!(isPrivateChatRoute && currentRecipientEmail === msg.sender)) {
                            incrementUnreadCount(msg.sender);
                            console.log(`Incremented unread count for ${msg.sender}. New count: ${unreadCounts[msg.sender] + 1 || 1}`);
                        } else {
                            // If in the chat, reset the count (or handle it in PrivateChat.jsx's useEffect)
                            // We'll handle this in PrivateChat.jsx for clarity
                            console.log(`Received message from ${msg.sender} while in chat, not incrementing unread count.`);
                        }
                    }
                });
            },
            (error) => {
                console.error("Failed to connect STOMP in NotificationContext:", error);
            }
        );

        // Cleanup function for useEffect
        return () => {
            if (privateSubscription) {
                privateSubscription.unsubscribe();
                console.log("Unsubscribed private queue in NotificationContext cleanup.");
            }
            if (stompClientDisconnect) {
                stompClientDisconnect();
                console.log("STOMP Disconnected in NotificationContext cleanup.");
            }
            setUnreadCounts({}); // Clear counts on unmount/logout
        };
    }, [location.pathname, incrementUnreadCount, unreadCounts]); // location.pathname to re-evaluate active chat

    return (
        <NotificationContext.Provider value={{ unreadCounts, incrementUnreadCount, resetUnreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    return useContext(NotificationContext);
};