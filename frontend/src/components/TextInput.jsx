// /my-llm-app/frontend/src/components/TextInput.jsx
import React from 'react';

function TextInput({ onSendMessage, inputText, handleInputChange }) {
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      onSendMessage(inputText);
      handleInputChange({ target: { value: '' } }); // Clear the input
    }
  };

  return (
    <input
      type="text"
      value={inputText}
      onChange={handleInputChange}
      onKeyPress={handleKeyPress}
      className="border p-2 rounded-md flex-grow mr-2"
      placeholder="Type your message here..."
    />
  );
}

export default TextInput;