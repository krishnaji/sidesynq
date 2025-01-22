// /my-llm-app/frontend/src/components/SystemInstruction.jsx
import React, { useState, useEffect, useRef } from 'react';

function SystemInstruction({ systemInstruction, onUpdateSystemInstruction }) {
  const [isMinimized, setIsMinimized] = useState(true);
  const [editedInstruction, setEditedInstruction] = useState(systemInstruction);
  const [isEditing, setIsEditing] = useState(false);
  const [responseModality, setResponseModality] = useState("TEXT"); // Add state for response modality
  const textareaRef = useRef(null);

  useEffect(() => {
    setEditedInstruction(systemInstruction);
  }, [systemInstruction]);

  const handleToggleMinimize = () => {
    if (!isMinimized) {
      // Treat maximizing as "Save"
      onUpdateSystemInstruction(editedInstruction, responseModality); // Pass response modality
      setIsEditing(false); // Stop editing when minimizing
    } else {
      setIsEditing(true); // Start editing when maximizing
    }
    setIsMinimized(!isMinimized);
  };

  const handleChange = (event) => {
    setEditedInstruction(event.target.value);
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div className="mb-4 p-4 relative">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={handleToggleMinimize}
      >
        <h2 className="text-lg font-bold flex items-center">
          <span
            className={`mr-2 transition-transform duration-300 ${
              isMinimized ? 'rotate-0' : 'rotate-180'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </span>
          System Instructions
        </h2>
      </div>
      {!isMinimized && (
        <div className="mt-2">
          <textarea
            ref={textareaRef}
            value={editedInstruction}
            onChange={handleChange}
            className="border p-2 rounded-md w-full text-black"
            placeholder="Enter system instructions..."
          />
          {/* Add a dropdown for response modality */}
          <div className="mt-2">
            <label htmlFor="response-modality" className="block text-sm font-medium text-gray-700">
              Response Modality:
            </label>
            <select
              id="response-modality"
              value={responseModality}
              onChange={(e) => setResponseModality(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
            >
              <option value="TEXT">Text</option>
              <option value="AUDIO">Audio</option>
            </select>
          </div>
          {/* Note for the user */}
          <p className="text-sm text-gray-500 mt-1">
            Minimize to make changes effective.
          </p>
        </div>
      )}
    </div>
  );
}

export default SystemInstruction;
