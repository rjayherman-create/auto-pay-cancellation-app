import React, { useState, useEffect } from 'react';
import './CartoonSoundEffects.css';

const CartoonSoundEffects = () => {
  const [availableEffects, setAvailableEffects] = useState([]);
  const [savedEffects, setSavedEffects] = useState([]);
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);

  // Effect customization
  const [duration, setDuration] = useState(0.5);
  const [pitch, setPitch] = useState(1.0);
  const [intensity, setIntensity] = useState(1.0);
  const [reverb, setReverb] = useState(0.2);
  const [speed, setSpeed] = useState(1.0);
  const [autoSave, setAutoSave] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);

  // Load data on mount
  useEffect(() => {
    fetchAvailableEffects();
    fetchSavedEffects();
    fetchStatistics();
  }, []);

  const fetchAvailableEffects = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/sound-effects/available');
      const data = await response.json();
      if (data.success) {
        setAvailableEffects(data.effects);
      }
    } catch (error) {
      console.error('Error fetching effects:', error);
      setMessage('Failed to load available effects');
    }
  };

  const fetchSavedEffects = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/sound-effects/library');
      const data = await response.json();
      if (data.success) {
        setSavedEffects(data.effects);
      }
    } catch (error) {
      console.error('Error fetching saved effects:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/sound-effects/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      handleSearch(query);
    } else {
      fetchAvailableEffects();
    }
  };

  const handleSearch = async (query) => {
    try {
      const response = await fetch(`http://localhost:3000/api/sound-effects/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setAvailableEffects(data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const filterByCategory = (category) => {
    setCurrentCategory(category);
    if (category === 'all') {
      fetchAvailableEffects();
    } else {
      // Filter locally
      const filtered = availableEffects.filter(e => e.category === category);
      setAvailableEffects(filtered);
    }
  };

  const handleGenerateEffect = async (effect) => {
    setSelectedEffect(effect);
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/sound-effects/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          effectId: effect.id,
          duration: duration,
          pitch: pitch,
          intensity: intensity,
          reverb: reverb,
          speed: speed,
          save: autoSave
        })
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedAudioUrl(data.effect.audioUrl);
        setMessage(`✅ Sound effect generated! "${data.effect.name}" is ready.`);
        
        if (autoSave) {
          fetchSavedEffects();
        }
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      setMessage('Failed to generate effect');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEffect = async () => {
    if (!selectedEffect || !generatedAudioUrl) {
      setMessage('Generate an effect first');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/sound-effects/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedEffect.id + '_' + Date.now(),
          name: selectedEffect.name,
          effectId: selectedEffect.id,
          category: selectedEffect.category,
          audioUrl: generatedAudioUrl,
          filePath: `uploads/sound-effects/${selectedEffect.id}.wav`,
          duration: duration,
          pitch: pitch,
          intensity: intensity,
          reverb: reverb,
          speed: speed,
          parameters: selectedEffect.parameters
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Effect saved to library!');
        fetchSavedEffects();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage('Failed to save effect');
    }
  };

  const handleDeleteEffect = async (effectId) => {
    if (!window.confirm('Delete this effect?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/sound-effects/library/${effectId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Effect deleted');
        fetchSavedEffects();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage('Failed to delete effect');
    }
  };

  const getCategories = () => {
    if (!availableEffects.length) return [];
    const cats = [...new Set(availableEffects.map(e => e.category))];
    return ['all', ...cats];
  };

  const displayedEffects = currentCategory === 'all'
    ? availableEffects
    : availableEffects.filter(e => e.category === currentCategory);

  return (
    <div className="sound-effects-container">
      <div className="sound-effects-header">
        <h1>🎬 Cartoon Sound Effects Generator</h1>
        <p>Create professional cartoon sound effects instantly</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          🎵 Browse Effects ({availableEffects.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
          onClick={() => setActiveTab('generator')}
        >
          ⚙️ Generate Custom
        </button>
        <button
          className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          📚 My Library ({savedEffects.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
      </div>

      {/* Tab: Browse Effects */}
      {activeTab === 'browse' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>🎵 Browse Sound Effects Library</h2>
            <p>Select an effect and customize it</p>
          </div>

          {/* Search */}
          <div className="search-section">
            <input
              type="text"
              placeholder="Search effects... (jump, crash, beep, etc.)"
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>

          {/* Category Filter */}
          <div className="category-filter">
            <h3>Categories:</h3>
            <div className="category-buttons">
              {getCategories().map(cat => (
                <button
                  key={cat}
                  className={`category-btn ${currentCategory === cat ? 'active' : ''}`}
                  onClick={() => filterByCategory(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Effects Grid */}
          <div className="effects-grid">
            {displayedEffects.length === 0 ? (
              <div className="empty-state">
                <p>No effects found</p>
              </div>
            ) : (
              displayedEffects.map(effect => (
                <div key={effect.id} className="effect-card">
                  <div className="effect-header">
                    <h3>{effect.name}</h3>
                    <span className="category-badge">{effect.category}</span>
                  </div>
                  <p className="effect-description">{effect.description}</p>
                  <div className="effect-meta">
                    <span className="duration">⏱️ {effect.duration}s</span>
                    <span className="type">🎹 {effect.type}</span>
                  </div>
                  <button
                    className="btn-generate"
                    onClick={() => handleGenerateEffect(effect)}
                    disabled={loading}
                  >
                    {loading && selectedEffect?.id === effect.id ? '🔄 Generating...' : '▶️ Generate'}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Generated Audio */}
          {generatedAudioUrl && (
            <div className="generated-section">
              <h3>🎵 Generated Audio</h3>
              <audio
                src={`http://localhost:3000${generatedAudioUrl}`}
                controls
                className="audio-player"
              />
              <div className="action-buttons">
                <button onClick={handleSaveEffect} className="btn-save">
                  💾 Save to Library
                </button>
                <a
                  href={`http://localhost:3000${generatedAudioUrl}`}
                  download
                  className="btn-download"
                >
                  📥 Download WAV
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Generate Custom */}
      {activeTab === 'generator' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>⚙️ Generate Custom Sound Effect</h2>
            <p>Customize all parameters for your perfect sound</p>
          </div>

          {selectedEffect ? (
            <div className="generator-panel">
              <div className="selected-effect-info">
                <h3>{selectedEffect.name}</h3>
                <p>{selectedEffect.description}</p>
              </div>

              <div className="controls-section">
                <h3>🎚️ Customize Effect</h3>

                <div className="control-grid">
                  <div className="control-item">
                    <label>Duration: {duration.toFixed(2)}s</label>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={duration}
                      onChange={(e) => setDuration(parseFloat(e.target.value))}
                      className="slider"
                    />
                  </div>

                  <div className="control-item">
                    <label>Pitch: {pitch.toFixed(2)}x</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={pitch}
                      onChange={(e) => setPitch(parseFloat(e.target.value))}
                      className="slider"
                    />
                  </div>

                  <div className="control-item">
                    <label>Intensity: {intensity.toFixed(2)}x</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={intensity}
                      onChange={(e) => setIntensity(parseFloat(e.target.value))}
                      className="slider"
                    />
                  </div>

                  <div className="control-item">
                    <label>Reverb: {reverb.toFixed(2)}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={reverb}
                      onChange={(e) => setReverb(parseFloat(e.target.value))}
                      className="slider"
                    />
                  </div>

                  <div className="control-item">
                    <label>Speed: {speed.toFixed(2)}x</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="slider"
                    />
                  </div>

                  <div className="control-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={autoSave}
                        onChange={(e) => setAutoSave(e.target.checked)}
                      />
                      Auto-save generated effects
                    </label>
                  </div>
                </div>

                <button
                  className="btn-generate-large"
                  onClick={() => handleGenerateEffect(selectedEffect)}
                  disabled={loading}
                >
                  {loading ? '🔄 Generating...' : '🎵 Generate Sound Effect'}
                </button>
              </div>

              {generatedAudioUrl && (
                <div className="generated-section">
                  <h3>🎵 Your Generated Sound</h3>
                  <audio
                    src={`http://localhost:3000${generatedAudioUrl}`}
                    controls
                    className="audio-player"
                    autoPlay
                  />
                  <div className="action-buttons">
                    <button onClick={handleSaveEffect} className="btn-save">
                      💾 Save to Library
                    </button>
                    <a
                      href={`http://localhost:3000${generatedAudioUrl}`}
                      download
                      className="btn-download"
                    >
                      📥 Download WAV
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>👈 Select an effect from the Browse tab first</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: My Library */}
      {activeTab === 'library' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>📚 My Sound Effects Library</h2>
            <p>All your saved cartoon sound effects</p>
          </div>

          {savedEffects.length === 0 ? (
            <div className="empty-state">
              <p>No saved effects yet. Generate and save some!</p>
            </div>
          ) : (
            <div className="library-grid">
              {savedEffects.map(effect => (
                <div key={effect.id} className="library-card">
                  <div className="card-header">
                    <h3>{effect.name}</h3>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteEffect(effect.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="card-body">
                    <p className="category-badge">{effect.category}</p>
                    <audio
                      src={`http://localhost:3000${effect.audioUrl}`}
                      controls
                      className="audio-preview"
                    />

                    <div className="stats-mini">
                      <span>⏱️ {effect.duration.toFixed(2)}s</span>
                      <span>🎹 Pitch: {effect.pitch}x</span>
                      <span>📊 Uses: {effect.usageCount}</span>
                    </div>

                    <a
                      href={`http://localhost:3000${effect.audioUrl}`}
                      download
                      className="btn-download-small"
                    >
                      📥 Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Statistics */}
      {activeTab === 'stats' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>📊 Sound Effects Statistics</h2>
            <p>Library and usage information</p>
          </div>

          {stats ? (
            <div className="stats-section">
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-number">{stats.totalAvailable}</div>
                  <div className="stat-label">Available Effects</div>
                </div>
                <div className="stat-box">
                  <div className="stat-number">{stats.totalSaved}</div>
                  <div className="stat-label">Saved Effects</div>
                </div>
                <div className="stat-box">
                  <div className="stat-number">{stats.categories.length}</div>
                  <div className="stat-label">Categories</div>
                </div>
              </div>

              <div className="category-breakdown">
                <h3>Effects by Category</h3>
                <div className="category-list">
                  {Object.entries(stats.categoryCounts).map(([cat, count]) => (
                    <div key={cat} className="category-item">
                      <span className="cat-name">{cat}</span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${(count / stats.totalAvailable) * 100}%` }}
                        />
                      </div>
                      <span className="count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {stats.mostUsed && stats.mostUsed.length > 0 && (
                <div className="top-effects">
                  <h3>Most Used Effects</h3>
                  <div className="effect-list">
                    {stats.mostUsed.map((effect, idx) => (
                      <div key={effect.id} className="effect-row">
                        <span className="rank">#{idx + 1}</span>
                        <span className="name">{effect.name}</span>
                        <span className="uses">{effect.usageCount} uses</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="loading">Loading statistics...</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CartoonSoundEffects;
