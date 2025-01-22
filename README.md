
# SideSynq: Your Real-Time Gemini Based Multimodal AI Assistant

SideSynq is a web application built to demonstrate the power of Google's Gemini multimodal large language model (LLM) API. It allows you to interact with an AI assistant using text, audio, and video in real time. 

## Features

*   **Multimodal Input:** Send messages to the AI using text, audio (microphone), or video (camera and screen sharing).
*   **Flexible Output:** Receive responses in either text or audio format.
*   **Real-time Interaction:** Experience a dynamic and responsive conversation flow thanks to the WebSocket-based communication.
*   **Context-Aware AI:** Provide system instructions to guide the AI's behavior and responses, making it a more tailored assistant.
*   **Periodic Text Input:** Send a predefined text message at regular intervals with the customizable "nudge" button.
*   **Note-Taking:** Instruct the AI to take notes for you while you're sharing your screen or a video.

![](sidesynq.jpg)

## Tech Stack

### Frontend

*   **React:** JavaScript library for building user interfaces.
*   **Tailwind CSS:** Utility-first CSS framework for rapid UI development.
*   **Vite:** Fast frontend build tool.
*   **Axios:** Promise-based HTTP client for making API requests.
*   **react-draggable:** For making elements draggable within the UI (used for the video preview).
*   **WebSockets:** For real-time, bidirectional communication between the frontend and backend.

### Backend

*   **FastAPI:** Modern, high-performance web framework for building APIs with Python.
*   **Uvicorn:** ASGI server for running the FastAPI application.
*   **python-dotenv:** For managing environment variables (like API keys).
*   **websockets:** Python library for WebSocket communication.
*   **Google Cloud AI Platform:** Provides access to the Gemini multimodal LLM API.
*   **Google Auth:** For authenticating with Google Cloud services.

## Prerequisites

*   **Node.js and npm:** For managing frontend dependencies and running the development server.
*   **Python 3.8+:** For running the backend server.
*   **Google Cloud Account:** You'll need a Google Cloud project with the AI Platform API enabled.
*   **Gemini API Credentials:** Obtain API credentials and set up authentication for your Google Cloud project.
*   **Environment Variables:** Create a `.env` file in the `backend` directory and add your Google Cloud project ID and Gemini model ID:

```
PROJECT_ID=your-gcp-project-id
MODEL_ID=your-gemini-model-id
```

## Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd <repository-name>
```

2. **Install frontend dependencies:**

```bash
cd frontend
npm install
```

3. **Install backend dependencies:**

```bash
cd ../backend
pip install -r requirements.txt
```

## Running the Application

1. **Start the backend server:**

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

2. **Start the frontend development server:**

```bash
cd ../frontend
npm run dev
```

3. **Access the application:**

Open your web browser and go to `http://localhost:5173` (or the port specified by the Vite development server).

## Usage

1. **System Instructions:**
    *   Click on the "System Instructions" header to expand the section.
    *   Enter your desired instructions to guide the AI's behavior.
    *   Choose the "Response Modality" (Text or Audio).
    *   Minimize the section to apply the changes.

2. **Input Modalities:**
    *   **Text:** Type your message in the input box and press Enter or click the "Run" button.
    *   **Audio:** Click the microphone icon to start recording. Click it again to stop and send the audio.
    *   **Camera:** Click the camera icon to activate your webcam. Click it again to stop.
    *   **Video:** Click the video icon to start screen sharing. A pop-up will allow you to choose what to share. Click the icon again to stop.
    *   **Periodic Text:** Click the "T" icon to configure a periodic text message. Enter the text and frequency (in seconds) in the modal. Click "Done" to start. Click the icon again to stop sending.


 
