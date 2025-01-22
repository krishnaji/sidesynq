# /my-llm-app/backend/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import os
from dotenv import load_dotenv
import google.auth
from google.auth.transport.requests import Request
from websockets import connect, ConnectionClosed
from typing import Dict, Any, Optional
import time

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSION_TIMEOUT = 60  # Seconds
RENEWAL_GRACE_PERIOD = 2  # Seconds before timeout to start renewal

class GeminiConnection:
    def __init__(self):
        self.project_id = os.getenv("PROJECT_ID")
        self.location = "us-central1"
        self.model_id = os.getenv("MODEL_ID")
        self.model = (
            f"projects/{self.project_id}/locations/{self.location}/publishers/google/models/{self.model_id}"
        )
        self.host = "us-central1-aiplatform.googleapis.com"
        self.service_url = (
            f"wss://{self.host}/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent"
        )
        self.ws = None
        self.setup_message = None
        self.session_start_time = None
        self.lock = asyncio.Lock()

    async def connect(self):
        creds, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        auth_req = Request()
        creds.refresh(auth_req)
        bearer_token = creds.token
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {bearer_token}",
        }

        try:
            self.ws = await connect(
                self.service_url,
                additional_headers=headers,
            )
            print("Connected to Gemini API")
            await self.send_setup_message()

            raw_response = await self.ws.recv()
            try:
                setup_response = json.loads(raw_response)
            except json.JSONDecodeError as e:
                print(f"Error decoding setup response: {e}")
                print(f"Setup response attempted to decode as ascii: {raw_response}")
                setup_response = {}
            print(f"Setup response: {setup_response}")

            self.session_start_time = time.time()
            self.connection_attempts = 0  # Reset attempts on successful connection
            return True
        except ConnectionClosed as e:
            print(
                f"Connection attempt {self.connection_attempts} failed: {e.code} , {e.reason}"
            )
            await asyncio.sleep(2 ** self.connection_attempts)
            return await self.connect()
        except Exception as e:
            print(f"Error connecting to Gemini API: {e}")
            return False

    async def send_setup_message(self):
        if self.ws and self.setup_message:
            print(f"Sending setup message: {self.setup_message}")
            await self.ws.send(json.dumps(self.setup_message))
            print("Sent setup message")
        else:
            print(
                "WebSocket is not connected or not open, or no setup message defined."
            )

    async def update_system_instruction(self, system_instruction: str, response_modality: str = "TEXT"):
        if response_modality == "AUDIO":
          self.setup_message = {
              "setup": {
                  "model": self.model,
                  "generation_config": {
                      "response_modalities": ["AUDIO"],
                      "speech_config": {
                          "voice_config": {"prebuilt_voice_config": {"voice_name": "puck"}}
                      },
                  },
                  "system_instruction": {"parts": [{"text": system_instruction}]},
              }
          }
        else:
          self.setup_message = {
              "setup": {
                  "model": self.model,
                  "generation_config": {"response_modalities": ["TEXT"]},
                  "system_instruction": {"parts": [{"text": system_instruction}]},
              }
          }
        if self.ws:
            await self.ws.close()
            self.ws = None

    async def send_message(self, message_content: Dict, websocket: WebSocket):
        async with self.lock:
            if self.ws:
                if "text" in message_content:
                    msg = {
                        "client_content": {
                            "turn_complete": True,
                            "turns": [
                                {"role": "user", "parts": [{"text": message_content["text"]}]}
                            ],
                        }
                    }
                    message = json.dumps(msg)
                    # print(f"Sending message to Gemini: {message}")
                    await self.ws.send(message)
                elif "realtime_input" in message_content:
                    message = json.dumps(message_content)
                    # print(f"Sending message to Gemini: {message}")
                    await self.ws.send(message)
                elif "end_message" in message_content:
                    msg = {"client_content": {"turn_complete": True}}
                    message = json.dumps(msg)
                    # print(f"Sending message to Gemini: {message}")
                    await self.ws.send(message)
            else:
                print("WebSocket is not connected or not open.")

    async def receive(self):
        if not self.ws:
            raise ConnectionClosed(code=1006, reason="Websocket is not open")
        return await self.ws.recv()

    async def close(self):
        if self.ws:
            await self.ws.close()
            self.ws = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
        if exc_type:
            print(f"An exception of type {exc_type} occurred: {exc_val}")
            if exc_tb:
                import traceback

                traceback.print_tb(exc_tb)
            return False  # Re-raise the exception
        return True

    def should_renew_session(self):
        if self.session_start_time is None or self.ws is None:
            return False

        elapsed_time = time.time() - self.session_start_time
        should_renew = elapsed_time >= (SESSION_TIMEOUT - RENEWAL_GRACE_PERIOD)
        return should_renew

    async def renew_session(self, system_instruction: str, response_modality: str = "TEXT"):
        print("Starting session renewal process...")

        # Keep reference to old connection
        old_ws = self.ws
        self.ws = None

        # Prepare the new session setup message for audio or text
        if response_modality == "AUDIO":
          new_setup_message = {
              "setup": {
                  "model": self.model,
                  "generation_config": {
                      "response_modalities": ["AUDIO"],
                      "speech_config": {
                          "voice_config": {"prebuilt_voice_config": {"voice_name": "puck"}}
                      },
                  },
                  "system_instruction": {"parts": [{"text": system_instruction}]},
              }
          }
        else:
          new_setup_message = {
              "setup": {
                  "model": self.model,
                  "generation_config": {"response_modalities": ["TEXT"]},
                  "system_instruction": {
                      "parts": [
                          {"text": system_instruction},
                      ]
                  },
              }
          }

        # Establish a new connection
        print("Establishing new connection...")
        self.setup_message = new_setup_message
        await self.connect()

        # Close the old session after the new one is established
        if old_ws:
            print("Closing old session...")
            try:
                await old_ws.close()
            except Exception as e:
                print(f"Error closing old session: {e}")

        print("Session renewal completed.")

