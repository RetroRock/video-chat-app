import 'firebase/firestore';
require('dotenv').config();

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID
  };

  const servers = {
      iceServers: [
          {
              urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
          }
      ],
      iceCandidatePoolSize: 10
  }

  export {
      firebaseConfig,
      servers
  }