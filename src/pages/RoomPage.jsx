import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("https://meeting-server-kv18.onrender.com");

const RoomPage = () => {
  const { roomId } = useParams();
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnections = useRef({});

  useEffect(() => {
    // Get user media
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        localStreamRef.current.srcObject = stream;

        // Notify server to join room
        socket.emit("join-room", roomId);

        socket.on("user-joined", (userId) => {
          const peerConnection = createPeerConnection(userId, stream);
          peerConnections.current[userId] = peerConnection;
        });

        socket.on("signal", ({ signal, sender }) => {
          const peerConnection = peerConnections.current[sender];
          if (peerConnection) {
            peerConnection.setRemoteDescription(
              new RTCSessionDescription(signal)
            );
            if (signal.type === "offer") {
              peerConnection
                .createAnswer()
                .then((answer) => {
                  peerConnection.setLocalDescription(answer);
                  socket.emit("signal", {
                    roomId,
                    signal: answer,
                    sender: socket.id,
                  });
                })
                .catch((error) => console.error(error));
            }
          }
        });
      });

    return () => {
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      socket.disconnect();
    };
  }, [roomId]);

  const createPeerConnection = (userId, stream) => {
    const peerConnection = new RTCPeerConnection();

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", {
          roomId,
          signal: event.candidate,
          sender: socket.id,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      remoteStreamRef.current.srcObject = event.streams[0];
    };

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    peerConnection
      .createOffer()
      .then((offer) => {
        peerConnection.setLocalDescription(offer);
        socket.emit("signal", {
          roomId,
          signal: offer,
          sender: socket.id,
        });
      })
      .catch((error) => console.error(error));

    return peerConnection;
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-xl font-bold mb-4">Room: {roomId}</h1>
      <div className="flex space-x-4">
        <audio ref={localStreamRef} autoPlay muted className="w-48" />
        <audio ref={remoteStreamRef} autoPlay className="w-48" />
      </div>
    </div>
  );
};

export default RoomPage;
