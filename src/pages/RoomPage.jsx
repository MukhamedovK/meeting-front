import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaVideo,
  FaMicrophoneAltSlash,
  FaVideoSlash,
  FaPhoneSlash,
  FaInfoCircle,
} from "react-icons/fa";
import { MdMic, MdMicOff } from "react-icons/md";
import io from "socket.io-client";
import { IoChatboxEllipses } from "react-icons/io5";

// Function to get the current time and date (only hours and minutes)
const getCurrentTimeAndDate = () => {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const currentDate = new Date().toLocaleDateString(undefined, options);
  const currentTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { currentDate, currentTime };
};

const RoomPage = () => {
  const { roomId } = useParams();
  const [timeAndDate, setTimeAndDate] = useState(getCurrentTimeAndDate());
  const [message, setMessage] = useState("");
  const [isMicOn, setIsMicOn] = useState(true); // State to control microphone
  const [isCameraOn, setIsCameraOn] = useState(true); // State to control camera
  const [participants, setParticipants] = useState([]); // State to store participants
  const socket = io("http://localhost:5000"); // Assuming your backend API is running on port 5000
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit("join-room", roomId); // Join the room with the provided ID

    // Listen for updates to participants
    socket.on("update-participants", (newParticipants) => {
      setParticipants(newParticipants);
    });

    // Update time every minute
    const intervalId = setInterval(() => {
      setTimeAndDate(getCurrentTimeAndDate());
    }, 60000);

    // Clean up the interval and leave the room when the component unmounts
    return () => {
      clearInterval(intervalId);
      socket.emit("leave-room", roomId);
    };
  }, [roomId, socket]);

  // Handle message sending
  const sendMessage = () => {
    if (message) {
      socket.emit("send-message", { roomId, message });
      setMessage(""); // Clear message input after sending
    }
  };

  // Toggle Mic state
  const toggleMic = () => {
    setIsMicOn((prev) => !prev);
  };

  // Toggle Camera state
  const toggleCamera = () => {
    setIsCameraOn((prev) => !prev);
  };

  // Handle ending the chat
  const endChat = () => {
    // Logic to handle chat ending (e.g., leaving room, stopping streams)
    socket.emit("leave-room", roomId);
    navigate("/"); // Redirect to home after ending the chat
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-sky-50">
      <img
        src="https://static-00.iconduck.com/assets.00/profile-circle-icon-2048x2048-cqe5466q.png" // Placeholder image URL
        alt="Profile"
        className="size-48 rounded-full mb-6"
      />

      {/* Bottom Bar */}
      <div className="fixed bottom-0 w-full py-4 px-6 sm:px-10 bg-gradient-to-b from-cyan-500 to-blue-500 gap-5 flex justify-between items-center">
        {/* Time and Room ID */}
        <div className="flex gap-2 text-sm sm:text-lg font-semibold text-white">
          {/* Info Icon for Modal */}
          <button
            onClick={() => document.getElementById("my_modal_1").showModal()}
            className="text-white btn btn-icon rounded-full bg-gray-700 hover:bg-gray-600"
          >
            <FaInfoCircle className="text-xl" />
          </button>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2 sm:gap-5 items-center">
          {/* Microphone Button */}
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

          {/* Camera Button */}
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

          {/* End Chat Button */}
          <button
            onClick={endChat}
            className="btn btn-icon rounded-full px-6 bg-red-600 hover:bg-red-500"
          >
            <FaPhoneSlash className="text-xl text-white" />
          </button>
        </div>

        {/* Chat Button */}
        <button className="btn btn-icon rounded-full bg-gray-700 hover:bg-gray-600">
          <IoChatboxEllipses className="text-white text-xl" />
        </button>
      </div>

      {/* Modal for Room Info */}
      <dialog id="my_modal_1" className="modal p-0">
        <div className="modal-box w-full max-w-lg rounded-lg bg-white shadow-lg border border-gray-200 p-6">
          <h3 className="font-bold text-2xl text-gray-800 mb-4">
            Room Information
          </h3>
          <div className="text-sm text-gray-600 mb-4">
            <p>
              <span className="font-semibold">Room ID:</span> {roomId}
            </p>
            <p className="mt-2">
              <span className="font-semibold">Generated Link: </span>
              <a
                href={`https://meeting-front-kappa.vercel.app/room/${roomId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 transition-colors"
              >
                {`https://meeting-front-kappa.vercel.app/room/${roomId}`}
              </a>
            </p>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            <p className="font-semibold">Participants:</p>
            <ul className="list-disc list-inside space-y-1">
              {participants.length > 0 ? (
                participants.map((participant, index) => (
                  <li key={index} className="text-gray-700">
                    {participant}
                  </li>
                ))
              ) : (
                <li className="text-gray-500">No participants yet.</li>
              )}
            </ul>
          </div>

          <div className="modal-action flex justify-end">
            <form method="dialog">
            <button className="btn px-7 text-white  bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full py-2 focus:outline-none">
              Close
            </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default RoomPage;
