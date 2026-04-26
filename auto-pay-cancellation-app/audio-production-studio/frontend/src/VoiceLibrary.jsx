import React, { useState, useEffect } from 'react';
import './VoiceLibrary.css';

const VoiceLibrary = () => {
  const [voices, setVoices] = useState([]);
  const [savedVoices, setSavedVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('library');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [previewText, setPreviewText] = useState('Hello, this is a voice preview');
  const [playing, setPlaying] = useState(null);
  const [voiceName, setVoiceName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchVoices();
    fetchSavedVoices();
  }, []);

  const fetchVoices = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/voices');
      const data = await response.json();
      if (data.success) {
        setVoices(data.voices);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      setMessage('❌ Failed to fetch ElevenLabs voices');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedVoices = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/voices/saved');
      const data = await response.json();
      if (data.success) {
        setSavedVoices(data.voices);
      }
    } catch (error) {
      console.error('Error fetching saved voices:', error);
    }
  };

  const saveVoice = async (voice) => {
    if (!voiceName) {
      setMessage('❌ Please enter a name for this voice');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/voices/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: voice.voice_id,
          voiceName: voiceName,
          provider: 'elevenlabs',
          voiceData: {
            name: voice.name,
            accent: voice.accent || 'neutral',
            description: voice.description || '',
            previewUrl: voice.preview_url || '',
            labels: voice.labels || {}
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setSavedVoices([...savedVoices, data.voice]);
        setMessage(`✅ Voice "${voiceName}" saved!`);
        setVoiceName('');
        setSelectedVoice(null);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('❌ Failed to save voice');
    } finally {
      setLoading(false);
    }
  };

  const playPreview = async (voiceId) => {
    setPlaying(voiceId);
    try {
      const response = await fetch('http://localhost:3000/api/voices/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: voiceId,
          text: previewText
        })
      });

      const data = await response.json();
      if (data.success && data.audioUrl) {
        const audio = new Audio(`http://localhost:3000${data.audioUrl}`);
        audio.play();
        audio.onended = () => setPlaying(null);
      }
    } catch (error) {
      console.error('Error playing preview:', error);
      setPlaying(null);
    }
  };

  const deleteSavedVoice = async (id) => {
    if (!window.confirm('Delete this saved voice?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/voices/saved/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setSavedVoices(savedVoices.filter(v => v.id !== id));
        setMessage('✅ Voice deleted');
      }
    } catch (error) {
      setMessage('❌ Failed to delete voice');
    }
  };

  const filteredVoices = voices.filter(v =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.accent && v.accent.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="voice-library-container">
      <div className="library-header">
        <h1>🎤 Voice Library</h1>
        <p>Choose from ElevenLabs or use your saved voices</p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="library-tabs">
        <button
          className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          🌐 ElevenLabs Library ({voices.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          ⭐ Saved Voices ({savedVoices.length})
        </button>
      </div>

      {/* ElevenLabs Voice Library */}
      {activeTab === 'library' && (
        <div className="tab-content">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search voices by name or accent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button onClick={fetchVoices} disabled={loading} className="btn-refresh">
              {loading ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {selectedVoice && (
            <div className="voice-detail-panel">
              <div className="detail-header">
                <h2>{selectedVoice.name}</h2>
                <button onClick={() => setSelectedVoice(null)} className="btn-close">✕</button>
              </div>

              <div className="detail-content">
                <div className="detail-info">
                  <p><strong>Accent:</strong> {selectedVoice.accent || 'Neutral'}</p>
                  <p><strong>Description:</strong> {selectedVoice.description || 'Professional voice'}</p>
                  {selectedVoice.labels && Object.keys(selectedVoice.labels).length > 0 && (
                    <div className="labels">
                      <strong>Labels:</strong>
                      {Object.entries(selectedVoice.labels).map(([key, value]) => (
                        <span key={key} className="label-tag">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="preview-section">
                  <h3>Preview Text</h3>
                  <textarea
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Enter text for preview..."
                    rows="3"
                  />
                  <button
                    onClick={() => playPreview(selectedVoice.voice_id)}
                    disabled={playing === selectedVoice.voice_id}
                    className="btn-preview"
                  >
                    {playing === selectedVoice.voice_id ? '🔊 Playing...' : '🔊 Listen'}
                  </button>
                </div>

                <div className="save-section">
                  <h3>Save This Voice</h3>
                  <input
                    type="text"
                    placeholder="Give this voice a name (e.g., 'Professional Male')"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    className="voice-name-input"
                  />
                  <button
                    onClick={() => saveVoice(selectedVoice)}
                    disabled={loading || !voiceName}
                    className="btn-save-voice"
                  >
                    {loading ? '💾 Saving...' : '💾 Save to My Library'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="voices-grid">
            {filteredVoices.length === 0 ? (
              <div className="empty-state">
                {voices.length === 0 ? (
                  <>
                    <p>📡 Loading ElevenLabs voices...</p>
                    <p className="small">Make sure ElevenLabs API key is configured</p>
                  </>
                ) : (
                  <p>No voices found matching "{searchTerm}"</p>
                )}
              </div>
            ) : (
              filteredVoices.map(voice => (
                <div
                  key={voice.voice_id}
                  className={`voice-card ${selectedVoice?.voice_id === voice.voice_id ? 'selected' : ''}`}
                  onClick={() => setSelectedVoice(voice)}
                >
                  <div className="voice-card-header">
                    <h3>{voice.name}</h3>
                    <span className="accent-badge">{voice.accent || 'Neutral'}</span>
                  </div>

                  <p className="voice-description">
                    {voice.description || 'Professional voice'}
                  </p>

                  {voice.labels && Object.keys(voice.labels).length > 0 && (
                    <div className="voice-labels">
                      {Object.entries(voice.labels).slice(0, 3).map(([key, value]) => (
                        <span key={key} className="label">
                          {value}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="voice-card-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playPreview(voice.voice_id);
                      }}
                      disabled={playing === voice.voice_id}
                      className="btn-play"
                    >
                      {playing === voice.voice_id ? '🔊' : '▶️'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVoice(voice);
                      }}
                      className="btn-select"
                    >
                      View & Save
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Saved Voices */}
      {activeTab === 'saved' && (
        <div className="tab-content">
          {savedVoices.length === 0 ? (
            <div className="empty-state">
              <p>⭐ No saved voices yet</p>
              <p className="small">Go to ElevenLabs Library and save voices to use them here</p>
            </div>
          ) : (
            <div className="saved-voices-grid">
              {savedVoices.map(voice => (
                <div key={voice.id} className="saved-voice-card">
                  <div className="saved-voice-header">
                    <h3>{voice.customName || voice.voiceData.name}</h3>
                    <span className="provider-badge">{voice.provider}</span>
                  </div>

                  <p className="saved-voice-accent">
                    {voice.voiceData.accent || 'Neutral Accent'}
                  </p>

                  {voice.voiceData.description && (
                    <p className="saved-voice-desc">{voice.voiceData.description}</p>
                  )}

                  <div className="saved-voice-actions">
                    <button
                      onClick={() => playPreview(voice.voiceId)}
                      disabled={playing === voice.voiceId}
                      className="btn-preview-saved"
                    >
                      {playing === voice.voiceId ? '🔊 Playing...' : '🔊 Preview'}
                    </button>
                    <button
                      onClick={() => deleteSavedVoice(voice.id)}
                      className="btn-delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  <div className="saved-voice-meta">
                    <span>📅 {new Date(voice.createdAt).toLocaleDateString()}</span>
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

export default VoiceLibrary;
