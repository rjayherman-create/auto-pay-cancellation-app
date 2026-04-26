import React, { useState, useEffect } from 'react';
import './ProfessionalAudioMixer.css';

const ProfessionalAudioMixer = () => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Track editing
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [trackType, setTrackType] = useState('voiceover');
  const [trackName, setTrackName] = useState('');
  const [trackDuration, setTrackDuration] = useState(0);
  
  // Effects
  const [eqPresets, setEqPresets] = useState({});
  const [compressionPresets, setCompressionPresets] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState(null);
  const [tutorials, setTutorials] = useState({});

  // Load data on mount
  useEffect(() => {
    fetchProjects();
    fetchPresets();
    fetchTutorials();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/mixer/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchPresets = async () => {
    try {
      const [eqRes, compRes] = await Promise.all([
        fetch('http://localhost:3000/api/mixer/presets/eq'),
        fetch('http://localhost:3000/api/mixer/presets/compression')
      ]);
      const eqData = await eqRes.json();
      const compData = await compRes.json();
      if (eqData.success) setEqPresets(eqData.presets);
      if (compData.success) setCompressionPresets(compData.presets);
    } catch (error) {
      console.error('Error fetching presets:', error);
    }
  };

  const fetchTutorials = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/mixer/tutorials');
      const data = await response.json();
      if (data.success) {
        setTutorials(data.tutorials);
      }
    } catch (error) {
      console.error('Error fetching tutorials:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName) {
      setMessage('Please enter a project name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/mixer/project/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: newProjectName })
      });

      const data = await response.json();
      if (data.success) {
        setProjects([...projects, data.project]);
        setCurrentProject(data.project);
        setNewProjectName('');
        setActiveTab('mixer');
        setMessage('✅ Project created!');
      }
    } catch (error) {
      setMessage('❌ Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = async (projectId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/mixer/project/${projectId}`);
      const data = await response.json();
      if (data.success) {
        setCurrentProject(data.project);
        setActiveTab('mixer');
      }
    } catch (error) {
      console.error('Error opening project:', error);
    }
  };

  const handleAddTrack = async () => {
    if (!currentProject || !trackName) {
      setMessage('Please enter track name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/mixer/track/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          trackData: {
            type: trackType,
            name: trackName,
            duration: trackDuration,
            volume: 1.0,
            audioUrl: ''
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentProject(data.project);
        setTrackName('');
        setTrackDuration(0);
        setMessage('✅ Track added!');
      }
    } catch (error) {
      setMessage('❌ Failed to add track');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTrackVolume = async (trackId, volume) => {
    try {
      const response = await fetch(`http://localhost:3000/api/mixer/track/${trackId}/volume`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          volume: volume
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentProject(prev => ({
          ...prev,
          tracks: prev.tracks.map(t => t.id === trackId ? data.track : t)
        }));
      }
    } catch (error) {
      console.error('Error updating volume:', error);
    }
  };

  const handleGetRecommendations = async () => {
    if (!currentProject) return;

    try {
      const response = await fetch('http://localhost:3000/api/mixer/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProject.id })
      });

      const data = await response.json();
      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleGetStats = async () => {
    if (!currentProject) return;

    try {
      const response = await fetch('http://localhost:3000/api/mixer/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProject.id })
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleExport = async () => {
    if (!currentProject) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/mixer/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProject.id, format: 'wav' })
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`✅ Mix exported: ${data.export.fileName}`);
      }
    } catch (error) {
      setMessage('❌ Failed to export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mixer-container">
      <div className="mixer-header">
        <h1>🎚️ Professional Audio Mixer</h1>
        <p>Mix voices, music, and sound effects into polished productions</p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mixer-tabs">
        <button
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          📁 Projects ({projects.length})
        </button>
        {currentProject && (
          <>
            <button
              className={`tab-btn ${activeTab === 'mixer' ? 'active' : ''}`}
              onClick={() => setActiveTab('mixer')}
            >
              🎚️ Mixer
            </button>
            <button
              className={`tab-btn ${activeTab === 'effects' ? 'active' : ''}`}
              onClick={() => setActiveTab('effects')}
            >
              ⚡ Effects & EQ
            </button>
            <button
              className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              📊 Analysis
            </button>
            <button
              className={`tab-btn ${activeTab === 'tutorials' ? 'active' : ''}`}
              onClick={() => setActiveTab('tutorials')}
            >
              📚 Tutorials
            </button>
          </>
        )}
      </div>

      {/* Tab: Projects */}
      {activeTab === 'projects' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>📁 Mixing Projects</h2>
            <p>Create or open a mixing project</p>
          </div>

          <div className="create-project-panel">
            <h3>Create New Project</h3>
            <div className="create-form">
              <input
                type="text"
                placeholder="Project name (e.g., 'Cartoon Episode 1')"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="form-input"
              />
              <button
                onClick={handleCreateProject}
                disabled={loading}
                className="btn-create"
              >
                {loading ? '🔄 Creating...' : '➕ Create Project'}
              </button>
            </div>
          </div>

          {projects.length > 0 && (
            <div className="projects-grid">
              {projects.map(project => (
                <div key={project.id} className="project-card">
                  <h3>{project.name}</h3>
                  <div className="project-info">
                    <span>⏱️ {project.duration}s</span>
                    <span>🎵 {project.tracks.length} tracks</span>
                    <span>📅 {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => handleOpenProject(project.id)}
                    className="btn-open"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Mixer */}
      {activeTab === 'mixer' && currentProject && (
        <div className="tab-content">
          <div className="section-header">
            <h2>🎚️ {currentProject.name}</h2>
            <p>Mix your audio tracks</p>
          </div>

          {/* Add Track Section */}
          <div className="add-track-section">
            <h3>➕ Add Track</h3>
            <div className="add-track-form">
              <select
                value={trackType}
                onChange={(e) => setTrackType(e.target.value)}
                className="form-select"
              >
                <option value="voiceover">Voiceover</option>
                <option value="music">Background Music</option>
                <option value="soundeffect">Sound Effect</option>
                <option value="ambience">Ambience</option>
              </select>
              <input
                type="text"
                placeholder="Track name"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                className="form-input"
              />
              <input
                type="number"
                placeholder="Duration (seconds)"
                value={trackDuration}
                onChange={(e) => setTrackDuration(parseFloat(e.target.value))}
                className="form-input"
              />
              <button onClick={handleAddTrack} disabled={loading} className="btn-add">
                {loading ? '🔄 Adding...' : '➕ Add Track'}
              </button>
            </div>
          </div>

          {/* Tracks List */}
          <div className="tracks-section">
            <h3>🎵 Tracks ({currentProject.tracks.length})</h3>
            {currentProject.tracks.length === 0 ? (
              <p className="empty">No tracks yet. Add one above!</p>
            ) : (
              <div className="tracks-list">
                {currentProject.tracks.map(track => (
                  <div key={track.id} className="track-item">
                    <div className="track-header">
                      <h4>{track.name}</h4>
                      <span className="track-type">{track.type}</span>
                    </div>
                    <div className="track-controls">
                      <div className="control-group">
                        <label>Volume: {track.volume.toFixed(1)}x</label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={track.volume}
                          onChange={(e) => handleUpdateTrackVolume(track.id, parseFloat(e.target.value))}
                          className="slider"
                        />
                      </div>
                      <div className="control-group">
                        <label>Pan: {track.pan > 0 ? 'R' : track.pan < 0 ? 'L' : 'C'}</label>
                        <input
                          type="range"
                          min="-1"
                          max="1"
                          step="0.1"
                          value={track.pan}
                          className="slider"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Master Section */}
          <div className="master-section">
            <h3>🎚️ Master Control</h3>
            <div className="master-controls">
              <div className="control-group">
                <label>Master Gain: {currentProject.masterGain.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={currentProject.masterGain}
                  className="slider"
                />
              </div>
            </div>
          </div>

          {/* Export Button */}
          <button onClick={handleExport} disabled={loading} className="btn-export">
            {loading ? '🔄 Exporting...' : '💾 Export Mix'}
          </button>
        </div>
      )}

      {/* Tab: Effects & EQ */}
      {activeTab === 'effects' && currentProject && (
        <div className="tab-content">
          <div className="section-header">
            <h2>⚡ Effects & EQ</h2>
            <p>Professional audio processing</p>
          </div>

          {/* EQ Presets */}
          <div className="presets-section">
            <h3>🎛️ EQ Presets</h3>
            <div className="presets-grid">
              {Object.entries(eqPresets).map(([name, values]) => (
                <div key={name} className="preset-card">
                  <h4>{name}</h4>
                  <div className="preset-values">
                    <span>Bass: {values.bass}</span>
                    <span>Mid: {values.mid}</span>
                    <span>Treble: {values.treble}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compression Presets */}
          <div className="presets-section">
            <h3>🔧 Compression Presets</h3>
            <div className="presets-grid">
              {Object.entries(compressionPresets).map(([name, values]) => (
                <div key={name} className="preset-card">
                  <h4>{name}</h4>
                  <div className="preset-values">
                    <span>Ratio: {values.ratio}:1</span>
                    <span>Threshold: {values.threshold}dB</span>
                    <span>Attack: {(values.attack * 1000).toFixed(0)}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Analysis */}
      {activeTab === 'analysis' && currentProject && (
        <div className="tab-content">
          <div className="section-header">
            <h2>📊 Mix Analysis</h2>
            <p>Professional analysis and recommendations</p>
          </div>

          <div className="analysis-buttons">
            <button onClick={handleGetRecommendations} className="btn-analysis">
              🔍 Get Recommendations
            </button>
            <button onClick={handleGetStats} className="btn-analysis">
              📈 View Statistics
            </button>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="recommendations-section">
              <h3>💡 Recommendations</h3>
              <div className="recommendations-list">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className={`recommendation ${rec.type}`}>
                    <span className="type">{rec.type.toUpperCase()}</span>
                    <span className="message">{rec.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          {stats && (
            <div className="stats-section">
              <h3>📊 Project Statistics</h3>
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-label">Total Tracks</div>
                  <div className="stat-value">{stats.totalTracks}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Voiceovers</div>
                  <div className="stat-value">{stats.tracksByType.voiceover}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Music</div>
                  <div className="stat-value">{stats.tracksByType.music}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Sound Effects</div>
                  <div className="stat-value">{stats.tracksByType.soundeffect}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Average Volume</div>
                  <div className="stat-value">{stats.averageVolume}x</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Master Gain</div>
                  <div className="stat-value">{(stats.masterGain).toFixed(1)}x</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Tutorials */}
      {activeTab === 'tutorials' && currentProject && (
        <div className="tab-content">
          <div className="section-header">
            <h2>📚 Mixing Tutorials</h2>
            <p>Professional mixing techniques</p>
          </div>

          <div className="tutorials-grid">
            {Object.entries(tutorials).map(([key, tutorial]) => (
              <div key={key} className="tutorial-card">
                <h3>{tutorial.title}</h3>
                <ol className="tutorial-steps">
                  {tutorial.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalAudioMixer;
