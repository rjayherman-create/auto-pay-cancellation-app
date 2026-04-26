import React, { useState, useEffect, useRef } from 'react';
import './FullMixingBoard.css';

const FullMixingBoard = () => {
  const [tracks, setTracks] = useState([
    { id: 1, name: 'Voiceover 1', type: 'voice', volume: 1, pan: 0, muted: false, solo: false, gain: 0, peak: -20 },
    { id: 2, name: 'Voiceover 2', type: 'voice', volume: 1, pan: -0.5, muted: false, solo: false, gain: 0, peak: -22 },
    { id: 3, name: 'Background Music', type: 'music', volume: 0.7, pan: 0, muted: false, solo: false, gain: -3, peak: -15 },
    { id: 4, name: 'Sound Effect 1', type: 'sfx', volume: 0.8, pan: 0.3, muted: false, solo: false, gain: -2, peak: -18 },
    { id: 5, name: 'Ambience', type: 'ambience', volume: 0.5, pan: 0, muted: false, solo: false, gain: -6, peak: -25 },
  ]);

  const [masterVolume, setMasterVolume] = useState(0);
  const [masterPan, setMasterPan] = useState(0);
  const [masterMuted, setMasterMuted] = useState(false);
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [showEQPanel, setShowEQPanel] = useState(null);
  const [showCompressionPanel, setShowCompressionPanel] = useState(null);

  // EQ State
  const [eqSettings, setEqSettings] = useState({});
  // Compression State
  const [compressionSettings, setCompressionSettings] = useState({});

  const animationRef = useRef();

  // Initialize EQ and Compression for all tracks
  useEffect(() => {
    const newEq = {};
    const newComp = {};
    tracks.forEach(track => {
      newEq[track.id] = {
        lowShelf: 0,
        mid: 0,
        highShelf: 0,
        frequency: 1000
      };
      newComp[track.id] = {
        threshold: -20,
        ratio: 4,
        attack: 5,
        release: 100,
        makeup: 0
      };
    });
    setEqSettings(newEq);
    setCompressionSettings(newComp);
  }, []);

  const updateTrack = (id, updates) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleTrackVolumeChange = (id, volume) => {
    updateTrack(id, { volume });
  };

  const handleTrackPanChange = (id, pan) => {
    updateTrack(id, { pan });
  };

  const handleTrackGainChange = (id, gain) => {
    updateTrack(id, { gain });
  };

  const toggleMute = (id) => {
    updateTrack(id, { muted: !tracks.find(t => t.id === id).muted });
  };

  const toggleSolo = (id) => {
    // When soloing, mute all other tracks
    setTracks(prev => prev.map(t => ({
      ...t,
      solo: t.id === id ? !t.solo : false,
      muted: t.id === id ? false : !tracks.find(t => t.id === id).solo
    })));
  };

  const handleEQChange = (trackId, eqType, value) => {
    setEqSettings(prev => ({
      ...prev,
      [trackId]: {
        ...prev[trackId],
        [eqType]: value
      }
    }));
  };

  const handleCompressionChange = (trackId, compType, value) => {
    setCompressionSettings(prev => ({
      ...prev,
      [trackId]: {
        ...prev[trackId],
        [compType]: value
      }
    }));
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    // Would trigger actual audio playback
  };

  const handleRecord = () => {
    setRecordingEnabled(!recordingEnabled);
    // Would trigger recording
  };

  const handleExport = () => {
    alert('Exporting mix with all effects applied...');
    // Would handle export
  };

  return (
    <div className="full-mixing-board">
      {/* Header Controls */}
      <div className="board-header">
        <div className="header-left">
          <h1>🎚️ Professional Mixing Board</h1>
          <p>Full-Featured Audio Production Console</p>
        </div>
        <div className="header-right">
          <button className={`btn-control ${isPlaying ? 'active' : ''}`} onClick={handlePlay}>
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          <button className={`btn-control ${recordingEnabled ? 'active' : ''}`} onClick={handleRecord}>
            {recordingEnabled ? '⏹️ Stop Recording' : '🔴 Record'}
          </button>
          <button className="btn-export" onClick={handleExport}>
            💾 Export Mix
          </button>
        </div>
      </div>

      {/* Main Mixing Board */}
      <div className="mixing-board">
        {/* Channel Strips */}
        <div className="channel-strips-container">
          {tracks.map(track => (
            <div
              key={track.id}
              className={`channel-strip ${selectedTrack?.id === track.id ? 'selected' : ''} ${track.muted ? 'muted' : ''} ${track.solo ? 'solo' : ''}`}
              onClick={() => setSelectedTrack(track)}
            >
              {/* Channel Header */}
              <div className="channel-header">
                <h3>{track.name}</h3>
                <span className={`track-type ${track.type}`}>{track.type}</span>
              </div>

              {/* Peak Meter */}
              <div className="peak-meter">
                <div className="meter-bar">
                  <div className="meter-fill" style={{ height: `${(track.peak + 60) * 1.67}%` }}></div>
                </div>
                <span className="meter-label">{track.peak}dB</span>
              </div>

              {/* Volume Fader */}
              <div className="fader-section">
                <label>Volume</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.01"
                  value={track.volume}
                  onChange={(e) => handleTrackVolumeChange(track.id, parseFloat(e.target.value))}
                  className="vertical-slider"
                  style={{
                    backgroundSize: '100% ' + (track.volume * 50) + '%',
                  }}
                />
                <span className="fader-value">{(track.volume).toFixed(2)}x</span>
              </div>

              {/* Gain */}
              <div className="gain-section">
                <label>Gain</label>
                <div className="gain-display">{track.gain > 0 ? '+' : ''}{track.gain}dB</div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={track.gain}
                  onChange={(e) => handleTrackGainChange(track.id, parseFloat(e.target.value))}
                  className="gain-slider"
                />
              </div>

              {/* Pan */}
              <div className="pan-section">
                <label>Pan</label>
                <div className="pan-display">
                  {track.pan > 0.1 ? 'R' : track.pan < -0.1 ? 'L' : 'C'} {Math.abs(track.pan).toFixed(1)}
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={track.pan}
                  onChange={(e) => handleTrackPanChange(track.id, parseFloat(e.target.value))}
                  className="pan-slider"
                />
              </div>

              {/* Control Buttons */}
              <div className="channel-buttons">
                <button
                  className={`btn-channel ${eqSettings[track.id] && (eqSettings[track.id].lowShelf !== 0 || eqSettings[track.id].mid !== 0 || eqSettings[track.id].highShelf !== 0) ? 'active' : ''}`}
                  onClick={() => setShowEQPanel(showEQPanel === track.id ? null : track.id)}
                  title="EQ"
                >
                  🎛️
                </button>
                <button
                  className={`btn-channel ${compressionSettings[track.id] && compressionSettings[track.id].ratio > 1 ? 'active' : ''}`}
                  onClick={() => setShowCompressionPanel(showCompressionPanel === track.id ? null : track.id)}
                  title="Compression"
                >
                  🔧
                </button>
                <button
                  className={`btn-channel mute ${track.muted ? 'active' : ''}`}
                  onClick={() => toggleMute(track.id)}
                  title="Mute"
                >
                  🔇
                </button>
                <button
                  className={`btn-channel solo ${track.solo ? 'active' : ''}`}
                  onClick={() => toggleSolo(track.id)}
                  title="Solo"
                >
                  S
                </button>
              </div>
            </div>
          ))}

          {/* Master Channel */}
          <div className="master-channel">
            <div className="channel-header">
              <h3>MASTER</h3>
              <span className="track-type master">Master</span>
            </div>

            {/* Master Peak Meter */}
            <div className="peak-meter">
              <div className="meter-bar">
                <div className="meter-fill" style={{ height: '45%' }}></div>
              </div>
              <span className="meter-label">-12dB</span>
            </div>

            {/* Master Volume Fader */}
            <div className="fader-section">
              <label>Volume</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={masterVolume}
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                className="vertical-slider master-slider"
              />
              <span className="fader-value">{(masterVolume).toFixed(2)}x</span>
            </div>

            {/* Master Pan */}
            <div className="pan-section">
              <label>Pan</label>
              <div className="pan-display">
                {masterPan > 0.1 ? 'R' : masterPan < -0.1 ? 'L' : 'C'}
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={masterPan}
                onChange={(e) => setMasterPan(parseFloat(e.target.value))}
                className="pan-slider"
              />
            </div>

            {/* Master Buttons */}
            <div className="channel-buttons">
              <button
                className={`btn-channel mute ${masterMuted ? 'active' : ''}`}
                onClick={() => setMasterMuted(!masterMuted)}
              >
                🔇
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EQ Panel */}
      {showEQPanel && eqSettings[showEQPanel] && (
        <div className="effects-panel eq-panel">
          <div className="panel-header">
            <h3>🎛️ EQ - {tracks.find(t => t.id === showEQPanel)?.name}</h3>
            <button onClick={() => setShowEQPanel(null)}>✕</button>
          </div>
          <div className="eq-controls">
            <div className="eq-band">
              <label>Low Shelf (Hz)</label>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={eqSettings[showEQPanel].lowShelf}
                onChange={(e) => handleEQChange(showEQPanel, 'lowShelf', parseFloat(e.target.value))}
              />
              <span>{eqSettings[showEQPanel].lowShelf}dB</span>
            </div>
            <div className="eq-band">
              <label>Mid (1kHz)</label>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={eqSettings[showEQPanel].mid}
                onChange={(e) => handleEQChange(showEQPanel, 'mid', parseFloat(e.target.value))}
              />
              <span>{eqSettings[showEQPanel].mid}dB</span>
            </div>
            <div className="eq-band">
              <label>High Shelf (Hz)</label>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={eqSettings[showEQPanel].highShelf}
                onChange={(e) => handleEQChange(showEQPanel, 'highShelf', parseFloat(e.target.value))}
              />
              <span>{eqSettings[showEQPanel].highShelf}dB</span>
            </div>
          </div>
        </div>
      )}

      {/* Compression Panel */}
      {showCompressionPanel && compressionSettings[showCompressionPanel] && (
        <div className="effects-panel compression-panel">
          <div className="panel-header">
            <h3>🔧 Compression - {tracks.find(t => t.id === showCompressionPanel)?.name}</h3>
            <button onClick={() => setShowCompressionPanel(null)}>✕</button>
          </div>
          <div className="compression-controls">
            <div className="comp-control">
              <label>Threshold (dB)</label>
              <input
                type="range"
                min="-60"
                max="0"
                step="1"
                value={compressionSettings[showCompressionPanel].threshold}
                onChange={(e) => handleCompressionChange(showCompressionPanel, 'threshold', parseFloat(e.target.value))}
              />
              <span>{compressionSettings[showCompressionPanel].threshold}dB</span>
            </div>
            <div className="comp-control">
              <label>Ratio</label>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={compressionSettings[showCompressionPanel].ratio}
                onChange={(e) => handleCompressionChange(showCompressionPanel, 'ratio', parseFloat(e.target.value))}
              />
              <span>{compressionSettings[showCompressionPanel].ratio}:1</span>
            </div>
            <div className="comp-control">
              <label>Attack (ms)</label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={compressionSettings[showCompressionPanel].attack}
                onChange={(e) => handleCompressionChange(showCompressionPanel, 'attack', parseFloat(e.target.value))}
              />
              <span>{compressionSettings[showCompressionPanel].attack}ms</span>
            </div>
            <div className="comp-control">
              <label>Release (ms)</label>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={compressionSettings[showCompressionPanel].release}
                onChange={(e) => handleCompressionChange(showCompressionPanel, 'release', parseFloat(e.target.value))}
              />
              <span>{compressionSettings[showCompressionPanel].release}ms</span>
            </div>
            <div className="comp-control">
              <label>Makeup Gain (dB)</label>
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={compressionSettings[showCompressionPanel].makeup}
                onChange={(e) => handleCompressionChange(showCompressionPanel, 'makeup', parseFloat(e.target.value))}
              />
              <span>{compressionSettings[showCompressionPanel].makeup}dB</span>
            </div>
          </div>
        </div>
      )}

      {/* Recording Indicator */}
      {recordingEnabled && (
        <div className="recording-indicator">
          <div className="recording-dot"></div>
          Recording...
        </div>
      )}
    </div>
  );
};

export default FullMixingBoard;
