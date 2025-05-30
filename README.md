This is simple chatapp using
Backend - jdk 21 , maven for build ,  springboot 3.5.0 , spring security , jwt token authentication and autherization , spring jpa , mysql , firebase (for push notification) , websockets , storm.js. 
Frontend - Reactjs vite , bootstrap , css  , websocket , socket.js , firebase , axios for api call.

For configuration of firebase -
   IMPORTANT: Get YOUR Firebase Project configuration from Firebase Console:
   Go to Project settings (gear icon) -> General -> Your apps -> Select your Web app -> Firebase SDK snippet -> Config
   add this configuration in firebase.js file under utils 
   and also same it as in firebase-messaging-sw.js
   Add your firebase administrator json file in under resources folder in backend and add it path in apllication.properities.

And add your database name and password in the application.properities in springboot backend . 
