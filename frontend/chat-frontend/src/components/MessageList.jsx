// src/components/MessageList.jsx
import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble'; // Import the new component
import '../styles/ChatApp.css'; // Import the main CSS file

const MessageList = ({ messages, currentUserEmail, usernameMap }) => { // Pass currentUserEmail and usernameMap
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]); // Scroll to bottom whenever messages change

    return (
        <div className="message-container mb-3"> {/* This is the scrollable container */}
            {messages.length === 0 && (
                <p className="text-muted text-center pt-3">No messages yet. Start a conversation!</p>
            )}
            {messages.map((msg) => (
                <MessageBubble 
                    key={msg.id || `temp-${msg.timestamp}-${msg.sender}-${msg.content}`} // Fallback key for optimistic messages
                    message={msg} 
                    isSender={msg.sender === currentUserEmail}
                    usernameMap={usernameMap} // Pass the username map
                />
            ))}
            <div ref={messagesEndRef} /> {/* Dummy div to scroll to */}
        </div>
    );
};

export default MessageList;