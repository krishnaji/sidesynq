// /my-llm-app/frontend/src/components/PeriodicTextButton.jsx
import React, { useState, useRef, useEffect } from 'react';

function PeriodicTextButton({ onSendMessage }) {
  const [isActive, setIsActive] = useState(false);
  const [customText, setCustomText] = useState("nudge");
  const [frequency, setFrequency] = useState(5); // Default frequency in seconds
  const intervalRef = useRef(null);
  const [showModal, setShowModal] = useState(false);

  const startSending = () => {
        // Clear any existing interval
        clearInterval(intervalRef.current);
    
        // Start a new interval
        intervalRef.current = setInterval(() => {
          onSendMessage(customText);
        }, frequency * 1000);
      };

  const handleStart = () => {
    setIsActive(true);
    startSending();
  };

  const handleStop = () => {
    setIsActive(false);
    clearInterval(intervalRef.current);
  };

  const handleTextChange = (event) => {
    setCustomText(event.target.value);
  };

  const handleFrequencyChange = (event) => {
    setFrequency(parseInt(event.target.value, 10));
  };

  const handleDone = () => {
    setShowModal(false);
    setIsActive(true);
    startSending();
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current); // Cleanup on unmount
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={isActive ? handleStop : () => setShowModal(true)} // Open modal on click when inactive
        className={`p-2 rounded-full ${
          isActive ? 'bg-yellow-500' : 'bg-gray-400'
        } hover:bg-yellow-600 text-white`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"  
          stroke="currentColor"
          className="w-6 h-6"  
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
          <text
            x="12"
            y="14"
            fontSize="6"
            fill="currentColor"
            textAnchor="middle"
            dominantBaseline="middle" 
          >
            T
          </text>
        </svg>
      </button>

      {/* Modal for Customization */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Customize Periodic Text
            </h3>
            <div className="mt-2">
              <label htmlFor="custom-text" className="block text-sm font-medium text-gray-700">
                Text:
              </label>
              <input
                type="text"
                id="custom-text"
                value={customText}
                onChange={handleTextChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
                Frequency (seconds):
              </label>
              <input
                type="number"
                id="frequency"
                min="1"
                value={frequency}
                onChange={handleFrequencyChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleDone}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PeriodicTextButton;