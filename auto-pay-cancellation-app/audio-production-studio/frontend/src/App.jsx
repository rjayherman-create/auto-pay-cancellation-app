import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import ProjectManager from './ProjectManager'
import './ProjectManager.css'
import VoiceLibrary from './VoiceLibrary'
import './VoiceLibrary.css'
import VoiceBlending from './VoiceBlending'
import './VoiceBlending.css'
import CartoonSoundEffects from './CartoonSoundEffects'
import './CartoonSoundEffects.css'
import VoiceEmotionEngine from './VoiceEmotionEngine'
import './VoiceEmotionEngine.css'
import ProfessionalAudioMixer from './ProfessionalAudioMixer'
import './ProfessionalAudioMixer.css'
import FullMixingBoard from './FullMixingBoard'
import './FullMixingBoard.css'
import WorkflowWizard from './WorkflowWizard'
import './WorkflowWizard.css'
import VideoStudio from './VideoStudio'
import './VideoStudio.css'
import MusicGeneratorApp from './MusicGeneratorApp'
import './MusicGeneratorApp.css'
import DocumentationMenu from './DocumentationMenu'
import VoiceEmotionsCartoon from './VoiceEmotionsCartoon'

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expandedSections, setExpandedSections] = useState({
    voice: false,
    audio: false,
    production: false,
    database: false
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleNavClick = (tab) => {
    setActiveTab(tab)
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <h1>🎬 Voice Over Studio</h1>
          <p>Professional Voice Generation, Audio Mixing, Video Creation & Music Production</p>
        </div>
      </header>

      <div className="layout">
        {/* Sidebar Navigation */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-toggle">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? '✕' : '☰'}
            </button>
          </div>

          <nav className="sidebar-nav">
            {/* Dashboard */}
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('dashboard')}
            >
              📊 Dashboard
            </button>

            {/* Quick Start */}
            <button 
              className={`nav-item ${activeTab === 'workflow' ? 'active' : ''}`}
              onClick={() => handleNavClick('workflow')}
            >
              🚀 Quick Start
            </button>

            {/* Projects */}
            <button 
              className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => handleNavClick('projects')}
            >
              📁 Projects
            </button>

            {/* Voice Tools Section */}
            <div className="nav-section">
              <button 
                className={`nav-section-title ${expandedSections.voice ? 'expanded' : ''}`}
                onClick={() => toggleSection('voice')}
              >
                <span>🎤 Voice Tools</span>
                <span className="toggle-arrow">{expandedSections.voice ? '▼' : '▶'}</span>
              </button>
              {expandedSections.voice && (
                <div className="nav-submenu">
                  <button 
                    className={`nav-item sub ${activeTab === 'voices' ? 'active' : ''}`}
                    onClick={() => handleNavClick('voices')}
                  >
                    Voice Library
                  </button>
                  <button 
                    className={`nav-item sub ${activeTab === 'voice' ? 'active' : ''}`}
                    onClick={() => handleNavClick('voice')}
                  >
                    Voice Generator
                  </button>
                  <button 
                    className={`nav-item sub ${activeTab === 'emotions-cartoon' ? 'active' : ''}`}
                    onClick={() => handleNavClick('emotions-cartoon')}
                  >
                    Emotions & Characters
                  </button>
                  <button 
                    className={`nav-item sub ${activeTab === 'blending' ? 'active' : ''}`}
                    onClick={() => handleNavClick('blending')}
                  >
                    Voice Blending
                  </button>
                  <button 
                    className={`nav-item sub ${activeTab === 'emotions' ? 'active' : ''}`}
                    onClick={() => handleNavClick('emotions')}
                  >
                    Voice Emotions
                  </button>
                </div>
              )}
            </div>

            {/* Audio Tools Section */}
            <div className="nav-section">
              <button 
                className={`nav-section-title ${expandedSections.audio ? 'expanded' : ''}`}
                onClick={() => toggleSection('audio')}
              >
                <span>🎵 Audio Tools</span>
                <span className="toggle-arrow">{expandedSections.audio ? '▼' : '▶'}</span>
              </button>
              {expandedSections.audio && (
                <div className="nav-submenu">
                  <button 
                    className={`nav-item sub ${activeTab === 'mixing' ? 'active' : ''}`}
                    onClick={() => handleNavClick('mixing')}
                  >
                    Audio Mixer
                  </button>
                  <button 
                    className={`nav-item sub ${activeTab === 'mixer' ? 'active' : ''}`}
                    onClick={() => handleNavClick('mixer')}
                  >
                    Mixing Board
                  </button>
                  <button 
                    className={`nav-item sub ${activeTab === 'effects' ? 'active' : ''}`}
                    onClick={() => handleNavClick('effects')}
                  >
                    Sound Effects
                  </button>
                </div>
              )}
            </div>

            {/* Production Tools Section */}
            <div className="nav-section">
              <button 
                className={`nav-section-title ${expandedSections.production ? 'expanded' : ''}`}
                onClick={() => toggleSection('production')}
              >
                <span>🎬 Production</span>
                <span className="toggle-arrow">{expandedSections.production ? '▼' : '▶'}</span>
              </button>
              {expandedSections.production && (
                <div className="nav-submenu">
                  <button 
                    className={`nav-item sub ${activeTab === 'video' ? 'active' : ''}`}
                    onClick={() => handleNavClick('video')}
                  >
                    Video Studio
                  </button>
                  <button 
                    className={`nav-item sub ${activeTab === 'music' ? 'active' : ''}`}
                    onClick={() => handleNavClick('music')}
                  >
                    Music Generator
                  </button>
                  <button 
                    className={`nav-item sub ${activeTab === 'animation' ? 'active' : ''}`}
                    onClick={() => handleNavClick('animation')}
                  >
                    Animation Sync
                  </button>
                  <button 
                    className={`nav-item sub ${activeTab === 'commercial' ? 'active' : ''}`}
                    onClick={() => handleNavClick('commercial')}
                  >
                    Commercial Gen
                  </button>
                </div>
              )}
            </div>

            {/* Database Section */}
            <div className="nav-section">
              <button 
                className={`nav-section-title ${expandedSections.database ? 'expanded' : ''}`}
                onClick={() => toggleSection('database')}
              >
                <span>📊 Databases</span>
                <span className="toggle-arrow">{expandedSections.database ? '▼' : '▶'}</span>
              </button>
              {expandedSections.database && (
                <div className="nav-submenu">
                  <div className="db-subsection">
                    <p className="db-label">Voice Data</p>
                    <button className="nav-item sub db-item">Voice Library</button>
                    <button className="nav-item sub db-item">Blended Voices</button>
                    <button className="nav-item sub db-item">Emotional Voices</button>
                  </div>
                  <div className="db-subsection">
                    <p className="db-label">Audio & Effects</p>
                    <button className="nav-item sub db-item">Sound Effects</button>
                    <button className="nav-item sub db-item">Mixer Projects</button>
                    <button className="nav-item sub db-item">Audio Files</button>
                  </div>
                  <div className="db-subsection">
                    <p className="db-label">Projects & Content</p>
                    <button className="nav-item sub db-item">Projects</button>
                    <button className="nav-item sub db-item">Videos</button>
                    <button className="nav-item sub db-item">Music Tracks</button>
                  </div>
                </div>
              )}
            </div>

            {/* Documentation Section */}
            <button 
              className={`nav-item ${activeTab === 'documentation' ? 'active' : ''}`}
              onClick={() => handleNavClick('documentation')}
            >
              📚 Documentation
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'workflow' && <WorkflowWizard />}
          {activeTab === 'voices' && <VoiceLibrary />}
          {activeTab === 'voice' && <VoiceGenerator />}
          {activeTab === 'emotions-cartoon' && <VoiceEmotionsCartoon />}
          {activeTab === 'blending' && <VoiceBlending />}
          {activeTab === 'emotions' && <VoiceEmotionEngine />}
          {activeTab === 'effects' && <CartoonSoundEffects />}
          {activeTab === 'projects' && <ProjectManager />}
          {activeTab === 'mixing' && <AudioMixer />}
          {activeTab === 'mixer' && <FullMixingBoard />}
          {activeTab === 'animation' && <AnimationSync />}
          {activeTab === 'commercial' && <CommercialGenerator />}
          {activeTab === 'video' && <VideoStudio />}
          {activeTab === 'music' && <MusicGeneratorApp />}
          {activeTab === 'documentation' && <DocumentationMenu />}
        </main>
      </div>
    </div>
  )
}

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>📊 Dashboard</h1>
      <p className="dashboard-subtitle">Welcome to Voice Over Studio - Your all-in-one production platform</p>
      
      <div className="dashboard-grid">
        {/* Quick Stats */}
        <div className="dashboard-section">
          <h2>📈 Quick Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎤</div>
              <div className="stat-info">
                <div className="stat-number">24</div>
                <div className="stat-label">Voices</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎵</div>
              <div className="stat-info">
                <div className="stat-number">156</div>
                <div className="stat-label">Audio Files</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎬</div>
              <div className="stat-info">
                <div className="stat-number">42</div>
                <div className="stat-label">Projects</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎨</div>
              <div className="stat-info">
                <div className="stat-number">89</div>
                <div className="stat-label">Effects</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-section">
          <h2>⏱️ Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">✓</div>
              <div className="activity-info">
                <div className="activity-title">Generated Voice: "Rachel Narration"</div>
                <div className="activity-time">2 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">✓</div>
              <div className="activity-info">
                <div className="activity-title">Created Project: "Commercial 2026"</div>
                <div className="activity-time">5 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">✓</div>
              <div className="activity-info">
                <div className="activity-title">Mixed Audio: "Background Music"</div>
                <div className="activity-time">Yesterday</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section full-width">
          <h2>⚡ Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-card">
              <div className="action-icon">🎙️</div>
              <div className="action-title">Generate Voice</div>
              <div className="action-desc">Create new voice-over</div>
            </button>
            <button className="action-card">
              <div className="action-icon">🎥</div>
              <div className="action-title">Create Video</div>
              <div className="action-desc">Start video project</div>
            </button>
            <button className="action-card">
              <div className="action-icon">🎵</div>
              <div className="action-title">Generate Music</div>
              <div className="action-desc">Create background music</div>
            </button>
            <button className="action-card">
              <div className="action-icon">📁</div>
              <div className="action-title">Open Projects</div>
              <div className="action-desc">Browse all projects</div>
            </button>
            <button className="action-card">
              <div className="action-icon">🎨</div>
              <div className="action-title">Add Effects</div>
              <div className="action-desc">Browse sound effects</div>
            </button>
            <button className="action-card">
              <div className="action-icon">⚙️</div>
              <div className="action-title">Settings</div>
              <div className="action-desc">Configure preferences</div>
            </button>
          </div>
        </div>

        {/* Tools Overview */}
        <div className="dashboard-section full-width">
          <h2>🛠️ Available Tools</h2>
          <div className="tools-grid">
            <div className="tool-card">
              <div className="tool-header">🎤 Voice Tools</div>
              <ul className="tool-list">
                <li>Voice Library</li>
                <li>Voice Generator</li>
                <li>Voice Blending</li>
                <li>Voice Emotions</li>
              </ul>
            </div>
            <div className="tool-card">
              <div className="tool-header">🎵 Audio Tools</div>
              <ul className="tool-list">
                <li>Audio Mixer</li>
                <li>Mixing Board</li>
                <li>Sound Effects</li>
                <li>Audio Library</li>
              </ul>
            </div>
            <div className="tool-card">
              <div className="tool-header">🎬 Production Tools</div>
              <ul className="tool-list">
                <li>Video Studio</li>
                <li>Music Generator</li>
                <li>Animation Sync</li>
                <li>Commercial Gen</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function VoiceGenerator() {
  const [text, setText] = useState('')
  const [voiceId, setVoiceId] = useState('Rachel')
  const [voices, setVoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [audio, setAudio] = useState(null)
  const [stability, setStability] = useState(0.5)
  const [similarityBoost, setSimilarityBoost] = useState(0.75)

  useEffect(() => {
    fetchVoices()
  }, [])

  const fetchVoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/audio/voices/elevenlabs`)
      setVoices(response.data)
    } catch (error) {
      console.error('Failed to fetch voices:', error)
    }
  }

  const generateVoice = async () => {
    if (!text.trim()) {
      alert('Please enter text')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/audio/generate/elevenlabs`, {
        text,
        voiceId,
        stability,
        similarity_boost: similarityBoost
      })
      setAudio(response.data)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate voice: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tab-content">
      <h2>🎤 Voice Generator</h2>
      
      <div className="form-group">
        <label>Text to Convert</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text for character dialogue..."
          rows="4"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Voice</label>
          <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
            {voices.map(voice => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Stability: {stability.toFixed(1)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={stability}
            onChange={(e) => setStability(parseFloat(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label>Similarity Boost: {similarityBoost.toFixed(1)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={similarityBoost}
            onChange={(e) => setSimilarityBoost(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <button onClick={generateVoice} disabled={loading} className="btn-primary">
        {loading ? 'Generating...' : 'Generate Voice'}
      </button>

      {audio && (
        <div className="result-box">
          <h3>Generated Audio</h3>
          <audio controls src={`${API_URL}${audio.audioUrl}`} className="audio-player" />
          <p>Duration: {audio.duration?.toFixed(2)}s</p>
          <a href={`${API_URL}${audio.audioUrl}`} download className="btn-secondary">
            Download MP3
          </a>
        </div>
      )}
    </div>
  )
}

function AudioMixer() {
  const [voiceoverPath, setVoiceoverPath] = useState('')
  const [musicPath, setMusicPath] = useState('')
  const [voiceVolume, setVoiceVolume] = useState(1.0)
  const [musicVolume, setMusicVolume] = useState(0.3)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleMix = async () => {
    if (!voiceoverPath) {
      alert('Please provide voiceover path')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/mixing/mix`, {
        voiceover: { path: voiceoverPath, volume: voiceVolume },
        backgroundMusic: musicPath ? { path: musicPath, volume: musicVolume } : null,
        duration: 180,
        output: 'mp3'
      })
      setResult(response.data)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to mix audio: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tab-content">
      <h2>🎵 Audio Mixer</h2>
      
      <div className="form-row">
        <div className="form-group">
          <label>Voiceover Path</label>
          <input
            type="text"
            value={voiceoverPath}
            onChange={(e) => setVoiceoverPath(e.target.value)}
            placeholder="/uploads/audio/voice.mp3"
          />
        </div>

        <div className="form-group">
          <label>Background Music Path</label>
          <input
            type="text"
            value={musicPath}
            onChange={(e) => setMusicPath(e.target.value)}
            placeholder="/uploads/audio/music.mp3"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Voiceover Volume: {voiceVolume.toFixed(1)}</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={voiceVolume}
            onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label>Music Volume: {musicVolume.toFixed(1)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={musicVolume}
            onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <button onClick={handleMix} disabled={loading} className="btn-primary">
        {loading ? 'Mixing...' : 'Mix Audio'}
      </button>

      {result && (
        <div className="result-box">
          <h3>Mixed Audio Ready</h3>
          <audio controls src={`${API_URL}${result.outputUrl}`} className="audio-player" />
          <p>Duration: {result.duration}s</p>
          <a href={`${API_URL}${result.outputUrl}`} download className="btn-secondary">
            Download Mixed Audio
          </a>
        </div>
      )}
    </div>
  )
}

function AnimationSync() {
  const [audioPath, setAudioPath] = useState('')
  const [fps, setFps] = useState(24)
  const [loading, setLoading] = useState(false)
  const [timeline, setTimeline] = useState(null)

  const handleCreateTimeline = async () => {
    if (!audioPath) {
      alert('Please provide audio path')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/animation/timeline`, {
        audioPath,
        sceneBreakpoints: []
      })
      setTimeline(response.data)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to create timeline: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tab-content">
      <h2>🎬 Animation Sync</h2>
      
      <div className="form-row">
        <div className="form-group">
          <label>Audio File Path</label>
          <input
            type="text"
            value={audioPath}
            onChange={(e) => setAudioPath(e.target.value)}
            placeholder="/uploads/audio/mixed.mp3"
          />
        </div>

        <div className="form-group">
          <label>FPS</label>
          <select value={fps} onChange={(e) => setFps(parseInt(e.target.value))}>
            <option value={24}>24 FPS (Cinema)</option>
            <option value={30}>30 FPS (TV)</option>
            <option value={60}>60 FPS (Smooth)</option>
          </select>
        </div>
      </div>

      <button onClick={handleCreateTimeline} disabled={loading} className="btn-primary">
        {loading ? 'Creating...' : 'Create Timeline'}
      </button>

      {timeline && (
        <div className="result-box">
          <h3>Timeline Created</h3>
          <p><strong>Duration:</strong> {timeline.duration}s</p>
          <p><strong>FPS:</strong> {timeline.fps}</p>
          <p><strong>Total Frames:</strong> {timeline.totalFrames}</p>
          <p><strong>Scenes:</strong> {timeline.scenes?.length || 0}</p>
        </div>
      )}
    </div>
  )
}

function CommercialGenerator() {
  const [productName, setProductName] = useState('')
  const [tagline, setTagline] = useState('')
  const [cta, setCta] = useState('Get yours today!')
  const [voiceId, setVoiceId] = useState('Rachel')
  const [duration, setDuration] = useState(30)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleGenerate = async () => {
    if (!productName || !tagline) {
      alert('Please enter product name and tagline')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/audio/commercial/generate`, {
        productName,
        tagline,
        callToAction: cta,
        duration,
        voiceId,
        includeMusic: true
      })
      setResult(response.data)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate commercial: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tab-content">
      <h2>📺 Commercial Generator</h2>
      
      <div className="form-group">
        <label>Product Name</label>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="My Awesome Product"
        />
      </div>

      <div className="form-group">
        <label>Tagline</label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="The best solution ever"
        />
      </div>

      <div className="form-group">
        <label>Call to Action</label>
        <input
          type="text"
          value={cta}
          onChange={(e) => setCta(e.target.value)}
          placeholder="Get yours today!"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Voice</label>
          <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
            <option value="Rachel">Rachel (Female)</option>
            <option value="Bella">Bella (Female)</option>
            <option value="Adam">Adam (Male)</option>
            <option value="Arnold">Arnold (Male)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Duration</label>
          <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}>
            <option value={15}>15s (TikTok)</option>
            <option value={30}>30s (Standard)</option>
            <option value={60}>60s (Extended)</option>
          </select>
        </div>
      </div>

      <button onClick={handleGenerate} disabled={loading} className="btn-primary">
        {loading ? 'Generating...' : 'Generate Commercial'}
      </button>

      {result && (
        <div className="result-box">
          <h3>Commercial Ready</h3>
          <p><strong>Script:</strong> {result.script}</p>
          {result.voiceover && (
            <>
              <audio controls src={`${API_URL}${result.voiceover.audioUrl}`} className="audio-player" />
              <a href={`${API_URL}${result.voiceover.audioUrl}`} download className="btn-secondary">
                Download Voiceover
              </a>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default App