@app.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print(f"Client connected")
    gemini = GeminiConnection()
    system_instruction = ""
    response_modality = "TEXT" # default
    try:
        while True:
            # Receive initial message from client
            initial_message = await websocket.receive_json()
            print(f"Received initial message from client: {initial_message}")

            # Process setup message
            if (
                "setup" in initial_message
                and "system_instruction" in initial_message["setup"]
            ):
                system_instruction = initial_message["setup"]["system_instruction"]
                response_modality = initial_message["setup"].get("response_modality", "TEXT") # Get response modality if available
                await gemini.update_system_instruction(system_instruction, response_modality)
                await gemini.connect()
            else:
                print("Invalid initial message or missing system instruction.")
                continue

            # Create tasks for receiving from client and Gemini
            receive_client_task = asyncio.create_task(
                receive_from_client(gemini, websocket)
            )
            receive_gemini_task = asyncio.create_task(
                receive_from_gemini(gemini, websocket, system_instruction, response_modality)
            )

            # Keep the connection alive until one of the tasks finishes
            done, pending = await asyncio.wait(
                [receive_client_task, receive_gemini_task],
                return_when=asyncio.FIRST_COMPLETED,
            )

            # Cancel the pending tasks
            for task in pending:
                task.cancel()

            # Check if the client has disconnected
            if receive_client_task in done:
                print("Client disconnected.")
                break

    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await gemini.close()
        print(f"Connection closed")

async def receive_from_client(gemini: GeminiConnection, websocket: WebSocket):
    audio_mode = False
    while True:
        try:
            message = await websocket.receive_json()
            # print(f"Received from client: {message}")
            if "setup" in message:
              if "response_modality" in message["setup"]:
                if message["setup"]["response_modality"] == "AUDIO":
                  audio_mode = True
                else:
                  audio_mode = False
            # No need to check for user_turn_started
            await gemini.send_message(message, websocket)

        except WebSocketDisconnect:
            print("Client disconnected.")
            break
        except Exception as e:
            print(f"Error receiving from client: {e}")
            break

