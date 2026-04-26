import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Animation Service - Audio/Video Sync & Export
 */

class AnimationService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads/video');
    this.audioDir = path.join(__dirname, '../../uploads/audio');
    this.ensureUploadDir();
  }

  ensureUploadDir() {
    [this.uploadsDir, this.audioDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Create animation sync timeline
   */
  createSyncTimeline(audioPath, sceneBreakpoints = []) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) return reject(err);

        const duration = metadata.format.duration;
        const fps = 24;
        const totalFrames = Math.ceil(duration * fps);

        const breakpoints = sceneBreakpoints.length > 0
          ? sceneBreakpoints
          : this.generateDefaultBreakpoints(duration);

        const timeline = {
          timelineId: uuidv4(),
          audioPath,
          duration,
          fps,
          totalFrames,
          scenes: breakpoints.map((bp, index) => ({
            sceneNumber: index + 1,
            startTime: bp.startTime,
            endTime: bp.endTime || (breakpoints[index + 1]?.startTime || duration),
            startFrame: Math.floor(bp.startTime * fps),
            endFrame: Math.floor((bp.endTime || (breakpoints[index + 1]?.startTime || duration)) * fps),
            characterDialogue: bp.dialogue || '',
            actionDescription: bp.action || ''
          })),
          metadata: {
            totalScenes: breakpoints.length,
            createdAt: new Date()
          }
        };

        resolve(timeline);
      });
    });
  }

  generateDefaultBreakpoints(duration) {
    const breakpoints = [];
    for (let i = 0; i < duration; i += 10) {
      breakpoints.push({
        startTime: i,
        endTime: Math.min(i + 10, duration),
        dialogue: '',
        action: `Scene ${Math.floor(i / 10) + 1}`
      });
    }
    return breakpoints;
  }

  /**
   * Create animation project
   */
  createAnimationProject(projectConfig) {
    const {
      title,
      duration = 180,
      characterVoices = [],
      scenes = [],
      fps = 24
    } = projectConfig;

    return {
      projectId: uuidv4(),
      title,
      duration,
      fps,
      totalFrames: Math.ceil(duration * fps),
      characterVoices: characterVoices.map(voice => ({
        characterId: uuidv4(),
        ...voice
      })),
      scenes: scenes.map((scene, index) => ({
        sceneNumber: index + 1,
        ...scene,
        startFrame: scene.startFrame || 0,
        endFrame: scene.endFrame || Math.ceil(duration * fps),
        audioTracks: [],
        visualAssets: []
      })),
      status: 'in_production',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Export animation for different platforms
   */
  async exportForPlatform(videoPath, platform = 'youtube', options = {}) {
    const presets = {
      youtube: {
        resolution: '1920x1080',
        fps: 60,
        bitrate: '8000k',
        format: 'mp4'
      },
      tiktok: {
        resolution: '1080x1920',
        fps: 30,
        bitrate: '3000k',
        format: 'mp4'
      },
      instagram: {
        resolution: '1080x1080',
        fps: 30,
        bitrate: '3000k',
        format: 'mp4'
      },
      web: {
        resolution: '1280x720',
        fps: 30,
        bitrate: '2000k',
        format: 'webm'
      }
    };

    const preset = presets[platform] || presets.youtube;
    const finalOptions = { ...preset, ...options };

    return new Promise((resolve, reject) => {
      const outputId = uuidv4();
      const outputFileName = `export_${platform}_${outputId}.${finalOptions.format}`;
      const outputPath = path.join(this.uploadsDir, outputFileName);

      ffmpeg(videoPath)
        .size(finalOptions.resolution)
        .fps(finalOptions.fps)
        .videoBitrate(finalOptions.bitrate)
        .on('error', reject)
        .on('end', () => {
          resolve({
            exportId: outputId,
            platform,
            videoPath: outputPath,
            videoUrl: `/uploads/video/${outputFileName}`,
            filename: outputFileName,
            resolution: finalOptions.resolution,
            fps: finalOptions.fps,
            bitrate: finalOptions.bitrate,
            format: finalOptions.format,
            createdAt: new Date()
          });
        })
        .save(outputPath);
    });
  }

  /**
   * Composite audio with video
   */
  async compositeAudioToVideo(videoPath, audioPath, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        audioVolume = 1.0,
        videoVolume = 0.3,
        output = 'mp4'
      } = options;

      const outputId = uuidv4();
      const outputFileName = `composite_${outputId}.${output}`;
      const outputPath = path.join(this.uploadsDir, outputFileName);

      ffmpeg(videoPath)
        .input(audioPath)
        .complexFilter([
          `[0:v]scale=1920:1080:force_original_aspect_ratio=decrease[v]`,
          `[0:a]volume=${videoVolume}[va]`,
          `[1:a]volume=${audioVolume}[aa]`,
          `[va][aa]amix=inputs=2:duration=longest[a]`
        ], ['v', 'a'])
        .videoCodec('libx264')
        .audioCodec('aac')
        .on('error', reject)
        .on('end', () => {
          resolve({
            compositeId: outputId,
            videoPath: outputPath,
            videoUrl: `/uploads/video/${outputFileName}`,
            filename: outputFileName,
            output,
            createdAt: new Date()
          });
        })
        .save(outputPath);
    });
  }
}

export default new AnimationService();
