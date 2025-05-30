// import React, { useRef } from 'react';
// import moment from 'moment';
// import avatar1 from '../assets/avatar1.png';
// import avatar2 from '../assets/avatar2.png';
// import avatar3 from '../assets/avatar3.png';
// import avatar4 from '../assets/avatar4.png';

// const MessageBubble = ({ message, isSender }) => {
//     const { sender, content, type, timestamp, chatroomType } = message;
//     const isSystemMessage = type === 'JOIN' || type === 'LEAVE';

//     let messageContentToDisplay;
//     let senderUsernameForDisplay;

//     if (isSystemMessage) {
//         try {
//             const systemInfo = JSON.parse(content);
//             senderUsernameForDisplay = systemInfo.username || sender.split('@')[0];
//             const chatTypeString = chatroomType === 'private' ? 'private chat' : 'public chat';

//             if (type === 'JOIN') {
//                 messageContentToDisplay = `${senderUsernameForDisplay} has joined the ${chatTypeString}.`;
//             } else if (type === 'LEAVE') {
//                 messageContentToDisplay = `${senderUsernameForDisplay} has left the ${chatTypeString}.`;
//             }
//         } catch (e) {
//             console.error("Error parsing JOIN/LEAVE message content:", e, "Content:", content);
//             senderUsernameForDisplay =  sender.split('@')[0];
//             messageContentToDisplay = `${senderUsernameForDisplay} has ${type === 'JOIN' ? 'joined' : 'left'} the chat. (Error parsing message)`;
//         }
//     } else {
//         messageContentToDisplay = content;
//         senderUsernameForDisplay =  sender.split('@')[0];
//     }

//     const formattedTimestamp = moment(timestamp).format('h:mm A, MMM D');

//     // Array of avatar image paths
//     const avatarImages = [avatar1, avatar2, avatar3, avatar4];

//     // useRef to store avatar mapping
//     const avatarMapRef = useRef({});

//       // Get avatar for sender
//     const getAvatar = (senderEmail) => {
//         if (!avatarMapRef.current[senderEmail]) {
//             // Generate a random index for the sender if not already in map
//             const randomIndex = Math.floor(Math.random() * avatarImages.length);
//             avatarMapRef.current[senderEmail] = avatarImages[randomIndex];
//         }
//         return avatarMapRef.current[senderEmail];
//     };

//     const senderAvatar = getAvatar(sender);

//     return (
//         <div className={`message-bubble-wrapper d-flex ${isSender ? 'justify-content-end' : 'justify-content-start'}`}>
//             {!isSender && !isSystemMessage && (
//                 <img src={senderAvatar} alt="Avatar" className="message-avatar me-2" />
//             )}
//             <div className={`message-bubble 
//                             ${isSender ? 'sender-message' : 'receiver-message'} 
//                             ${isSystemMessage ? 'system-message' : ''}`}>
//                 {!isSystemMessage && (
//                     <div className="message-header">
//                         <strong className="message-username">{senderUsernameForDisplay}</strong>
//                     </div>
//                 )}
//                 <div className="message-content">{messageContentToDisplay}</div>
//                 <div className="message-footer text-end">
//                     <span className="message-timestamp">{formattedTimestamp}</span>
//                 </div>
//             </div>
//             {isSender && !isSystemMessage && (
//                 <img src={senderAvatar} alt="Avatar" className="message-avatar ms-2" />
//             )}
//         </div>
//     );
// };

// export default MessageBubble;

 // src/components/MessageBubble.jsx

import React from 'react';

import moment from 'moment'; // Remember to 'npm install moment' if you haven't

import defaultAvatar from '../assets/default-avatar.png'; // Path to your default avatar image

// import '../styles/MessageBubble.css'; // Ensure this import is present for your styles



const MessageBubble = ({ message, isSender, usernameMap }) => {

 const { sender, content, type, timestamp } = message;



// Determine if it's a system message (JOIN/LEAVE)

 const isSystemMessage = type === 'JOIN' || type === 'LEAVE';



 let messageContentToDisplay;

let senderUsernameForDisplay; // Will hold the username displayed in the header (if not system message) or in the content



 if (isSystemMessage) {
 try {

  const systemInfo = JSON.parse(content);

 // Prioritize username from the parsed JSON for JOIN/LEAVE messages

  senderUsernameForDisplay = systemInfo.username || sender.split('@')[0]; // Fallback to email part if username not found in JSON



 if (type === 'JOIN') {

   messageContentToDisplay = `${senderUsernameForDisplay} has joined the chat.`;

  } else if (type === 'LEAVE') {

  messageContentToDisplay = `${senderUsernameForDisplay} has left the chat.`;

  }

 } catch (e) {

 // Fallback if content is not valid JSON or problem parsing

 console.error("Error parsing JOIN/LEAVE message content (malformed JSON):", e, "Content:", content);

// Use existing displaySenderName logic as a last resort fallback

 senderUsernameForDisplay = message.senderUsername || (usernameMap && usernameMap[sender]) || sender.split('@')[0];

 messageContentToDisplay = `${senderUsernameForDisplay} has ${type === 'JOIN' ? 'joined' : 'left'} the chat. (Error parsing message)`;

 }

 } else {

 // For 'CHAT' messages and any other unknown types, display content directly

 messageContentToDisplay = content;

 // Use existing displaySenderName logic for chat messages

 senderUsernameForDisplay = message.senderUsername

|| (usernameMap && usernameMap[sender])

|| sender.split('@')[0];

 }



 const formattedTimestamp = moment(timestamp).format('h:mm A, MMM D');



return (

 <div className={`message-bubble-wrapper d-flex ${isSender ? 'justify-content-end' : 'justify-content-start'}`}>

 {/* Show avatar for receiver's chat messages, but not for system messages */}

 {!isSender && !isSystemMessage && (

 <img src={defaultAvatar} alt="Avatar" className="message-avatar me-2" />

 )}



 <div className={`message-bubble

${isSender ? 'sender-message' : 'receiver-message'}

${isSystemMessage ? 'system-message' : ''}`}> {/* Added system-message class */}


{/* Only show header (username) for non-system messages */}

{!isSystemMessage && (

 <div className="message-header">

 <strong className="message-username">{senderUsernameForDisplay}</strong>

 </div>

 )}



 {/* Use the conditionally prepared content here */}
 <div className="message-content">{messageContentToDisplay}</div>



 <div className="message-footer text-end">
<span className="message-timestamp">{formattedTimestamp}</span>

 </div>

 </div>



 {/* Show avatar for sender's chat messages, but not for system messages */}

 {isSender && !isSystemMessage && (

 <img src={defaultAvatar} alt="Avatar" className="message-avatar ms-2" />
 )}

 </div>

 );

};



export default MessageBubble;