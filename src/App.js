import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

// Set up socket connection to the server
const socket = io("https://your-render-backend.onrender.com", {
  transports: ["websocket", "polling"],
});

const App = () => {
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnections = useRef({});
  const [connectedUsers, setConnectedUsers] = useState([]);

  useEffect(() => {
    // Get the user's audio
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        localStreamRef.current.srcObject = stream;
        socket.emit("join-global"); // Notify the server

        // When a user connects
        socket.on("user-connected", (userId) => {
          console.log("New user connected: ", userId);
          const peerConnection = createPeerConnection(userId, stream);
          peerConnections.current[userId] = peerConnection;
        });

        // Handling received signals
        socket.on("signal", ({ signal, sender }) => {
          const peerConnection = peerConnections.current[sender];
          if (peerConnection) {
            console.log("Received signal from user", sender);
            peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
            if (signal.type === "offer") {
              peerConnection
                .createAnswer()
                .then((answer) => {
                  peerConnection.setLocalDescription(answer);
                  socket.emit("signal", {
                    signal: answer,
                    sender: socket.id,
                  });
                })
                .catch(console.error);
            } else if (signal.type === "answer") {
              peerConnection.setLocalDescription(signal);
            } else if (signal.type === "candidate") {
              peerConnection.addIceCandidate(new RTCIceCandidate(signal));
            }
          }
        });

        // Handling user disconnection
        socket.on("user-disconnected", (userId) => {
          if (peerConnections.current[userId]) {
            peerConnections.current[userId].close();
            delete peerConnections.current[userId];
          }
        });
      })
      .catch((err) => alert("Failed to access microphone: " + err.message));

    return () => {
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      socket.disconnect();
    };
  }, []);

  const createPeerConnection = (userId, stream) => {
    const peerConnection = new RTCPeerConnection();
    
    // Handling ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", event.candidate);
        socket.emit("signal", {
          signal: event.candidate,
          sender: socket.id,
        });
      }
    };

    // Handling incoming media streams
    peerConnection.ontrack = (event) => {
      console.log("Receiving stream from", userId);
      remoteStreamRef.current.srcObject = event.streams[0];
    };

    // Add the local stream tracks to the peer connection
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    // Creating and sending an offer to start the connection
    peerConnection
      .createOffer()
      .then((offer) => {
        peerConnection.setLocalDescription(offer);
        socket.emit("signal", {
          signal: offer,
          sender: socket.id,
        });
      })
      .catch(console.error);

    return peerConnection;
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Global Audio Chat</h1>
      <div className="flex space-x-4">
        <audio ref={localStreamRef} autoPlay muted className="w-48" />
        <audio ref={remoteStreamRef} autoPlay controls className="w-48" />
      </div>
    </div>
  );
};

export default App;
