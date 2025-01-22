// /my-llm-app/frontend/src/components/Message.jsx
import React from 'react';

function Message({ message }) {
  return (
    <div
      className={`p-3 rounded-md mb-2 ${
        message.sender === 'user' ? 'bg-blue-200' : 'bg-gray-200'
      }`}
    >
      <p className="text-base">
        <span className="font-bold">
          {message.sender === 'user' ? 'You: ' : 'SideSynq: '}
        </span>
        {message.text}
      </p>
    </div>
  );
}

export default Message;