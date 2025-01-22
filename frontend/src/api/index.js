// /my-llm-app/frontend/src/api/index.js
import axios from 'axios';

export async function generateResponse(text, audioBlob, videoBlob) {
  try {
    const formData = new FormData();
    formData.append('text', text);

    if (audioBlob) {
      formData.append('audio', audioBlob, 'audio.webm');
    }

    if (videoBlob) {
      formData.append('video', videoBlob, 'video.webm');
    }

    const response = await axios.post('/api/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.text;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error; // Re-throw the error to be handled in the component
  }
}