import React, { useState, useEffect, useCallback } from 'react'
import { PCCONTEXT } from '../App';
import 'firebase/firestore';
import './Main.scss';

import CallIcon from '../icons/CallIcon';
import CopyIcon from '../icons/CopyIcon';
import ShareIcon from '../icons/ShareIcon';
import WebcamIcon from '../icons/WebcamIcon';

function Main() {
    let { pc, localStream, remoteStream, firestore } = React.useContext(PCCONTEXT);
    const webcamVideoRef = React.useRef<HTMLVideoElement>(null);
    const remoteVideoRef = React.useRef<HTMLVideoElement>(null);
    const callInputRef = React.useRef<HTMLInputElement>(null);

    const [callID, setCallID] = useState<string | null>(null);

    useEffect(() => {
        const run = async () => {
            await getWebcamAccess();
            new URLSearchParams(window.location.search).get("callId") && await answerCall();
        };
        run();
    }, [])

    // 1. Setup media sources
    async function getWebcamAccess() {
        console.log("hell")
        localStream = await navigator.mediaDevices.getUserMedia({ video: true });
        remoteStream = new MediaStream();

        // Push tracks from local stream to peer connection
        localStream.getTracks().forEach((track) => {
            pc.addTrack(track, (localStream as MediaStream));
        })

        // Pull tracks from remote stream, add to video stream
        pc.ontrack = event => {
            event.streams[0].getTracks().forEach(track => {
                (remoteStream as MediaStream).addTrack(track);
            })
        }

        (webcamVideoRef.current as HTMLVideoElement).srcObject = localStream;
        (remoteVideoRef.current as HTMLVideoElement).srcObject = remoteStream;
    }

    // 2. Create an offer
    async function call() {
        // Reference Firestore collection
        const callDoc = firestore.collection('calls').doc();
        const offerCandidates = callDoc.collection('offerCadidates');
        const answerCandidates = callDoc.collection('answerCandidates');
        console.log(callDoc);
        (callInputRef.current as HTMLInputElement).value = callDoc.id;
        setCallID(callDoc.id);

        // Get candidates for caller, save to db (has IP adress and port on it)
        pc.onicecandidate = event => {
            event.candidate && offerCandidates.add(event.candidate.toJSON());
        }

        // Create offer 
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);

        const offer = {
            sdp: offerDescription.sdp,  // Session description protocol
            type: offerDescription.type
        }

        await callDoc.set({ offer });

        // Listen for remote answer 
        callDoc.onSnapshot(snapshot => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.setRemoteDescription(answerDescription);
            }
        })

        // When answered, add candidate to peer connection
        answerCandidates.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data())
                    pc.addIceCandidate(candidate);
                }
            })
        })
    }

    // 3. Answer call with the unique ID
    async function answerCall() {
        const params = window.location.search;
        document.title = new URLSearchParams(params).get("callId") || "No call id";
        const callId = new URLSearchParams(params).get("callId") || (callInputRef.current as HTMLInputElement).value;
        const callDoc = firestore.collection('calls').doc(callId);
        const answerCandidates = callDoc.collection('answerCandidates');
        const offerCandidates = callDoc.collection('offerCandidates');

        pc.onicecandidate = event => {
            event.candidate && answerCandidates.add(event.candidate.toJSON());
        }

        const callData = (await callDoc.get()).data();
        if (!callData) return;

        const offerDescription = callData.offer;
        await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        const answer = {
            sdp: answerDescription.sdp,
            type: answerDescription.type
        }

        await callDoc.update({ answer });

        offerCandidates.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                console.log(change);
                if (change.type === 'added') {
                    const data = change.doc.data();
                    pc.addIceCandidate(new RTCIceCandidate(data));
                }
            })
        })
    }

    function invite() {
        if (!callID) {
            alert("No call ID!");
            return;
        }
        window.open(`mailto:?subject=Join my call&body=<a href="${window.location.origin}?callId=${callID}">Click here to join the call!</a>`)
        // <a href="mailto:email@address.com?subject=Hello world&body=Line one%0DLine two">Email me</a>
    }

    function copyToClipboard() {
        const copyText = (callInputRef.current as HTMLInputElement);

        // Select the text field 
        copyText.select();
        copyText.setSelectionRange(0, 99999); // For mobile devices 

        document.execCommand("copy");

        alert("Copied the text: " + copyText.value);
    }


    return (
        <div className="wrapper">
            <div className="video-feeds">
                <video id="webcamVideo" ref={webcamVideoRef} autoPlay playsInline></video>
                <video id="remoteVideo" ref={remoteVideoRef} autoPlay playsInline></video>
                {/* Just as placeholders */}
                {/* <iframe src="https://www.youtube.com/embed/5fCYwaESaL4?autoplay=1&mute=1&controls=0" allow="autoplay"></iframe>
                <iframe src="https://www.youtube.com/embed/BHACKCNDMW8?autoplay=1&mute=1&controls=0" allow="autoplay"></iframe> */}
            </div>
            <div className="controls">
                <div className="input-wrapper">
                    <input id="callInput" ref={callInputRef} type="text" />
                    <button id="copyButton" onClick={copyToClipboard}><CopyIcon /></button>
                </div>
                <button id="invite" onClick={invite}><ShareIcon /><span>Invite via E-Mail</span></button>
                <button id="webcamButton" onClick={getWebcamAccess}><WebcamIcon /><span>Start webcam</span></button>
                <div className="call">
                    <button id="callButton" onClick={call}><CallIcon /><span>Generate call ID</span></button>
                    <button id="answerButton" onClick={answerCall} ><CallIcon /><span>Answer call</span></button>
                </div>
                {/* <button id="hangupButton">Hangup</button> */}
            </div>
        </div>
    )
}

export default Main;
