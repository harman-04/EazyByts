import React, { useState } from 'react';
import '../styles/ChatApp.css'; // Import the main CSS file

const MessageInput = ({ onSend, disabled }) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim()) {
            onSend(message);
            setMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="d-flex message-input-area"> {/* Added message-input-area class */}
            <input
                className="form-control me-2"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message"
                disabled={disabled}
            />
            <button className="btn btn-primary" onClick={handleSend} disabled={disabled}>
                <i className="bi bi-send-fill me-1"></i> Send {/* Added Bootstrap Icon */}
            </button>
        </div>
    );
};

export default MessageInput;