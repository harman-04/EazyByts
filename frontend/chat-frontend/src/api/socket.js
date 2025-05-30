// src/api/socket.js
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { getToken } from '../utils/token';
let socketInstance = null; // Singleton instance
const connectSocket = () => {
    const token = getToken();

    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const sockJsSocketFactory = () => {
        return new SockJS("http://localhost:8081/ws");
    };
    const stompClient = Stomp.over(sockJsSocketFactory);

    stompClient.debug = (str) => {
        // console.log(str); // Uncomment this line to see detailed STOMP logs
    };

    console.log("connectSocket() called. Existing instance:", socketInstance);

    if (!socketInstance) {
        socketInstance = { client: stompClient, };
        console.log("connectSocket() created new instance:", socketInstance);
    }
    return {
        client: stompClient,
        connect: (onConnectCallback, onErrorCallback) => {
            stompClient.connect(
                headers,
                (frame) => {
                    console.log('STOMP Connected:', frame);
                    onConnectCallback();
                },
                (error) => {
                    console.error('STOMP Connection Error:', error);
                    onErrorCallback(error);
                }
            );
        },
        disconnect: () => {
            if (stompClient && stompClient.connected) {
                stompClient.disconnect(() => {
                    console.log("STOMP Disconnected");
                });
            }
        },
        subscribe: (topic, callback) => {
            if (!stompClient.connected) {
                console.warn(`STOMP client not connected. Cannot subscribe to ${topic}.`);
                return { unsubscribe: () => {} };
            }
            return stompClient.subscribe(topic, (message) => {
                try {
                    const parsedBody = JSON.parse(message.body);
                    if (typeof parsedBody === 'object' && parsedBody !== null) {
                        callback(parsedBody); // Pass the parsed object
                    } else {
                        console.error("STOMP message body is not a valid JSON object:", message.body);
                    }
                } catch (e) {
                    console.error("Failed to parse message body as JSON:", message.body, e);
                }
            });
        },
        send: (destination, body) => {
            if (stompClient && stompClient.connected) {
                stompClient.send(destination, {}, JSON.stringify(body));
            } else {
                console.warn(`STOMP client not connected. Message to ${destination} not sent. Body:`, body);
            }
        }
    };
};

export default connectSocket;