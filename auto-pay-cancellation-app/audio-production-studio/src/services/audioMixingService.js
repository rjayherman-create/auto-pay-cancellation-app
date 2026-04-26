import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Audio Mixing Service - FFmpeg-based audio processing
 */

class AudioMixingService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads/audio');
    this.ensureUploadDir();
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Mix multiple audio tracks
   */
  async mixAudio(mixConfig) {
    return new Promise((resolve, reject) => {
      const {
        voiceover,
        backgroundMusic,
        soundEffects = [],
        duration,
        output = 'mp3',
        bitrate = '192k'
      } = mixConfig;

      if (!voiceover || !voiceover.path) {
        return reject(new Error('Voiceover is required'));
      }

      const outputId = uuidv4();
      const outputFileName = `mix_${outputId}.${output}`;
      const outputPath = path.join(this.uploadsDir, outputFileName);

      let command = ffmpeg(voiceover.path);

      if (backgroundMusic && backgroundMusic.path) {
        command = command
          .input(backgroundMusic.path)
          .complexFilter([
            `[0:a]volume=${voiceover.volume || 1}[v]`,
            `[1:a]volume=${backgroundMusic.volume || 0.3}[m]`,
            `[v][m]amix=inputs=2:duration=longest[a]`
          ], ['a']);
      } else {
        command = command
          .complexFilter(`[0:a]volume=${voiceover.volume || 1}[a]`, ['a']);
      }

      command
        .on('error', (err) => {
          console.error('FFmpeg mixing error:', err);
          reject(err);
        })
        .on('end', () => {
          resolve({
            mixId: outputId,
            outputPath,
            outputUrl: `/uploads/audio/${outputFileName}`,
            filename: outputFileName,
            duration,
            format: output,
            bitrate,
            createdAt: new Date()
          });
        })
        .audioCodec('libmp3lame')
        .audioBitrate(bitrate)
        .toFormat(output)
        .save(outputPath);
    });
  }

  /**
   * Adjust audio properties (volume, speed, pitch)
   */
  async adjustAudioProperties(inputPath, adjustments = {}) {
    return new Promise((resolve, reject) => {
      const {
        volume = 1.0,
        speed = 1.0,
        pitch = 0,
        output = 'mp3'
      } = adjustments;

      const outputId = uuidv4();
      const outputFileName = `adjusted_${outputId}.${output}`;
      const outputPath = path.join(this.uploadsDir, outputFileName);

      let filterComplex = `volume=${volume}`;
      if (speed !== 1.0) {
        filterComplex += `,atempo=${speed}`;
      }

      ffmpeg(inputPath)
        .audioFilter(filterComplex)
        .on('error', reject)
        .on('end', () => {
          resolve({
            adjustmentId: outputId,
            outputPath,
            outputUrl: `/uploads/audio/${outputFileName}`,
            adjustments: { volume, speed, pitch }
          });
        })
        .toFormat(output)
        .save(outputPath);
    });
  }

  /**
   * Get audio metadata
   */
  getAudioMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) return reject(err);

        const audio = metadata.streams.find(s => s.codec_type === 'audio');
        resolve({
          duration: metadata.format.duration,
          sampleRate: audio?.sample_rate,
          channels: audio?.channels,
          bitrate: audio?.bit_rate,
          codec: audio?.codec_name,
          format: metadata.format.format_name
        });
      });
    });
  }
}

export default new AudioMixingService();
