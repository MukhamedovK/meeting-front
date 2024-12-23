import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserAlt, FaClock, FaLink, FaSignInAlt } from "react-icons/fa";

const getCurrentTimeAndDate = () => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const currentDate = new Date().toLocaleDateString(undefined, options);
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return { currentDate, currentTime };
};

const HomePage = () => {
  const [roomLink, setRoomLink] = useState('');
  const [timeAndDate, setTimeAndDate] = useState(getCurrentTimeAndDate());
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinRoomLink, setJoinRoomLink] = useState('');
  const history = useNavigate();

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeAndDate(getCurrentTimeAndDate());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const generateRoomLink = () => {
    const roomId = Math.random().toString(36).substring(2, 10); 
    setRoomLink(roomId);
    history(`/room/${roomId}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (joinRoomLink) {
      history(`/room/${joinRoomLink}`);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-sky-50">
      
      {/* Navbar */}
      <nav className="flex justify-between items-center w-full p-4 bg-gradient-to-b from-cyan-500 to-blue-500 text-white shadow-lg rounded-b-lg">
        <div className="flex items-center space-x-4">
          
          <div className="text-sm">
            <div className="font-semibold">{timeAndDate.currentDate}</div>
            <div className="flex items-center space-x-2">
              <FaClock />
              <span>{timeAndDate.currentTime}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
        <img
            src="https://i.pravatar.cc/50"
            alt="Profile"
            className="w-12 h-12 rounded-full"
          />
        </div>
      </nav>

      {/* Main content */}
      <div className="text-center mt-20 flex w-[95%] md:w-2/5 flex-col px-4">
        <h1 className="md:text-4xl text-2xl font-semibold mb-6">Conference Chat</h1>

        {!showJoinInput && (
          <div className="flex gap-[2%] w-full items-center mb-6">
            <button
              onClick={generateRoomLink}
              className="btn flex items-center w-[48%] gap-2 px-2 md:px-4 py-2 bg-gradient-to-l from-cyan-500 via-blue-400 to-cyan-500 text-white rounded-lg hover:bg-blue-700 hover:scale-105 transition duration-300"
            >
              <FaLink />
              Create Room
            </button>

            <button
              onClick={() => setShowJoinInput(true)}
              className="btn flex items-center w-[48%] gap-2 px-2 md:px-4 py-3 bg-transparent border-2 border-cyan-500 hover:bg-gradient-to-l rounded-lg from-cyan-500 via-blue-400 to-cyan-500 hover:scale-105 text-slate-600 hover:border-transparent hover:text-white transition duration-300"
            >
              <FaSignInAlt />
              Join Room
            </button>
          </div>
        )}

        {showJoinInput && (
          <div className="flex flex-col gap-4 items-center mb-6">
            <div className="w-full max-w-md">
              <input
                type="text"
                value={joinRoomLink}
                onChange={(e) => setJoinRoomLink(e.target.value)}
                placeholder="Enter Room Link"
                className="input input-bordered w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <button
              onClick={handleJoinRoom}
              className="btn flex items-center gap-2 px-6 py-2 bg-gradient-to-l from-cyan-500 via-blue-400 to-cyan-500 text-white rounded-lg hover:scale-105 transition duration-300"
            >
              <FaSignInAlt />
              Join Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
