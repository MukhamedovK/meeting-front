import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaVideo, FaVideoSlash, FaPhoneSlash } from "react-icons/fa";
import { MdMic, MdMicOff } from "react-icons/md";
import io from "socket.io-client";

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [participants, setParticipants] = useState([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io(`${process.env.REACT_APP_API_URL}`);

    socket.current.emit("join-room", roomId);

    socket.current.on("update-participants", (newParticipants) => {
      setParticipants(newParticipants);
    });

    setupWebRTC();

    return () => {
      socket.current.emit("leave-room", roomId);
      socket.current.disconnect();
    };
  }, [roomId]);

  const setupWebRTC = () => {
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnectionRef.current.ontrack = (event) => {
      if (!remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject = new MediaStream();
      }
      event.streams[0].getTracks().forEach((track) => {
        remoteVideoRef.current.srcObject.addTrack(track);
      });
    };

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        const recipient = participants.find((id) => id !== socket.current.id);
        if (recipient) {
          socket.current.emit("signal", {
            signal: { candidate: event.candidate },
            recipient,
          });
        }
      }
    };

    navigator.mediaDevices
      .getUserMedia({ video: isCameraOn, audio: isMicOn })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        stream
          .getTracks()
          .forEach((track) =>
            peerConnectionRef.current.addTrack(track, stream)
          );

        socket.current.on("signal", ({ signal, sender }) => {
          if (signal.offer) {
            peerConnectionRef.current
              .setRemoteDescription(new RTCSessionDescription(signal.offer))
              .then(() => peerConnectionRef.current.createAnswer())
              .then((answer) => {
                peerConnectionRef.current.setLocalDescription(answer);
                socket.current.emit("signal", {
                  signal: { answer },
                  recipient: sender,
                });
              });
          } else if (signal.answer) {
            peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(signal.answer)
            );
          } else if (signal.candidate) {
            peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(signal.candidate)
            );
          }
        });

        peerConnectionRef.current.createOffer().then((offer) => {
          peerConnectionRef.current.setLocalDescription(offer);
          const recipient = participants.find((id) => id !== socket.current.id);
          if (recipient) {
            socket.current.emit("signal", {
              signal: { offer },
              recipient,
            });
          }
        });
      })
      .catch((err) => console.error("Error accessing media devices.", err));
  };

  const toggleMic = () => {
    const stream = localVideoRef.current.srcObject;
    const audioTrack = stream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setIsMicOn(audioTrack.enabled);
  };

  const toggleCamera = () => {
    const stream = localVideoRef.current.srcObject;
    const videoTrack = stream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraOn(videoTrack.enabled);
  };

  const endChat = () => {
    socket.current.emit("leave-room", roomId);
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-sky-50">
      <video
        ref={localVideoRef}
        autoPlay
        muted
        className="w-1/3 rounded-lg mb-4"
      />
      <video ref={remoteVideoRef} autoPlay className="w-1/3 rounded-lg" />

      <div className="fixed bottom-0 w-full py-4 px-6 sm:px-10 bg-gradient-to-b from-cyan-500 to-blue-500 gap-5 flex justify-between items-center">
        <div className="flex gap-2 sm:gap-5 items-center">
          <button
            onClick={toggleMic}
            className="btn btn-icon rounded-full bg-gray-700 hover:bg-gray-600"
          >
            {isMicOn ? (
              <MdMic className="text-2xl text-white" />
            ) : (
              <MdMicOff className="text-2xl text-white" />
            )}
          </button>

          <button
            onClick={toggleCamera}
            className="btn btn-icon rounded-full bg-gray-700 hover:bg-gray-600"
          >
            {isCameraOn ? (
              <FaVideo className="text-xl text-white" />
            ) : (
              <FaVideoSlash className="text-xl text-white" />
            )}
          </button>

          <button
            onClick={endChat}
            className="btn btn-icon rounded-full px-6 bg-red-600 hover:bg-red-500"
          >
            <FaPhoneSlash className="text-xl text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
