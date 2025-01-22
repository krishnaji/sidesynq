// /my-llm-app/frontend/src/components/ChatWindow.jsx
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import Draggable from 'react-draggable';
import MessageList from './MessageList';
import InputArea from './InputArea';

const ChatWindow = forwardRef(({
  messages,
  onSendMessage,
  isLoading,
  geminiLive,
  onStartRecording,
  onStopRecording,
  isRecordingAudio,
  isRecordingVideo,
  isCameraActive,
  systemInstruction,
  responseModality
}, ref) => {
  const messagesEndRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const cameraPreviewRef = useRef(null);
  const [isVideoPreviewVisible, setIsVideoPreviewVisible] = useState(false);
  const [isCameraPreviewVisible, setIsCameraPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setIsVideoPreviewVisible(isRecordingVideo);
    setIsCameraPreviewVisible(isCameraActive);
  }, [isRecordingVideo, isCameraActive]);

  useImperativeHandle(ref, () => ({
    get videoPreviewRef() {
      return videoPreviewRef;
    },
    get cameraPreviewRef() {
      return cameraPreviewRef;
    },
  }));

  return (
    <div className="container mx-auto p-4 flex flex-col h-screen relative">
      <div
        className="overflow-auto mb-4 flex-grow"
        style={{ maxHeight: 'calc(100vh - 120px)' }}
      >
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      {isVideoPreviewVisible && (
        <Draggable
          nodeRef={videoPreviewRef}
          position={previewPosition}
          onStop={(e, data) => {
            setPreviewPosition({ x: data.x, y: data.y });
          }}
        >
          <div
            className="absolute bottom-4 right-4 z-10 border-2 border-gray-500 rounded-md overflow-hidden cursor-move"
            style={{ width: '320px', height: '240px' }}
          >
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              className="w-full h-full"
            />
          </div>
        </Draggable>
      )}

      {isCameraPreviewVisible && (
        <Draggable
          nodeRef={cameraPreviewRef}
          position={previewPosition}
          onStop={(e, data) => {
            setPreviewPosition({ x: data.x, y: data.y });
          }}
        >
          <div
            className="absolute bottom-4 right-4 z-10 border-2 border-gray-500 rounded-md overflow-hidden cursor-move"
            style={{ width: '320px', height: '240px' }}
          >
            <video
              ref={cameraPreviewRef}
              autoPlay
              playsInline
              className="w-full h-full"
            />
          </div>
        </Draggable>
      )}

      <InputArea
        onSendMessage={onSendMessage}
        geminiLive={geminiLive}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        isRecordingAudio={isRecordingAudio}
        isRecordingVideo={isRecordingVideo}
        isCameraActive={isCameraActive}
        responseModality={responseModality}
      />
    </div>
  );
});

export default ChatWindow;
