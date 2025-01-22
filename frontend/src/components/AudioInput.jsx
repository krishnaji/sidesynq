// /my-llm-app/frontend/src/components/AudioInput.jsx
import React, { forwardRef, useImperativeHandle } from 'react';

const AudioInput = forwardRef(
  ({ onStart, onStop, isRecording }, ref) => {
    const startRecording = () => {
      onStart();
    };

    const stopRecording = () => {
      onStop();
    };

    useImperativeHandle(ref, () => ({
      startRecording,
      stopRecording,
    }));

    return (
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`p-2 rounded-full ${
          isRecording ? 'bg-red-500' : 'bg-gray-400'
        } hover:bg-red-600 text-white`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
          />
        </svg>
      </button>
    );
  }
);

export default AudioInput;