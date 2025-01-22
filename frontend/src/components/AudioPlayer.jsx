import React, { useState, useEffect, useRef } from "react";

function AudioPlayer({ audioData, mimeType, onEnded }) {
  const audioRef = useRef(null);
  const [audioContext] = useState(new AudioContext());

  useEffect(() => {
    return () => {
      audioContext.close();
    };
  }, []);

  const handlePlay = async () => {
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    if (audioData && mimeType) {
      try {
        const audioBuffer = await audioContext.decodeAudioData(audioData);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        source.addEventListener("ended", handleEnded);
        audioRef.current = source;
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }
  };

  const handleEnded = () => {
    if (onEnded) {
      onEnded();
    }
    audioRef.current = null;
  };

  return (
    <div>
      <button onClick={handlePlay}>Play Audio</button>
    </div>
  );
}

export default AudioPlayer;
