// /my-llm-app/frontend/src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import SystemInstruction from './components/SystemInstruction';
import AudioPlayer from './components/AudioPlayer';
import { AudioStreamer } from './lib/audio-streamer';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geminiLive, setGeminiLive] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [mediaHandler, setMediaHandler] = useState(null);
  const [systemInstruction, setSystemInstruction] = useState(
    "You will receive real-time audio, video and text from the user. Ask relevant questions about the content being displayed, provide insightful commentary, identify key elements, and summarize information. Be concise and engaging in your responses. If video or audio input is not available, act as a helpful chat assistant."
  );
  const [audioQueue, setAudioQueue] = useState([]);
  const [responseModality, setResponseModality] = useState("TEXT");
  const [audioContext] = useState(new AudioContext());
  const [audioStreamer] = useState(
    () => new AudioStreamer(audioContext, () => {}),
  );
  // State for camera
  const [isCameraActive, setIsCameraActive] = useState(false);
  const chatWindowRef = useRef(null);

  // Refs for passing to MediaHandler
  let videoPreviewRef = useRef(null);
  let cameraPreviewRef = useRef(null);

  const handleUpdateSystemInstruction = useCallback(
    async (newInstruction, newResponseModality) => {
      setSystemInstruction(newInstruction);
      setResponseModality(newResponseModality); // Update response modality
      setMessages([]); // Clear messages (optional)

      // Close the existing WebSocket connection if it exists
      if (geminiLive) {
        geminiLive.close();
        setGeminiLive(null);
      }
    },
    [geminiLive]
  );

  const initializeWebSocket = useCallback(() => {
    const ws = new WebSocket("ws://localhost:8000/live");

    ws.onopen = () => {
      console.log("WebSocket connected!");
      setGeminiLive(ws);
      setError(null);

      // Send initial system instruction
      ws.send(
        JSON.stringify({
          setup: {
            system_instruction: systemInstruction,
            response_modality: responseModality,
          },
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const receivedData = JSON.parse(event.data);
        console.log("Message received from server:", receivedData);

        if (receivedData.text && receivedData.sender) {
          setMessages((prevMessages) => [...prevMessages, receivedData]);
        } else if (receivedData.audio && receivedData.sender) {
          // Decode the base64 audio data directly to an ArrayBuffer
          const audioBytes = atob(receivedData.audio);
          const audioBuffer = new Uint8Array(audioBytes.length);
          for (let i = 0; i < audioBytes.length; i++) {
            audioBuffer[i] = audioBytes.charCodeAt(i);
          }

          // Add the audio to the audioStreamer
          audioStreamer.addPCM16(audioBuffer);
          audioStreamer.resume();
        } else if (receivedData.error) {
          console.error("Error from server:", receivedData.error);
          setError(receivedData.error.message || "An error occurred.");
        } else if (receivedData.interrupted) {
          // Stop the audio streamer when an interruption is detected
          audioStreamer.stop();
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };


    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error.');
      setGeminiLive(null);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setGeminiLive(null);
    };

    return ws;
  }, [systemInstruction, responseModality, audioStreamer]);

  useEffect(() => {
    const ws = initializeWebSocket();

    // Dynamically import and initialize MediaHandler
    import('./components/MediaHandler').then((module) => {
      const MediaHandlerClass = module.MediaHandler;
      const handler = new MediaHandlerClass();
      setMediaHandler(handler);

      if (chatWindowRef.current) {
        handler.setVideoPreviewRef(chatWindowRef.current.videoPreviewRef);
        handler.setCameraPreviewRef(chatWindowRef.current.cameraPreviewRef);
      }
    });

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [initializeWebSocket]);

  useEffect(() => {
    const handleAudioStreamerComplete = () => {
      // Handle any actions needed when audio playback is complete
      console.log("Audio playback completed");
      // For example, you can reset the audio queue or update the UI
      setAudioQueue([]); // Clear the audio queue if needed
    };

    if (audioStreamer) {
      audioStreamer.onComplete = handleAudioStreamerComplete;
    }

    return () => {
      if (audioStreamer) {
        audioStreamer.onComplete = () => {}; // Remove the listener
      }
    };
  }, [audioStreamer]);

  const handleSendMessage = useCallback(
    async (message) => {
      setIsLoading(true);
      setError(null);

      if (typeof message === "string") {
        const newUserMessage = {
          id: Date.now(),
          text: message,
          sender: "user",
          audio: null,
          video: null,
        };
        setMessages((prevMessages) => [...prevMessages, newUserMessage]);

        // Send text message
        if (geminiLive && geminiLive.readyState === WebSocket.OPEN) {
          // No need to send a special flag.
          geminiLive.send(JSON.stringify({ text: message }));
        } else {
          console.error("WebSocket is not open. Message not sent.");
          setError("WebSocket connection is not open. Please try again later.");
        }
      }

      setIsLoading(false);
    },
    [geminiLive],
  );

  const handleStartRecording = useCallback(
    async (type) => {
      if (mediaHandler) {
        try {
          if (type === "audio") {
            setIsRecordingAudio(true);
            await mediaHandler.startAudioRecording();
            mediaHandler.on("audioData", (base64Data) => {
              if (geminiLive && geminiLive.readyState === WebSocket.OPEN) {
                // No need to send a special flag.
                geminiLive.send(
                  JSON.stringify({
                    realtime_input: {
                      media_chunks: [
                        { mime_type: "audio/pcm", data: base64Data },
                      ],
                    },
                  }),
                );
              }
            });
          }else if (type === 'video') {
            setIsRecordingVideo(true);
            await mediaHandler.startScreenShare();
            mediaHandler.on('videoFrame', (base64Image) => {
              if (geminiLive && geminiLive.readyState === WebSocket.OPEN) {
                geminiLive.send(
                  JSON.stringify({
                    realtime_input: {
                      media_chunks: [
                        { mime_type: 'image/jpeg', data: base64Image },
                      ],
                    },
                  })
                );
              }
            });
            mediaHandler.on('audioData', (base64Data) => {
              if (geminiLive && geminiLive.readyState === WebSocket.OPEN) {
                geminiLive.send(
                  JSON.stringify({
                    realtime_input: {
                      media_chunks: [
                        { mime_type: 'audio/pcm', data: base64Data },
                      ],
                    },
                  })
                );
              }
            });
          } else if (type === 'camera') {
            setIsCameraActive(true);
            await mediaHandler.startCamera();
            mediaHandler.on('videoFrame', (base64Image) => {
              if (geminiLive && geminiLive.readyState === WebSocket.OPEN) {
                geminiLive.send(
                  JSON.stringify({
                    realtime_input: {
                      media_chunks: [
                        { mime_type: 'image/jpeg', data: base64Image },
                      ],
                    },
                  })
                );
              }
            });
          }
        } catch (error) {
          console.error(`Error starting ${type} recording:`, error);
          setError(`Error starting ${type} recording.`);
        }
      }
    },
    [geminiLive, mediaHandler]
  );

  const handleStopRecording = useCallback(
    async (type) => {
      if (mediaHandler) {
        try {
          if (type === 'audio') {
            setIsRecordingAudio(false);
            mediaHandler.stopAudioRecording();
            mediaHandler.off('audioData');
          } else if (type === 'video') {
            setIsRecordingVideo(false);
            mediaHandler.stopScreenShare();
            mediaHandler.off('videoFrame');
            mediaHandler.off('audioData');
          } else if (type === 'camera') {
            setIsCameraActive(false);
            mediaHandler.stopCamera();
            mediaHandler.off('videoFrame');
          }

          if (geminiLive && geminiLive.readyState === WebSocket.OPEN) {
            geminiLive.send(JSON.stringify({ turn_complete: true }));
          }
        } catch (error) {
          console.error(`Error stopping ${type} recording:`, error);
          setError(`Error stopping ${type} recording.`);
        }
      }
    },
    [geminiLive, mediaHandler]
  );

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow overflow-hidden">
        <SystemInstruction
          systemInstruction={systemInstruction}
          onUpdateSystemInstruction={handleUpdateSystemInstruction}
        />
        <ChatWindow
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          geminiLive={geminiLive}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          isRecordingAudio={isRecordingAudio}
          isRecordingVideo={isRecordingVideo}
          isCameraActive={isCameraActive}
          systemInstruction={systemInstruction}
          responseModality={responseModality}
          ref={chatWindowRef}
        />
      </div>
      {error && (
        <div className="bg-red-500 text-white p-4">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default App;
