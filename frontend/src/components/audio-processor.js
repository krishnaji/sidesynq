// /my-llm-app/frontend/src/components/audio-processor.js
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(512);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const channelData = input[0];

    if (channelData) {
      for (let i = 0; i < channelData.length; i++) {
        this.buffer[this.bufferIndex++] = channelData[i];

        if (this.bufferIndex >= this.buffer.length) {
          this.flush();
        }
      }
    }

    return true;
  }

  flush() {
    const trimmedBuffer = this.buffer.slice(0, this.bufferIndex);
    const downsampledBuffer = this.downsampleAndConvertToPCM16(trimmedBuffer);
    this.port.postMessage(downsampledBuffer);
    this.bufferIndex = 0;
  }

  downsampleAndConvertToPCM16(buffer) {
    const downsampledBuffer = new Float32Array(
      Math.ceil((buffer.length * 16000) / sampleRate)
    );
    let outputIndex = 0;
    for (let i = 0; i < buffer.length; i += sampleRate / 16000) {
      const offset = Math.floor(i);
      downsampledBuffer[outputIndex++] = buffer[offset];
    }

    const pcm16Buffer = new Int16Array(downsampledBuffer.length);
    for (let i = 0; i < downsampledBuffer.length; i++) {
      const s = Math.max(-1, Math.min(1, downsampledBuffer[i]));
      pcm16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    return pcm16Buffer.buffer;
  }

  // Removed interleave, floatTo16BitPCM, writeString, and encodeWAV methods
}

registerProcessor('recorder.worklet', RecorderProcessor);