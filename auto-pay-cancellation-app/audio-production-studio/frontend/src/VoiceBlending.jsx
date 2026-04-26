import React, { useState, useEffect } from 'react';
import './VoiceBlending.css';

const VoiceBlending = () => {
  const [availableVoices, setAvailableVoices] = useState([]);
  const [blendedVoices, setBlendedVoices] = useState([]);
  const [selectedVoice1, setSelectedVoice1] = useState('');
  const [selectedVoice2, setSelectedVoice2] = useState('');
  const [voice1Weight, setVoice1Weight] = useState(50);
  const [blendName, setBlendName] = useState('');
  const [sampleText, setSampleText] = useState('Hello, this is a blended voice sample.');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('blend');
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generateText, setGenerateText] = useState('Hello there!');
  const [selectedBlendedVoice, setSelectedBlendedVoice] = useState('');
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [audioPitch, setAudioPitch] = useState(1.0);
  const [playingAudio, setPlayingAudio] = useState(null);

  // Fetch available voices on load
  useEffect(() => {
    fetchAvailableVoices();
    fetchBlendedVoices();
  }, []);

  const fetchAvailableVoices = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/voice-blending/voices');
      const data = await response.json();
      if (data.success) {
        setAvailableVoices(data.voices);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      setMessage('Failed to load voices');
    }
  };

  const fetchBlendedVoices = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/voice-blending/blended');
      const data = await response.json();
      if (data.success) {
        setBlendedVoices(data.voices);
      }
    } catch (error) {
      console.error('Error fetching blended voices:', error);
    }
  };

  const handleBlendVoices = async (e) => {
    e.preventDefault();

    if (!selectedVoice1 || !selectedVoice2) {
      setMessage('Please select two voices to blend');
      return;
    }

    if (selectedVoice1 === selectedVoice2) {
      setMessage('Please select different voices');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/voice-blending/blend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          voice1Id: selectedVoice1,
          voice2Id: selectedVoice2,
          blendName: blendName || `Blend of ${selectedVoice1} & ${selectedVoice2}`,
          voice1Weight: voice1Weight / 100,
          voice2Weight: (100 - voice1Weight) / 100,
          sampleText: sampleText,
          description: description
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Voice blended successfully! "${data.blendedVoice.name}" is ready.`);
        fetchBlendedVoices();
        // Reset form
        setSelectedVoice1('');
        setSelectedVoice2('');
        setVoice1Weight(50);
        setBlendName('');
        setDescription('');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Blending error:', error);
      setMessage('Failed to blend voices');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAudio = async (e) => {
    e.preventDefault();

    if (!selectedBlendedVoice || !generateText) {
      setMessage('Please select a blended voice and enter text');
      return;
    }

    setGeneratingAudio(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/voice-blending/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blendedVoiceId: selectedBlendedVoice,
          text: generateText,
          speed: audioSpeed,
          pitch: audioPitch
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Audio generated successfully!');
        setPlayingAudio(data.audio.audioUrl);
        // Refresh blended voices to update usage count
        fetchBlendedVoices();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      setMessage('Failed to generate audio');
    } finally {
      setGeneratingAudio(false);
    }
  };

  const handleDeleteBlendedVoice = async (voiceId) => {
    if (!window.confirm('Are you sure you want to delete this blended voice?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/voice-blending/blended/${voiceId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Blended voice deleted');
        fetchBlendedVoices();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage('Failed to delete voice');
    }
  };

  return (
    <div className="voice-blending-container">
      <div className="voice-blending-header">
        <h1>🎙️ Voice Blending Studio</h1>
        <p>Blend two cartoon voices to create a unique new voice</p>
      </div>

      {/* Tab Navigation */}
      <div className="voice-blending-tabs">
        <button
          className={`tab-btn ${activeTab === 'blend' ? 'active' : ''}`}
          onClick={() => setActiveTab('blend')}
        >
          ➕ Create Blend
        </button>
        <button
          className={`tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          🎤 Generate Audio
        </button>
        <button
          className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          📚 My Blends ({blendedVoices.length})
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Tab Content: Create Blend */}
      {activeTab === 'blend' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Blend Two Voices</h2>
            <p>Select two different voices and set the blend ratio</p>
          </div>

          <form onSubmit={handleBlendVoices} className="blend-form">
            <div className="form-section">
              <h3>📢 Step 1: Select Voices</h3>
              
              <div className="voice-selector-group">
                <div className="voice-selector">
                  <label>First Voice (Voice 1)</label>
                  <select
                    value={selectedVoice1}
                    onChange={(e) => setSelectedVoice1(e.target.value)}
                    className="voice-select"
                  >
                    <option value="">-- Select first voice --</option>
                    {availableVoices.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} - {voice.category}
                      </option>
                    ))}
                  </select>
                  {selectedVoice1 && (
                    <div className="voice-preview">
                      {availableVoices.find(v => v.id === selectedVoice1)?.description}
                    </div>
                  )}
                </div>

                <div className="voice-selector">
                  <label>Second Voice (Voice 2)</label>
                  <select
                    value={selectedVoice2}
                    onChange={(e) => setSelectedVoice2(e.target.value)}
                    className="voice-select"
                  >
                    <option value="">-- Select second voice --</option>
                    {availableVoices.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} - {voice.category}
                      </option>
                    ))}
                  </select>
                  {selectedVoice2 && (
                    <div className="voice-preview">
                      {availableVoices.find(v => v.id === selectedVoice2)?.description}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>⚙️ Step 2: Set Blend Ratio</h3>
              
              <div className="blend-ratio-control">
                <div className="ratio-display">
                  <span className="ratio-label voice1-label">Voice 1</span>
                  <span className="ratio-percentage">{voice1Weight}%</span>
                  <span className="ratio-label">-</span>
                  <span className="ratio-percentage">{100 - voice1Weight}%</span>
                  <span className="ratio-label voice2-label">Voice 2</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={voice1Weight}
                  onChange={(e) => setVoice1Weight(parseInt(e.target.value))}
                  className="blend-slider"
                />
                <div className="slider-labels">
                  <span>100% Voice 1</span>
                  <span>50% / 50%</span>
                  <span>100% Voice 2</span>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>📝 Step 3: Name & Description</h3>
              
              <div className="form-group">
                <label>Blend Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Heroic Villain Mix"
                  value={blendName}
                  onChange={(e) => setBlendName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  placeholder="Describe this blend... e.g., 'Brave hero with menacing undertones'"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea"
                  rows="3"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>🎤 Step 4: Sample Text for Preview</h3>
              
              <div className="form-group">
                <label>Sample Text</label>
                <textarea
                  placeholder="Enter text to hear the blended voice sample..."
                  value={sampleText}
                  onChange={(e) => setSampleText(e.target.value)}
                  className="form-textarea"
                  rows="3"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedVoice1 || !selectedVoice2}
              className="btn-blend"
            >
              {loading ? '🔄 Blending...' : '✨ Create Blended Voice'}
            </button>
          </form>
        </div>
      )}

      {/* Tab Content: Generate Audio */}
      {activeTab === 'generate' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Generate Audio with Blended Voice</h2>
            <p>Use your blended voices to generate speech</p>
          </div>

          {blendedVoices.length === 0 ? (
            <div className="empty-state">
              <p>No blended voices yet. Create one first!</p>
            </div>
          ) : (
            <form onSubmit={handleGenerateAudio} className="generate-form">
              <div className="form-section">
                <h3>🎙️ Select Blended Voice</h3>
                
                <select
                  value={selectedBlendedVoice}
                  onChange={(e) => setSelectedBlendedVoice(e.target.value)}
                  className="voice-select"
                >
                  <option value="">-- Select a blended voice --</option>
                  {blendedVoices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name} ({voice.metadata.blendRatio})
                    </option>
                  ))}
                </select>

                {selectedBlendedVoice && (
                  <div className="voice-info">
                    {blendedVoices.find(v => v.id === selectedBlendedVoice) && (
                      <>
                        <p className="blend-info">
                          {blendedVoices.find(v => v.id === selectedBlendedVoice).metadata.blendRatio}
                        </p>
                        <audio
                          src={blendedVoices.find(v => v.id === selectedBlendedVoice).sampleAudioUrl}
                          controls
                          className="audio-preview"
                        />
                        <p className="usage-info">
                          Usage: {blendedVoices.find(v => v.id === selectedBlendedVoice).usageCount} times
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="form-section">
                <h3>✍️ Enter Text</h3>
                
                <textarea
                  placeholder="Enter the text you want to generate..."
                  value={generateText}
                  onChange={(e) => setGenerateText(e.target.value)}
                  className="form-textarea"
                  rows="4"
                />
              </div>

              <div className="form-section">
                <h3>🎚️ Audio Settings</h3>
                
                <div className="settings-grid">
                  <div className="setting-item">
                    <label>Speed: {audioSpeed.toFixed(2)}x</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={audioSpeed}
                      onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
                      className="slider"
                    />
                  </div>

                  <div className="setting-item">
                    <label>Pitch: {audioPitch.toFixed(2)}x</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={audioPitch}
                      onChange={(e) => setAudioPitch(parseFloat(e.target.value))}
                      className="slider"
                    />
                  </div>
                </div>
              </div>

              {playingAudio && (
                <div className="form-section">
                  <h3>🎵 Generated Audio</h3>
                  <audio src={playingAudio} controls className="audio-player" autoPlay />
                  <a href={playingAudio} download className="btn-download">
                    📥 Download Audio
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={generatingAudio || !selectedBlendedVoice || !generateText}
                className="btn-generate"
              >
                {generatingAudio ? '🔄 Generating...' : '🎤 Generate Audio'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab Content: My Blends */}
      {activeTab === 'library' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>My Blended Voices</h2>
            <p>All your custom blended voices</p>
          </div>

          {blendedVoices.length === 0 ? (
            <div className="empty-state">
              <p>No blended voices yet. Create your first one!</p>
            </div>
          ) : (
            <div className="blended-voices-grid">
              {blendedVoices.map((voice) => (
                <div key={voice.id} className="voice-card">
                  <div className="card-header">
                    <h3>{voice.name}</h3>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteBlendedVoice(voice.id)}
                      title="Delete this blended voice"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="card-body">
                    <p className="description">{voice.description}</p>

                    <div className="blend-ratio">
                      <span className="ratio-info">
                        {voice.metadata.blendRatio}
                      </span>
                    </div>

                    <div className="audio-preview-section">
                      <p className="preview-label">Sample Audio:</p>
                      <audio
                        src={voice.sampleAudioUrl}
                        controls
                        className="audio-preview"
                      />
                    </div>

                    <div className="stats">
                      <div className="stat">
                        <span className="stat-label">Uses:</span>
                        <span className="stat-value">{voice.usageCount}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Created:</span>
                        <span className="stat-value">
                          {new Date(voice.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceBlending;