async def receive_from_gemini(
    gemini: GeminiConnection, websocket: WebSocket, system_instruction, response_modality
):
    current_response_id = None
    accumulated_text = ""
    accumulated_audio = b""  # Initialize an empty bytes object for audio data
    current_mime_type = None
    audio_mode = response_modality == "AUDIO"

    while True:
        try:
            if gemini.should_renew_session():
                print("Session due for renewal. Initiating renewal process...")
                await gemini.renew_session(system_instruction, "AUDIO" if audio_mode else "TEXT")
                print("Session renewed successfully.")

            if gemini.ws:
                raw_response = await gemini.receive()
                try:
                    response = json.loads(raw_response)
                    print(f"Received from Gemini: {response}")

                    if "error" in response:
                        await websocket.send_json(response)
                        continue

                    response_id = response.get("responseId")
                    server_content = response.get("serverContent")

                    if server_content:
                        model_turn = server_content.get("modelTurn")
                        # Check for turn_complete or interrupted in the received chunk
                        turn_complete = server_content.get("turnComplete")
                        interrupted = server_content.get("interrupted")

                        if interrupted:
                          print("Turn interrupted")
                          await websocket.send_json({"interrupted": True})

                        if model_turn:
                            parts = model_turn.get("parts")
                            if parts:
                                for part in parts:
                                    if "text" in part:
                                      if response_id != current_response_id:
                                          # New response, send accumulated text if any
                                          if accumulated_text:
                                              await websocket.send_json(
                                                  {
                                                      "id": current_response_id,
                                                      "text": accumulated_text,
                                                      "sender": "ai",
                                                  }
                                              )
                                          # Start accumulating for the new response
                                          current_response_id = response_id
                                          accumulated_text = part["text"]
                                      else:
                                          # Same response, continue accumulating
                                          accumulated_text += part["text"]
                                    elif "inlineData" in part:
                                      if response_id != current_response_id:
                                        if accumulated_audio:
                                          await websocket.send_json(
                                              {
                                                "id": current_response_id,
                                                "audio": accumulated_audio.decode("latin-1"),
                                                "mime_type": current_mime_type,
                                                "sender": "ai",
                                              }
                                          )
                                        current_response_id = response_id
                                        accumulated_audio = part["inlineData"]["data"].encode("latin-1")
                                        current_mime_type = part["inlineData"]["mimeType"]
                                      else:
                                        accumulated_audio += part["inlineData"]["data"].encode("latin-1")

                        if turn_complete:
                            print("Turn complete")
                            # Send accumulated text or audio when turn is complete or interrupted
                            if accumulated_text:
                                await websocket.send_json(
                                    {
                                        "id": current_response_id,
                                        "text": accumulated_text,
                                        "sender": "ai",
                                    }
                                )
                                current_response_id = None
                                accumulated_text = ""
                            if accumulated_audio:
                                await websocket.send_json(
                                    {
                                      "id": current_response_id,
                                      "audio": accumulated_audio.decode("latin-1"),
                                      "mime_type": current_mime_type,
                                      "sender": "ai",
                                    }
                                )
                                current_response_id = None
                                accumulated_audio = b""
                                current_mime_type = None
                    else:
                        print("No serverContent found")

                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON: {e}")
                    print(f"Problematic response text: {raw_response}")
                except ConnectionClosed as e:
                    print(f"Connection closed by Gemini: {e.code}, {e.reason}")
                    break  # Exit the loop to attempt reconnection
                except Exception as e:
                    print(f"An unexpected error occurred: {e}")
                    break
            else:
                print("Gemini WebSocket is not open.")
                await asyncio.sleep(5)  # Wait before retrying
        except Exception as e:
            print(f"Error in receive_from_gemini: {e}")
            await asyncio.sleep(5)
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
