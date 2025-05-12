// src/pages/ChatRoom.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import connectSocket from '../api/socket';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { getToken } from '../utils/token';
import '../styles/ChatApp.css'; // Import the main CSS file

const ChatRoom = () => {
    const [stompClientMethods, setStompClientMethods] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [usernameMap, setUsernameMap] = useState({}); // State to store email-to-username mapping

    // Ref to hold the latest usernameMap for callbacks that don't re-render the effect
    const usernameMapRef = useRef(usernameMap);
    // Update the ref whenever the usernameMap state changes
    useEffect(() => {
        usernameMapRef.current = usernameMap;
    }, [usernameMap]);

    const currentUserEmailRef = useRef("Anonymous");
    const tokenRef = useRef(getToken());

    const generateTempId = useCallback(() => `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, []);

    // sendMessage is still memoized as it's called by MessageInput
    const sendMessage = useCallback((messageContent) => {
        if (stompClientMethods && stompClientMethods.send && isConnected) {
            const senderEmail = currentUserEmailRef.current;

            const optimisticMessage = {
                id: generateTempId(), // This is a temporary client-generated ID
                sender: senderEmail,
                senderUsername: usernameMapRef.current[senderEmail] || senderEmail.split('@')[0], // Use ref here
                receiver: null,
                content: messageContent,
                timestamp: new Date().toISOString(),
                type: "CHAT"
            };
            setMessages((prev) => [...prev, optimisticMessage]);
            console.log("SENDER: Optimistic message added:", optimisticMessage.id);

            // Ensure the path is correct for your Spring @MessageMapping
            stompClientMethods.send("/app/chat.sendMessage", {
                sender: senderEmail,
                content: messageContent,
                type: "CHAT",
                receiver: null
            });
        } else {
            console.warn("Cannot send message: STOMP client not connected or methods not initialized.");
        }
    }, [stompClientMethods, isConnected, generateTempId]);

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
            console.error("Error decoding token in ChatRoom.jsx:", e);
            return; // Exit early if token is invalid
        }
        const currentUserEmail = currentUserEmailRef.current;

        let publicSubscription;

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
                    setUsernameMap(map);
                    return map;
                } else {
                    console.error("Failed to fetch users for username mapping:", response.status, response.statusText);
                    return {};
                }
            } catch (error) {
                console.error("Error fetching users for username mapping:", error);
                return {};
            }
        };

        const fetchPublicChatHistoryInternal = async (latestMapForHistory) => {
            console.log("Attempting to fetch public chat history...");
            try {
                // Corrected URL to point to your backend server directly
                const response = await fetch('http://localhost:8081/api/messages/public', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log("Public chat history fetch response received:", response);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                let historyMessages = await response.json();

                historyMessages = historyMessages.map(msg => ({
                    ...msg,
                    senderUsername: latestMapForHistory[msg.sender] || msg.sender.split('@')[0],
                    receiverUsername: msg.receiver ? (latestMapForHistory[msg.receiver] || msg.receiver.split('@')[0]) : null
                }));

                // Ensure initial history is unique by server-assigned ID
                const uniqueHistoryMessages = historyMessages.filter((msg, index, self) => {
                    if (!msg.id) {
                        console.warn("History message without ID:", msg);
                        return false; // Skip messages without a unique ID for proper deduplication
                    }
                    return index === self.findIndex((t) => t.id === msg.id);
                });

                setMessages(uniqueHistoryMessages);
                console.log("Set unique public chat history. Total messages:", uniqueHistoryMessages.length);
            } catch (error) {
                console.error("Error fetching public chat history:", error);
            }
        };

        const initializeChatAndConnect = async () => {
            try {
                const updatedMap = await fetchUsernamesInternal();
                await fetchPublicChatHistoryInternal(updatedMap);

                console.log("Chat data initialized. Connecting to STOMP...");

                connect(
                    () => {
                        setIsConnected(true);
                        console.log("Connected to chat room via STOMP");

                        publicSubscription = subscribe("/topic/public", (stompMessage) => {
                            let msg;
                            try {
                                if (typeof stompMessage === 'object' && stompMessage !== null) {
                                    msg = stompMessage;
                                } else {
                                    console.error("Received non-object STOMP message from socket.js:", stompMessage);
                                    return;
                                }
                            } catch (e) {
                                console.error("Error processing STOMP message:", e);
                                return;
                            }

                            // --- START: OPTIONAL: FILTER JOIN/LEAVE MESSAGES IF YOU DON'T WANT THEM DISPLAYED ---
                            // Uncomment the block below if you want to display JOIN/LEAVE messages.
                            /*
                            if (msg.type === "JOIN" || msg.type === "LEAVE") {
                                try {
                                    const joinInfo = JSON.parse(msg.content);
                                    if (joinInfo.username) {
                                        msg.content = `${joinInfo.username} has ${msg.type === "JOIN" ? "joined" : "left"} the chat.`;
                                        msg.senderUsername = joinInfo.username;
                                    } else {
                                        console.warn("JOIN/LEAVE message JSON content missing 'username':", msg.content);
                                        msg.content = msg.content || `${msg.sender} has ${msg.type === "JOIN" ? "joined" : "left"} the chat.`;
                                    }
                                } catch (parseError) {
                                    console.warn("Could not parse JOIN/LEAVE message content as JSON (unexpected format, fallback to original):", msg.content, parseError);
                                    msg.content = msg.content || `${msg.sender} has ${msg.type === "JOIN" ? "joined" : "left"} the chat.`;
                                }
                            }
                            */
                            // --- END: OPTIONAL FILTERING ---

                            const latestUsernameMap = usernameMapRef.current;

                            // Crucial: For messages received from the server, `msg.id` MUST be the unique, server-assigned ID.
                            // If `msg.id` is often null/undefined from the server, this is a backend issue.
                            const messageToAdd = {
                                ...msg,
                                id: msg.id || generateTempId(), // Fallback only if server `msg.id` is truly missing
                                senderUsername: latestUsernameMap[msg.sender] || msg.sender.split('@')[0],
                                receiverUsername: msg.receiver ? (latestUsernameMap[msg.receiver] || msg.receiver.split('@')[0]) : null
                            };

                            // Logic for sender seeing their own message twice (optimistic update merge)
                            if (messageToAdd.sender === currentUserEmail && messageToAdd.type === "CHAT") {
                                setMessages(prev => {
                                    const existingIndex = prev.findIndex(m => {
                                        // DEBUGGING: Log the type of m.id when iterating for sender's optimistic update
                                        if (m && m.id !== undefined) {
                                            console.log(`SENDER OPTIMISTIC: Checking existing msg ID: ${m.id}, Type: ${typeof m.id}`);
                                        }

                                        return (messageToAdd.id && m.id === messageToAdd.id) || // Match by server-assigned ID
                                               (m.sender === messageToAdd.sender &&
                                                m.content === messageToAdd.content &&
                                                (typeof m.id === 'string' && m.id.startsWith('temp-'))); // FIX: Ensure m.id is a string
                                    });

                                    if (existingIndex > -1) {
                                        const updatedMessages = [...prev];
                                        updatedMessages[existingIndex] = messageToAdd;
                                        console.log(`SENDER OPTIMISTIC: Merged optimistic message with server ID: ${messageToAdd.id}`);
                                        return updatedMessages;
                                    } else {
                                        console.log(`SENDER OPTIMISTIC: Added new server-broadcasted message with ID: ${messageToAdd.id} (no prior optimistic match found)`);
                                        return [...prev, messageToAdd];
                                    }
                                });
                            } else {
                                // This block is for messages received from the server (for all users, including the sender receiving their own server-confirmed message)
                                // and for non-CHAT messages (JOIN/LEAVE)

                                setMessages((prev) => {
                                    const messageId = messageToAdd.id;
                                    // DEBUGGING: Log for receiver side / non-optimistic messages
                                    console.log(`RECEIVER/SERVER BROADCAST: Incoming message ID: ${messageId}, Type: ${typeof messageId}, Content: "${messageToAdd.content.substring(0, 30)}..."`);

                                    // Check if a message with this exact ID (from server) is already in the list
                                    const isAlreadyPresent = prev.some(existingMsg => {
                                        // Only log if the IDs are potentially comparable to avoid excessive logs
                                        if (existingMsg.id && messageId) {
                                            console.log(`RECEIVER/SERVER BROADCAST: Comparing existing ID "${existingMsg.id}" with incoming ID "${messageId}". Match: ${existingMsg.id === messageId}`);
                                        }
                                        return existingMsg.id === messageId;
                                    });

                                    if (!isAlreadyPresent) {
                                        console.log(`RECEIVER/SERVER BROADCAST: Adding new message with ID: ${messageId}`);
                                        return [...prev, messageToAdd];
                                    } else {
                                        console.warn(`RECEIVER/SERVER BROADCAST: Message with ID "${messageId}" already present. Skipping add to avoid duplicates.`);
                                        return prev; // Return current state to avoid adding duplicate
                                    }
                                });
                            }
                        });

                        send("/app/chat.addUser", {
                            sender: currentUserEmail,
                            type: "JOIN"
                        });
                    },
                    (error) => {
                        console.error("Failed to connect to chat room:", error);
                        setIsConnected(false);
                    }
                );
            } catch (error) {
                console.error("Error during chat initialization or STOMP connection:", error);
                setIsConnected(false);
            }
        };

        initializeChatAndConnect();

        // Cleanup function
        return () => {
            if (publicSubscription) {
                publicSubscription.unsubscribe();
            }
            disconnect();
            console.log("ChatRoom useEffect cleanup executed");
        };
    }, [generateTempId]);

    return (
        <div className="container chat-container mt-5 p-4 rounded shadow-lg">
            <h2 className="text-center mb-4 chat-header">Public Chat</h2>
            {!isConnected && <p className="text-danger text-center">Connecting to chat server...</p>}
            {isConnected && <p className="text-success text-center">Connected!</p>}
            <MessageList messages={messages} currentUserEmail={currentUserEmailRef.current} usernameMap={usernameMap} />
            <MessageInput onSend={sendMessage} disabled={!isConnected} />
        </div>
    );
};

export default ChatRoom;