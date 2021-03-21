import firebase from 'firebase';
import React from 'react';
import './App.css';
import Main from './components/Main';
import { servers } from './config';
import { firebaseConfig } from './firebaseconfig'

interface PCCONTEXTInterface {
  pc: RTCPeerConnection;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  firestore: firebase.firestore.Firestore;
}
export const PCCONTEXT = React.createContext<PCCONTEXTInterface>(undefined as any);
function App() {
  const pc = new RTCPeerConnection(servers);
  let localStream = null;
  let remoteStream = null;

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const firestore = firebase.firestore();

  return (
    <div className="App">
      <PCCONTEXT.Provider value={{ pc, localStream, remoteStream, firestore }}>
        <Main />
      </PCCONTEXT.Provider>
    </div>
  );
}

export default App;


