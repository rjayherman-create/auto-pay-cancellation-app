import React, { useState } from 'react'
import './DocumentationMenu.css'

function DocumentationMenu() {
  const [expandedSections, setExpandedSections] = useState({})

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const documentation = {
    overview: {
      title: '📖 Overview',
      items: [
        { title: 'Getting Started', link: '#getting-started' },
        { title: 'Features', link: '#features' },
        { title: 'System Requirements', link: '#requirements' }
      ]
    },
    voiceTools: {
      title: '🎤 Voice Tools',
      items: [
        { title: 'Voice Library', link: '#voice-library' },
        { title: 'Voice Generator', link: '#voice-generator' },
        { title: 'Voice Blending', link: '#voice-blending' },
        { title: 'Voice Emotions', link: '#voice-emotions' }
      ]
    },
    audioTools: {
      title: '🎵 Audio Tools',
      items: [
        { title: 'Audio Mixer', link: '#audio-mixer' },
        { title: 'Mixing Board', link: '#mixing-board' },
        { title: 'Sound Effects', link: '#sound-effects' }
      ]
    },
    production: {
      title: '🎬 Production',
      items: [
        { title: 'Video Studio', link: '#video-studio' },
        { title: 'Music Generator', link: '#music-generator' },
        { title: 'Animation Sync', link: '#animation-sync' },
        { title: 'Commercial Generator', link: '#commercial-generator' }
      ]
    },
    projects: {
      title: '📁 Project Management',
      items: [
        { title: 'Creating Projects', link: '#create-project' },
        { title: 'Managing Files', link: '#manage-files' },
        { title: 'Exporting Projects', link: '#export-project' },
        { title: 'Sharing Projects', link: '#share-project' }
      ]
    },
    api: {
      title: '⚙️ API Documentation',
      items: [
        { title: 'API Overview', link: '#api-overview' },
        { title: 'Authentication', link: '#api-auth' },
        { title: 'Voice APIs', link: '#api-voice' },
        { title: 'Audio APIs', link: '#api-audio' },
        { title: 'Production APIs', link: '#api-production' },
        { title: 'Project APIs', link: '#api-projects' },
        { title: 'Error Handling', link: '#api-errors' }
      ]
    },
    tutorials: {
      title: '🎓 Tutorials',
      items: [
        { title: 'Creating Voice-Over', link: '#tutorial-voiceover' },
        { title: 'Mixing Audio', link: '#tutorial-mixing' },
        { title: 'Creating Videos', link: '#tutorial-video' },
        { title: 'Generating Music', link: '#tutorial-music' },
        { title: 'Making Commercials', link: '#tutorial-commercial' }
      ]
    },
    faq: {
      title: '❓ FAQ',
      items: [
        { title: 'Common Issues', link: '#faq-issues' },
        { title: 'Voice Quality', link: '#faq-quality' },
        { title: 'File Formats', link: '#faq-formats' },
        { title: 'Storage Limits', link: '#faq-storage' }
      ]
    },
    support: {
      title: '💬 Support',
      items: [
        { title: 'Contact Support', link: '#support-contact' },
        { title: 'Report Bug', link: '#support-bug' },
        { title: 'Feature Request', link: '#support-feature' },
        { title: 'Documentation', link: '#support-docs' }
      ]
    },
    keyboard: {
      title: '⌨️ Keyboard Shortcuts',
      items: [
        { title: 'Navigation', link: '#shortcuts-nav' },
        { title: 'Editing', link: '#shortcuts-edit' },
        { title: 'Playback', link: '#shortcuts-playback' }
      ]
    }
  }

  return (
    <div className="documentation-menu">
      <div className="doc-header">
        <h2>📚 Documentation</h2>
        <p>Complete guide to Voice Over Studio</p>
      </div>

      <div className="doc-search">
        <input 
          type="text" 
          placeholder="🔍 Search documentation..." 
          className="doc-search-input"
        />
      </div>

      <nav className="doc-nav">
        {Object.entries(documentation).map(([key, section]) => (
          <div key={key} className="doc-section">
            <button 
              className={`doc-section-title ${expandedSections[key] ? 'expanded' : ''}`}
              onClick={() => toggleSection(key)}
            >
              <span>{section.title}</span>
              <span className="doc-arrow">{expandedSections[key] ? '▼' : '▶'}</span>
            </button>

            {expandedSections[key] && (
              <ul className="doc-items">
                {section.items.map((item, idx) => (
                  <li key={idx}>
                    <a href={item.link} className="doc-link">
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>

      <div className="doc-footer">
        <div className="doc-info">
          <p>📌 Version 1.0.0</p>
          <p>📅 Last Updated: Feb 16, 2026</p>
        </div>
        <a href="/API_DOCUMENTATION.md" className="doc-full-link">
          📄 View Full API Docs
        </a>
      </div>
    </div>
  )
}

export default DocumentationMenu
