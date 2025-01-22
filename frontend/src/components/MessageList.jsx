// /my-llm-app/frontend/src/components/MessageList.jsx
import React from 'react';
import Message from './Message';

function MessageList({ messages }) {
  return (
    <div className="mb-4">
      {messages.length > 0 && messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  );
}

export default MessageList;