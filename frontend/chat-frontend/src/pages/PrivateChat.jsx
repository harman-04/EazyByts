// src/pages/PrivateChat.jsx

import React, { useEffect, useState, useCallback, useRef } from 'react';
import connectSocket from '../api/socket';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { getToken } from '../utils/token';
import { useParams } from 'react-router-dom';
import '../styles/ChatApp.css'; // Import the main CSS file


const PrivateChat = () => {
    const { recipientEmail } = useParams();
    const [stompClientMethods, setStompClientMethods] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [usernameMap, setUsernameMap] = useState({}); // State to store email-to-username mapping

    // Ref to hold the latest usernameMap for callbacks that don't re-render the effect
    const usernameMapRef = useRef(usernameMap);
    // Update the ref whenever the usernameMap state changes
    useEffect(() => {
        usernameMapRef.current = usernameMap;
    }, [usernameMap]); // This useEffect only updates the ref, not re-triggers the main chat logic

    const currentUserEmailRef = useRef("Anonymous");
    const tokenRef = useRef(getToken());


    const generateTempId = useCallback(() => `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, []);

    const sendMessage = useCallback((messageContent) => {
        if (stompClientMethods && stompClientMethods.send && isConnected) {
            const senderEmail = currentUserEmailRef.current;
            const receiverEmail = recipientEmail;

            const latestUsernameMap = usernameMapRef.current; // Use the ref for the latest map

            const optimisticMessage = {
                id: generateTempId(), // Assign a temporary ID for optimistic update
                sender: senderEmail,
                senderUsername: latestUsernameMap[senderEmail] || senderEmail.split('@')[0], // Add senderUsername
                receiver: receiverEmail,
                receiverUsername: latestUsernameMap[receiverEmail] || receiverEmail.split('@')[0], // Add receiverUsername
                content: messageContent,
                timestamp: new Date().toISOString(), // Use ISO string for consistency
                type: "CHAT"
            };

            // Optimistically add the message to the local state for immediate display
            setMessages((prev) => [...prev, optimisticMessage]);

            stompClientMethods.send("/app/send-message", {
                sender: senderEmail,
                receiver: receiverEmail,
                content: messageContent,
                type: "CHAT"
            });
        } else {
            console.warn("Cannot send message: STOMP client not connected or methods not initialized.");
        }
    }, [stompClientMethods, isConnected, recipientEmail, generateTempId]);


    useEffect(() => {
        const { client, connect, disconnect, subscribe, send } = connectSocket();
        setStompClientMethods({ client, disconnect, send });

        const token = tokenRef.current;
        if (!token) {
            console.error("No authentication token found. Please log in.");
            return; // Exit early if no token
        }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserEmailRef.current = payload.sub;
        } catch (e) {
            console.error("Error decoding token in PrivateChat.jsx:", e);
            return; // Exit early if token is invalid
        }
        const currentUserEmail = currentUserEmailRef.current;


        let privateSubscription;

        // --- Move functions inside useEffect ---
        const fetchUsernamesInternal = async () => {
            try {
                const response = await fetch('http://localhost:8081/api/users', { 
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const users = await response.json();
                    const map = {};
                    users.forEach(user => {
                        map[user.email] = user.username;
                    });
                    setUsernameMap(map); // This updates state, but won't re-trigger this effect
                    return map; // Return the map for immediate use in history fetch
                } else {
                    console.error("Failed to fetch users for username mapping:", response.status, response.statusText);
                    return {}; // Return empty map on failure
                }
            } catch (error) {
                console.error("Error fetching users for username mapping:", error);
                return {}; // Return empty map on error
            }
        };

        const fetchChatHistoryInternal = async (latestMapForHistory) => { // Accepts the latest map
            console.log("Attempting to fetch private chat history...");
            try {
                const response = await fetch(`/api/messages/private?user1=${currentUserEmail}&user2=${recipientEmail}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log("Private chat history fetch response received:", response);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                let historyMessages = await response.json();
                // Map usernames to messages from history using the passed map
                historyMessages = historyMessages.map(msg => ({
                    ...msg,
                    senderUsername: latestMapForHistory[msg.sender] || msg.sender.split('@')[0],
                    receiverUsername: msg.receiver ? (latestMapForHistory[msg.receiver] || msg.receiver.split('@')[0]) : null
                }));
                
                // Ensure unique messages and update state
                const uniqueHistoryMessages = historyMessages.filter((msg, index, self) =>
                    msg.id && index === self.findIndex((t) => t.id === msg.id)
                );
                setMessages(uniqueHistoryMessages);
                console.log("Fetched private chat history:", uniqueHistoryMessages);
            } catch (error) {
                console.error("Error fetching private chat history:", error);
            }
        };

        // Main initialization sequence
        const initializeChatAndConnect = async () => {
            try {
                // Fetch usernames first, then chat history using the returned map
                const updatedMap = await fetchUsernamesInternal();
                await fetchChatHistoryInternal(updatedMap);

                // --- Connect to STOMP and subscribe for real-time messages ---
                connect(
                    () => {
                        setIsConnected(true);
                        console.log(`Connected for private chat with ${recipientEmail}`);

                        // Subscribe to the private queue for the current user
                        // Ensure the backend sends private messages to `/user/{userId}/queue/private`
                        privateSubscription = subscribe(`/user/queue/private`, (stompMessage) => {
                            // stompMessage is ALREADY A PARSED OBJECT from socket.js
                            const msg = stompMessage; // Use it directly

                            // Filter out messages not relevant to the *current* private chat based on recipient
                            // This is crucial because `/user/queue/private` delivers messages to the user
                            // regardless of which private chat they are currently viewing.
                            if (!((msg.sender === recipientEmail && msg.receiver === currentUserEmail) ||
                                  (msg.sender === currentUserEmail && msg.receiver === recipientEmail))) {
                                console.log("Received private message not for this specific chat, ignoring:", msg);
                                return;
                            }

                            // Use the current value of usernameMap from state (or ref if preferred for very dynamic changes)
                            const latestUsernameMapForRealtime = usernameMapRef.current; // Use the ref for latest map
                            const messageToAdd = {
                                ...msg,
                                id: msg.id || generateTempId(), // Ensure message has an ID
                                senderUsername: latestUsernameMapForRealtime[msg.sender] || msg.sender.split('@')[0],
                                receiverUsername: msg.receiver ? (latestUsernameMapForRealtime[msg.receiver] || msg.receiver.split('@')[0]) : null
                            };

                            setMessages((prev) => {
                                const existingIndex = prev.findIndex(m =>
                                    (messageToAdd.id && m.id === messageToAdd.id) || // Match by server-assigned ID
                                    (m.sender === messageToAdd.sender &&
                                     m.content === messageToAdd.content &&
                                     m.id.startsWith('temp-')) // Match optimistic message by content and temp prefix
                                );

                                if (existingIndex > -1) {
                                    const updatedMessages = [...prev];
                                    updatedMessages[existingIndex] = messageToAdd;
                                    return updatedMessages;
                                } else {
                                    return [...prev, messageToAdd];
                                }
                            });
                        });
                    },
                    (error) => {
                        console.error("Failed to connect for private chat:", error);
                        setIsConnected(false);
                    }
                );
            } catch (error) {
                console.error("Error during private chat initialization or STOMP connection:", error);
                setIsConnected(false);
            }
        };

        initializeChatAndConnect();


        // Cleanup function for useEffect
        return () => {
            if (privateSubscription) {
                privateSubscription.unsubscribe();
            }
            disconnect();
            console.log("PrivateChat useEffect cleanup executed.");
        };
    }, [recipientEmail, generateTempId]); // Dependencies: recipientEmail and generateTempId (stable useCallback)
                                      // usernameMap is explicitly NOT a dependency here to prevent loop


    return (
        <div className="container chat-container mt-5 p-4 rounded shadow-lg">
            <h2 className="text-center mb-4 chat-header">Chat with {usernameMap[recipientEmail] || recipientEmail.split('@')[0]}</h2>
            {!isConnected && <p className="text-danger text-center">Connecting to chat server...</p>}
            {isConnected && <p className="text-success text-center">Connected!</p>}
            <MessageList messages={messages} currentUserEmail={currentUserEmailRef.current} usernameMap={usernameMap} />
            <MessageInput onSend={sendMessage} disabled={!isConnected} />
        </div>
    );
};

export default PrivateChat;