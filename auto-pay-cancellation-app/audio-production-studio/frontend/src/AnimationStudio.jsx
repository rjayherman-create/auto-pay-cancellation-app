import React, { useState, useEffect, useRef } from 'react';
import './AnimationStudio.css';

const AnimationStudio = () => {
  const [project, setProject] = useState(null);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [timeline, setTimeline] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // 3 minutes
  const [assets, setAssets] = useState({
    background: null,
    character: null,
    voiceover: null,
    effects: []
  });
  const [message, setMessage] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Asset upload handlers
  const handleAssetUpload = (type, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const asset = {
        id: Date.now(),
        type,
        name: file.name,
        data: e.target.result,
        url: URL.createObjectURL(file),
        size: file.size,
        uploadedAt: new Date().toISOString()
      };

      if (type === 'background' || type === 'character' || type === 'voiceover') {
        setAssets({ ...assets, [type]: asset });
        setMessage(`✅ ${type} uploaded successfully`);
      } else if (type === 'effect') {
        setAssets({ ...assets, effects: [...assets.effects, asset] });
        setMessage(`✅ Effect uploaded successfully`);
      }

      setTimeout(() => setMessage(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  // Timeline event creation
  const addTimelineEvent = (time, type, assetId) => {
    const newEvent = {
      id: Date.now(),
      time,
      type, // 'character-move', 'effect', 'voiceover-start', 'voiceover-end'
      assetId,
      duration: 0,
      properties: {}
    };

    setTimeline([...timeline, newEvent].sort((a, b) => a.time - b.time));
    setMessage('✅ Timeline event added');
    setTimeout(() => setMessage(''), 2000);
  };

  // Character animation controls
  const addCharacterAnimation = (startTime, endTime, animationType) => {
    addTimelineEvent(startTime, 'character-' + animationType, assets.character?.id);
  };

  // Voiceover sync
  const syncVoiceoverToTimeline = () => {
    if (!assets.voiceover) {
      setMessage('❌ No voiceover uploaded');
      return;
    }

    addTimelineEvent(0, 'voiceover-start', assets.voiceover.id);
    setMessage('✅ Voiceover synced to timeline');
    setTimeout(() => setMessage(''), 2000);
  };

  // Sound effects
  const addSoundEffect = (time, effectId, duration) => {
    addTimelineEvent(time, 'effect', effectId);
  };

  // Preview animation
  const handlePreviewAnimationAtTime = () => {
    // Get all events at current time
    const eventsAtTime = timeline.filter(
      event => event.time <= currentTime && event.time + (event.duration || 0) >= currentTime
    );

    return eventsAtTime;
  };

  // Render canvas preview
  const renderPreview = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (assets.background) {
      const img = new Image();
      img.src = assets.background.url;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }

    // Draw character
    if (assets.character) {
      const img = new Image();
      img.src = assets.character.url;
      img.onload = () => {
        // Position character in center-bottom of canvas
        const charWidth = 150;
        const charHeight = 200;
        ctx.drawImage(
          img,
          canvas.width / 2 - charWidth / 2,
          canvas.height - charHeight - 20,
          charWidth,
          charHeight
        );
      };
    }

    // Draw current time indicator
    ctx.fillStyle = '#00d4ff';
    ctx.font = '16px Arial';
    ctx.fillText(`${formatTime(currentTime)}`, 10, 30);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Play/pause animation
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // Update current time during playback
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return prev + 0.016; // ~60fps
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Render preview whenever current time changes
  useEffect(() => {
    renderPreview();
  }, [currentTime, assets]);

  return (
    <div className="animation-studio">
      {/* Header */}
      <div className="studio-header">
        <h1>🎨 Animation Sync Studio</h1>
        <p>Create synced animations: Background + Character + Voice-Over + Effects</p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {currentStep === 'welcome' && (
        <div className="step-content welcome">
          <div className="welcome-box">
            <h2>🎬 Welcome to Animation Sync Studio</h2>
            <p>Create professional 3-minute animations with:</p>
            <ul className="features-list">
              <li>📸 Background image</li>
              <li>🧑 Animated character with sync</li>
              <li>🎙️ Voice-over with perfect timing</li>
              <li>🔊 Sound effects and music</li>
              <li>⏱️ Frame-by-frame timeline control</li>
            </ul>
            <button onClick={() => setCurrentStep('assetUpload')} className="btn-start">
              Start Creating Animation →
            </button>
          </div>
        </div>
      )}

      {currentStep === 'assetUpload' && (
        <div className="step-content">
          <h2>📸 Step 1: Upload Assets</h2>
          <p>Upload your background, character, and audio files</p>

          <div className="assets-grid">
            {/* Background Upload */}
            <div className="asset-card">
              <h3>🖼️ Background Image</h3>
              <p>Static background for your animation (PNG, JPG, WebP)</p>
              <label className="upload-btn">
                Upload Background
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAssetUpload('background', e.target.files[0])}
                  hidden
                />
              </label>
              {assets.background && (
                <div className="asset-preview">
                  <img src={assets.background.url} alt="Background" />
                  <p className="asset-name">{assets.background.name}</p>
                </div>
              )}
            </div>

            {/* Character Upload */}
            <div className="asset-card">
              <h3>🧑 Character Image</h3>
              <p>Animated character (PNG with transparency recommended)</p>
              <label className="upload-btn">
                Upload Character
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAssetUpload('character', e.target.files[0])}
                  hidden
                />
              </label>
              {assets.character && (
                <div className="asset-preview">
                  <img src={assets.character.url} alt="Character" />
                  <p className="asset-name">{assets.character.name}</p>
                </div>
              )}
            </div>

            {/* Voice-Over Upload */}
            <div className="asset-card">
              <h3>🎙️ Voice-Over Audio</h3>
              <p>Your recorded voice-over (MP3, WAV, OGG)</p>
              <label className="upload-btn">
                Upload Voice-Over
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleAssetUpload('voiceover', e.target.files[0])}
                  hidden
                />
              </label>
              {assets.voiceover && (
                <div className="asset-preview">
                  <div className="audio-icon">🎙️</div>
                  <p className="asset-name">{assets.voiceover.name}</p>
                </div>
              )}
            </div>

            {/* Effects Upload */}
            <div className="asset-card">
              <h3>🔊 Sound Effects</h3>
              <p>Additional sound effects (MP3, WAV, OGG)</p>
              <label className="upload-btn">
                + Add Effect
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleAssetUpload('effect', e.target.files[0])}
                  hidden
                />
              </label>
              <div className="effects-list">
                {assets.effects.map(effect => (
                  <div key={effect.id} className="effect-item">
                    <span>🔊 {effect.name}</span>
                    <button
                      onClick={() =>
                        setAssets({
                          ...assets,
                          effects: assets.effects.filter(e => e.id !== effect.id)
                        })
                      }
                      className="btn-remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              onClick={() => setCurrentStep('timeline')}
              disabled={!assets.background || !assets.character || !assets.voiceover}
              className="btn-next"
            >
              Continue to Timeline →
            </button>
          </div>
        </div>
      )}

      {currentStep === 'timeline' && (
        <div className="step-content timeline-view">
          <h2>⏱️ Step 2: Sync Animation Timeline</h2>

          {/* Preview Canvas */}
          <div className="preview-section">
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              className="preview-canvas"
            />
          </div>

          {/* Playback Controls */}
          <div className="playback-controls">
            <button onClick={togglePlayback} className="btn-play">
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button onClick={() => setCurrentTime(0)} className="btn-reset">
              ⏮️ Reset
            </button>
            <div className="time-display">
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                className="timeline-slider"
              />
              <span className="time-text">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Timeline Events */}
          <div className="timeline-section">
            <h3>Timeline Events</h3>
            <div className="timeline-events">
              <div className="event-adder">
                <label>Character Animation at Time:</label>
                <input
                  type="number"
                  min="0"
                  max={duration}
                  step="0.1"
                  placeholder="Time in seconds"
                  id="char-time"
                  className="form-input"
                />
                <select id="anim-type" className="form-select">
                  <option value="idle">Idle</option>
                  <option value="talk">Talking</option>
                  <option value="gesture">Gesture</option>
                  <option value="point">Point</option>
                  <option value="jump">Jump</option>
                  <option value="wave">Wave</option>
                </select>
                <button
                  onClick={() => {
                    const time = parseFloat(document.getElementById('char-time').value);
                    const type = document.getElementById('anim-type').value;
                    addCharacterAnimation(time, time + 2, type);
                  }}
                  className="btn-add-event"
                >
                  ➕ Add Animation
                </button>
              </div>

              <div className="event-adder">
                <label>Sound Effect at Time:</label>
                <input
                  type="number"
                  min="0"
                  max={duration}
                  step="0.1"
                  placeholder="Time in seconds"
                  id="effect-time"
                  className="form-input"
                />
                <select id="effect-select" className="form-select">
                  {assets.effects.map(effect => (
                    <option key={effect.id} value={effect.id}>
                      {effect.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const time = parseFloat(document.getElementById('effect-time').value);
                    const effectId = document.getElementById('effect-select').value;
                    addSoundEffect(time, effectId, 2);
                  }}
                  disabled={assets.effects.length === 0}
                  className="btn-add-event"
                >
                  ➕ Add Effect
                </button>
              </div>

              <button
                onClick={syncVoiceoverToTimeline}
                className="btn-sync-voice"
              >
                🎙️ Sync Voice-Over
              </button>
            </div>

            {/* Events List */}
            <div className="events-list">
              {timeline.length === 0 ? (
                <p className="empty">No timeline events yet. Add animations and effects above.</p>
              ) : (
                timeline.map(event => (
                  <div key={event.id} className="event-item">
                    <span className="event-time">{formatTime(event.time)}</span>
                    <span className="event-type">{event.type}</span>
                    <button
                      onClick={() => setTimeline(timeline.filter(e => e.id !== event.id))}
                      className="btn-remove-event"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="form-actions">
            <button onClick={() => setCurrentStep('export')} className="btn-next">
              Export Animation →
            </button>
          </div>
        </div>
      )}

      {currentStep === 'export' && (
        <div className="step-content export-view">
          <h2>💾 Step 3: Export Animation</h2>

          <div className="export-options">
            <div className="export-card">
              <h3>🎬 Export Formats</h3>
              <div className="format-options">
                <button className="btn-export-format">
                  📹 Export as MP4 (Recommended)
                </button>
                <button className="btn-export-format">
                  📹 Export as WebM
                </button>
                <button className="btn-export-format">
                  📹 Export as GIF
                </button>
              </div>
            </div>

            <div className="export-card">
              <h3>⚙️ Export Settings</h3>
              <div className="settings-grid">
                <div className="setting-item">
                  <label>Resolution:</label>
                  <select className="form-select">
                    <option>1920x1080 (Full HD)</option>
                    <option>1280x720 (HD)</option>
                    <option>854x480 (480p)</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>Frame Rate:</label>
                  <select className="form-select">
                    <option>60 FPS</option>
                    <option>30 FPS</option>
                    <option>24 FPS</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>Quality:</label>
                  <select className="form-select">
                    <option>High (Best)</option>
                    <option>Medium</option>
                    <option>Low (Smallest File)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="export-card">
              <h3>📊 Animation Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="label">Duration:</span>
                  <span className="value">{formatTime(duration)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Background:</span>
                  <span className="value">{assets.background?.name || 'None'}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Character:</span>
                  <span className="value">{assets.character?.name || 'None'}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Voice-Over:</span>
                  <span className="value">{assets.voiceover?.name || 'None'}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Effects:</span>
                  <span className="value">{assets.effects.length}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Timeline Events:</span>
                  <span className="value">{timeline.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button onClick={() => setCurrentStep('timeline')} className="btn-back">
              ← Back to Timeline
            </button>
            <button className="btn-export-final">
              🎬 Export Final Animation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimationStudio;
