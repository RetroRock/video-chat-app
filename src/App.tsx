import firebase from 'firebase';
import React, { useRef, useState } from 'react';
import './App.scss';
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

  const [user, setUser] = useState<firebase.User | null>(null);

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const auth = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();
  const firestore = firebase.firestore();

  const signIn = () => auth.signInWithPopup(provider);
  const signOut = () => auth.signOut();

  auth.onAuthStateChanged(user => {
    if (user) {
      setUser(user);
    } else {
      setUser(null)
    }
  })

  return (
    <div className="App">
      {user ?
        <section id="whenSignedIn">
          <h4>Hello, {user.displayName} 👌</h4>
          <button id="signOutBtn" onClick={signOut}>Sign out</button>
          <PCCONTEXT.Provider value={{ pc, localStream, remoteStream, firestore }}>
            <Main />
          </PCCONTEXT.Provider>
        </section>
        :
        <section id="whenSignedOut">
          <button id="signInBtn" onClick={signIn}>Sign in with Google</button>
        </section>
      }
    </div>
  );
}

export default App;


