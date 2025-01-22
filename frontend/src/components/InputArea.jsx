// /my-llm-app/frontend/src/components/InputArea.jsx
import React, { useState, useRef } from 'react';
import TextInput from './TextInput';
import RunButton from './RunButton';
import AudioInput from './AudioInput';
import VideoInput from './VideoInput';
import PeriodicTextButton from './PeriodicTextButton';
import CameraInput from './CameraInput';

function InputArea({
  onSendMessage,
  geminiLive,
  onStartRecording,
  onStopRecording,
  isRecordingAudio,
  isRecordingVideo,
  isCameraActive,
  responseModality
}) {
  const [inputText, setInputText] = useState('');
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const cameraRef = useRef(null);

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  const handleAudioStart = () => {
    onStartRecording('audio');
  };

  const handleAudioStop = () => {
    onStopRecording('audio');
  };

  const handleVideoStart = () => {
    onStartRecording('video');
  };

  const handleVideoStop = () => {
    onStopRecording('video');
  };

  const handleCameraStart = () => {
    onStartRecording('camera');
  };

  const handleCameraStop = () => {
    onStopRecording('camera');
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      onSendMessage(inputText, responseModality); // Pass response modality
      setInputText('');
    }
  };

  // Handler for PeriodicTextButton (separate from the main handleSendMessage)
  const handlePeriodicSend = (message) => {
    onSendMessage(message);
  };

  return (
    <div className="flex items-center p-4 bg-gray-200 rounded-lg space-x-1">
      <AudioInput
        onStart={handleAudioStart}
        onStop={handleAudioStop}
        isRecording={isRecordingAudio}
        ref={audioRef}
        geminiLive={geminiLive}
      />
      <CameraInput
        onStart={handleCameraStart}
        onStop={handleCameraStop}
        isRecording={isCameraActive}
        ref={cameraRef}
      />
      <VideoInput
        onStart={handleVideoStart}
        onStop={handleVideoStop}
        isRecording={isRecordingVideo}
        ref={videoRef}
        geminiLive={geminiLive}
      />
      <PeriodicTextButton onSendMessage={handlePeriodicSend} /> {/* Pass the specific handler */}
      <TextInput
        onSendMessage={handleSendMessage}
        inputText={inputText}
        handleInputChange={handleInputChange}
      />
      <RunButton onSendMessage={handleSendMessage} text={inputText} />
    </div>
  );
}

export default InputArea;
