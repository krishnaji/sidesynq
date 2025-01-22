// /my-llm-app/frontend/src/components/MediaHandler.js
export class MediaHandler {
  constructor() {
    this.audioStream = null;
    this.screenStream = null;
    this.audioContext = null;
    this.audioSource = null;
    this.microphoneSource = null;
    this.processor = null;
    this.videoElement = null;
    this.canvasElement = document.createElement('canvas');
    this.canvasContext = this.canvasElement.getContext('2d');
    this.frameInterval = null;
    this.maxFPS = 2;
    this.lastFrameTime = 0;
    this.eventEmitter = new (class extends EventTarget {})();

    // Camera-specific properties
    this.cameraStream = null;
    this.cameraVideoElement = null;
    this.cameraCanvasElement = document.createElement('canvas');
    this.cameraCanvasContext = this.cameraCanvasElement.getContext('2d');

    // Preview references
    this.videoPreviewRef = null;
    this.cameraPreviewRef = null;
  }

  on(event, listener) {
    this.eventEmitter.addEventListener(event, (e) => listener(e.detail));
  }

  off(event, listener) {
    this.eventEmitter.removeEventListener(event, listener);
  }

  emit(event, data) {
    this.eventEmitter.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  setVideoPreviewRef(ref) {
    this.videoPreviewRef = ref;
  }

  setCameraPreviewRef(ref) {
    this.cameraPreviewRef = ref;
  }

  async startAudioRecording(source = 'microphone') {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)({
        sampleRate: 16000,
      });
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (!this.processor) {
      await this.audioContext.audioWorklet.addModule(
        './src/components/audio-processor.js'
      );
      this.processor = new AudioWorkletNode(
        this.audioContext,
        'recorder.worklet'
      );

      this.processor.port.onmessage = (event) => {
        const audioData = event.data;
        const base64AudioData = btoa(
          String.fromCharCode.apply(null, new Uint8Array(audioData))
        );
        this.emit('audioData', base64AudioData);
      };
    }

    if (source === 'microphone') {
      if (!this.audioStream) {
        this.audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      }
      this.microphoneSource =
        this.audioContext.createMediaStreamSource(this.audioStream);
      this.microphoneSource.connect(this.processor);
    } else if (source === 'system' && this.screenStream) {
      const audioTracks = this.screenStream.getAudioTracks();
      if (audioTracks.length > 0) {
        this.audioStream = new MediaStream([audioTracks[0]]);
        this.audioSource =
          this.audioContext.createMediaStreamSource(this.audioStream);
        this.audioSource.connect(this.processor);
      } else {
        console.warn('No audio track found in screen stream.');
      }
    }

    this.processor.connect(this.audioContext.destination);
  }

  stopAudioRecording() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }

    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
    }

    if (this.microphoneSource) {
      this.microphoneSource.disconnect();
      this.microphoneSource = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor.port.onmessage = null;
      this.processor = null;
    }

    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  async startScreenShare() {
    if (this.screenStream) {
      this.stopScreenShare();
    }

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        systemAudio: 'include',
      });

      // Set the preview video source
      if (this.videoPreviewRef && this.videoPreviewRef.current) {
        this.videoPreviewRef.current.srcObject = this.screenStream;
      }

      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);
      }

      this.videoElement.srcObject = this.screenStream;
      await this.videoElement.play();

      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      this.startFrameCapture();
      this.startAudioRecording('system');
      this.startAudioRecording('microphone');
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    // Clear the preview video source
    if (this.videoPreviewRef && this.videoPreviewRef.current) {
      this.videoPreviewRef.current.srcObject = null;
    }

    if (this.videoElement) {
      this.videoElement.remove();
      this.videoElement = null;
    }

    this.stopFrameCapture();
    this.stopAudioRecording();
  }

  startFrameCapture() {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
    }

    this.frameInterval = setInterval(() => {
      const now = Date.now();
      if (
        now - this.lastFrameTime >= 1000 / this.maxFPS &&
        this.videoElement
      ) {
        this.canvasElement.width = 1024;
        this.canvasElement.height = 1024;

        this.canvasContext.drawImage(
          this.videoElement,
          0,
          0,
          this.canvasElement.width,
          this.canvasElement.height
        );

        const imageData = this.canvasElement.toDataURL('image/jpeg');
        const base64Image = imageData.split(',')[1];
        this.emit('videoFrame', base64Image);
        this.lastFrameTime = now;
      }
    }, 1000 / this.maxFPS);
  }

  stopFrameCapture() {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
  }

  // Camera methods
  async startCamera() {
    if (this.cameraStream) {
      this.stopCamera();
    }

    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false, // Enable audio if needed
      });

      // Set the preview camera source
      if (this.cameraPreviewRef && this.cameraPreviewRef.current) {
        this.cameraPreviewRef.current.srcObject = this.cameraStream;
      }

      if (!this.cameraVideoElement) {
        this.cameraVideoElement = document.createElement('video');
        this.cameraVideoElement.autoplay = true;
        this.cameraVideoElement.playsInline = true;
        this.cameraVideoElement.style.display = 'none';
        document.body.appendChild(this.cameraVideoElement);
      }

      this.cameraVideoElement.srcObject = this.cameraStream;
      await this.cameraVideoElement.play();

      this.cameraStream.getVideoTracks()[0].onended = () => {
        this.stopCamera();
      };

      this.startCameraFrameCapture();
    } catch (error) {
      console.error('Error starting camera:', error);
      throw error;
    }
  }

  stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }

    // Clear the preview camera source
    if (this.cameraPreviewRef && this.cameraPreviewRef.current) {
      this.cameraPreviewRef.current.srcObject = null;
    }

    if (this.cameraVideoElement) {
      this.cameraVideoElement.remove();
      this.cameraVideoElement = null;
    }

    this.stopCameraFrameCapture();
  }

  startCameraFrameCapture() {
    if (this.cameraFrameInterval) {
      clearInterval(this.cameraFrameInterval);
    }

    this.cameraFrameInterval = setInterval(() => {
      const now = Date.now();
      if (
        now - this.lastFrameTime >= 1000 / this.maxFPS &&
        this.cameraVideoElement
      ) {
        this.cameraCanvasElement.width = 640; // Adjust resolution as needed
        this.cameraCanvasElement.height = 480;

        this.cameraCanvasContext.drawImage(
          this.cameraVideoElement,
          0,
          0,
          this.cameraCanvasElement.width,
          this.cameraCanvasElement.height
        );

        const imageData = this.cameraCanvasElement.toDataURL('image/jpeg');
        const base64Image = imageData.split(',')[1];
        this.emit('videoFrame', base64Image);
        this.lastFrameTime = now;
      }
    }, 1000 / this.maxFPS);
  }

  stopCameraFrameCapture() {
    if (this.cameraFrameInterval) {
      clearInterval(this.cameraFrameInterval);
      this.cameraFrameInterval = null;
    }
  }
}