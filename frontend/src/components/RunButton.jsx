// /my-llm-app/frontend/src/components/RunButton.jsx
import React from 'react';

function RunButton({ onSendMessage, text }) {
  const handleClick = () => {
    onSendMessage(text);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-full"
    >
      {/* Sparkle Icon */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="24" height="24">
        <path d="M12 6.5C12 2.36 15.36 -1 20.5 -1C15.36 -1 12 -5.64 
        12 -11C12 -5.64 8.64 -1 3.5 -1C8.64 -1 12 2.36 12 
        6.5Z" fill="#e8eaed" transform="translate(0, 12)"/>
      </svg>
      Run
    </button>
  );
}

export default RunButton;