import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import connectSocket from '../api/socket';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { getToken } from '../utils/token';
import '../styles/ChatApp.css';

const ChatRoom = memo(() => {
    const [stompClientMethods, setStompClientMethods] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [usernameMap, setUsernameMap] = useState({});
    const usernameMapRef = useRef(usernameMap);
    useEffect(() => {
        usernameMapRef.current = usernameMap;
    }, [usernameMap]);
    const currentUserEmailRef = useRef("Anonymous");
    const tokenRef = useRef(getToken());
    const generateTempId = useCallback(() => `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, []);
    const publicSubscriptionRef = useRef(null);
    const socket = useRef(null); // Ref to hold the socket instance

    const sendMessage = useCallback((messageContent) => {
        if (stompClientMethods?.send && isConnected) {
            const senderEmail = currentUserEmailRef.current;
            const tempId = generateTempId();
            const optimisticMessage = { id: tempId, sender: senderEmail, senderUsername: usernameMapRef.current[senderEmail] || senderEmail.split('@')[0], receiver: null, content: messageContent, timestamp: new Date().toISOString(), type: "CHAT", isOptimistic: true };
            setMessages((prev) => [...prev, optimisticMessage]);
            console.log("SENDER: Optimistic message sent with temp ID:", tempId);
            stompClientMethods.send("/app/chat.sendMessage", { tempId: tempId, sender: senderEmail, content: messageContent, type: "CHAT", receiver: null });
        } else {
            console.warn("Cannot send message: STOMP client not connected or methods not initialized.");
        }
    }, [stompClientMethods?.send, isConnected, generateTempId]);

    useEffect(() => {
        console.log("ChatRoom useEffect mounted");
        socket.current = connectSocket();

        const initializeChat = async () => {
            const token = tokenRef.current;
            if (!token) {
                console.error("No authentication token found. Please log in.");
                return;
            }
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                currentUserEmailRef.current = payload.sub;
            } catch (e) {
                console.error("Error decoding token in ChatRoom.jsx:", e);
                return;
            }
            const currentUserEmail = currentUserEmailRef.current;

            try {
                const updatedMap = await fetchUsernamesInternal(token);
                await fetchPublicChatHistoryInternal(token, updatedMap);

                // Connect and *then* set up subscriptions and send initial messages
                socket.current.connect(
                    () => { // onConnect
                        setStompClientMethods(socket.current);
                        setIsConnected(true);
                        console.log("Connected to chat room via STOMP (Singleton)");

                        if (!publicSubscriptionRef.current) {
                            publicSubscriptionRef.current = socket.current.subscribe("/topic/public", (stompMessage) => {
                                let msg;
                                try {
                                    if (typeof stompMessage === 'object' && stompMessage !== null) {
                                        msg = stompMessage;
                                    } else {
                                        console.error("Received non-object STOMP message:", stompMessage);
                                        return;
                                    }
                                } catch (e) {
                                    console.error("Error processing STOMP message:", e);
                                    return;
                                }

                                const latestUsernameMap = usernameMapRef.current;
                                const receivedMessage = {
                                    ...msg,
                                    senderUsername: latestUsernameMap[msg.sender] || msg.sender.split('@')[0],
                                    receiverUsername: msg.receiver ? (latestUsernameMap[msg.receiver] || msg.receiver.split('@')[0]) : null
                                };

                                setMessages((prevMessages) => {
                                    const optimisticIndex = prevMessages.findIndex(m => m.isOptimistic && m.content === receivedMessage.content && m.sender === receivedMessage.sender);
                                    if (optimisticIndex !== -1) {
                                        const updatedMessages = [...prevMessages];
                                        updatedMessages[optimisticIndex] = { ...receivedMessage, isOptimistic: false };
                                        console.log(`PUBLIC CHAT: Replaced optimistic message with server message. Server ID: ${receivedMessage.id}, Temp ID: ${prevMessages[optimisticIndex].id}`);
                                        return updatedMessages;
                                    } else {
                                        const isDuplicate = prevMessages.some(m => m.id === receivedMessage.id);
                                        if (!isDuplicate) {
                                            console.log(`PUBLIC CHAT: Adding new server message with ID: ${receivedMessage.id}, Type: ${receivedMessage.type}`);
                                            return [...prevMessages, receivedMessage];
                                        } else {
                                            console.warn(`PUBLIC CHAT: Duplicate server message received with ID: ${receivedMessage.id}. Skipping.`);
                                            return prevMessages;
                                        }
                                    }
                                });
                            });
                        }
                        socket.current.send("/app/chat.addUser", { sender: currentUserEmail, type: "JOIN" });

                    },
                    (error) => { // onError
                        console.error("Failed to connect to STOMP:", error);
                        setIsConnected(false);
                        setStompClientMethods(null);
                    }
                );


            } catch (error) {
                console.error("Error during chat initialization:", error);
            }
        };

        initializeChat();

        return () => {
            console.log("ChatRoom useEffect unmounted");
            if (publicSubscriptionRef.current) {
                publicSubscriptionRef.current.unsubscribe();
                publicSubscriptionRef.current = null; // Reset the ref
            }
            socket.current?.disconnect(); // Use optional chaining
            console.log("ChatRoom useEffect cleanup executed (Singleton Disconnect)");
        };
    }, [generateTempId]);

    const fetchUsernamesInternal = async (token) => {
        try {
            const response = await fetch('http://localhost:8081/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const users = await response.json();
                const map = {};
                users.forEach(user => { map[user.email] = user.username; });
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

    const fetchPublicChatHistoryInternal = async (token, latestMapForHistory) => {
        console.log("Attempting to fetch public chat history...");
        try {
            const response = await fetch('http://localhost:8081/api/messages/public', { headers: { 'Authorization': `Bearer ${token}` } });
            console.log("Public chat history fetch response received:", response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let historyMessages = await response.json();
            historyMessages = historyMessages.map(msg => ({ ...msg, senderUsername: latestMapForHistory[msg.sender] || msg.sender.split('@')[0], receiverUsername: msg.receiver ? (latestMapForHistory[msg.receiver] || msg.receiver.split('@')[0]) : null }));
            const uniqueHistoryMessages = historyMessages.filter((msg, index, self) => !msg.id || index === self.findIndex((t) => t.id === msg.id));
            setMessages(uniqueHistoryMessages);
            console.log("Set unique public chat history. Total messages:", uniqueHistoryMessages.length);
        } catch (error) {
            console.error("Error fetching public chat history:", error);
        }
    };

    return (
        <div className="container chat-container mt-5 p-4 rounded shadow-lg">
            <h2 className="text-center mb-4 chat-header">Public Chat</h2>
            {!isConnected && <p className="text-danger text-center">Connecting to chat server...</p>}
            {isConnected && <p className="text-success text-center">Connected!</p>}
            <MessageList messages={messages} currentUserEmail={currentUserEmailRef.current} usernameMap={usernameMap} />
            <MessageInput onSend={sendMessage} disabled={!isConnected} />
            
        </div>
    );
});

export default ChatRoom;
