import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './VoiceEmotionsCartoon.css'

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000'

export default function VoiceEmotionsCartoon() {
  const [activeTab, setActiveTab] = useState('emotions') // 'emotions' or 'characters'
  const [text, setText] = useState('')
  const [selectedOption, setSelectedOption] = useState('')
  const [loading, setLoading] = useState(false)
  const [audio, setAudio] = useState(null)
  const [emotions, setEmotions] = useState([])
  const [characters, setCharacters] = useState([])
  const [voices, setVoices] = useState([])
  const [error, setError] = useState('')

  // Fetch emotions, characters, and voices on mount
  useEffect(() => {
    fetchEmotions()
    fetchCharacters()
    fetchVoices()
  }, [])

  const fetchEmotions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/voice/emotions`)
      setEmotions(response.data)
    } catch (err) {
      console.error('Error fetching emotions:', err)
    }
  }

  const fetchCharacters = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/voice/cartoon-characters`)
      setCharacters(response.data)
    } catch (err) {
      console.error('Error fetching characters:', err)
    }
  }

  const fetchVoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/voice/voices`)
      setVoices(response.data)
    } catch (err) {
      console.error('Error fetching voices:', err)
    }
  }

  const generateEmotionalVoice = async () => {
    if (!text.trim()) {
      setError('Please enter text')
      return
    }

    if (!selectedOption) {
      setError('Please select an emotion')
      return
    }

    if (!voices.length) {
      setError('No voices available. Check your API key.')
      return
    }

    setError('')
    setLoading(true)

    try {
      // Use first available voice
      const voiceId = voices[0].voice_id

      const response = await axios.post(`${API_URL}/api/voice/generate-emotion`, {
        text,
        voiceId,
        emotion: selectedOption
      })

      setAudio(response.data)
      setText('')
      setSelectedOption('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate voice')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateCartoonVoice = async () => {
    if (!text.trim()) {
      setError('Please enter text')
      return
    }

    if (!selectedOption) {
      setError('Please select a character')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/api/voice/generate-cartoon`, {
        text,
        characterId: selectedOption
      })

      setAudio(response.data)
      setText('')
      setSelectedOption('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate character voice')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="voice-emotions-cartoon">
      {/* Tabs */}
      <div className="vec-tabs">
        <button
          className={`vec-tab ${activeTab === 'emotions' ? 'active' : ''}`}
          onClick={() => { setActiveTab('emotions'); setAudio(null); setError(''); }}
        >
          💙 Emotional Voices
        </button>
        <button
          className={`vec-tab ${activeTab === 'characters' ? 'active' : ''}`}
          onClick={() => { setActiveTab('characters'); setAudio(null); setError(''); }}
        >
          🎭 Cartoon Characters
        </button>
      </div>

      <div className="vec-content">
        {/* Text Input */}
        <div className="vec-input-section">
          <label>📝 What should they say?</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the text you want to hear..."
            rows="4"
            disabled={loading}
            className="vec-textarea"
          />
        </div>

        {/* Emotions Tab */}
        {activeTab === 'emotions' && (
          <div className="vec-emotions-section">
            <label>💙 Choose an Emotion:</label>
            <div className="vec-grid">
              {emotions.map((emotion) => (
                <button
                  key={emotion.id}
                  className={`vec-option-card ${selectedOption === emotion.id ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(emotion.id)}
                  disabled={loading}
                >
                  <div className="vec-option-emoji">
                    {emotion.id === 'happy' && '😄'}
                    {emotion.id === 'sad' && '😢'}
                    {emotion.id === 'angry' && '😠'}
                    {emotion.id === 'calm' && '😌'}
                    {emotion.id === 'scared' && '😨'}
                    {emotion.id === 'excited' && '🤩'}
                    {emotion.id === 'sarcastic' && '😏'}
                    {emotion.id === 'whisper' && '🤫'}
                  </div>
                  <div className="vec-option-name">{emotion.name}</div>
                  <div className="vec-option-desc">{emotion.description}</div>
                </button>
              ))}
            </div>

            <button
              onClick={generateEmotionalVoice}
              disabled={loading || !selectedOption || !text.trim()}
              className="vec-generate-btn"
            >
              {loading ? '🔊 Generating...' : '🎤 Generate Emotional Voice'}
            </button>
          </div>
        )}

        {/* Characters Tab */}
        {activeTab === 'characters' && (
          <div className="vec-characters-section">
            <label>🎭 Choose a Character:</label>
            <div className="vec-grid">
              {characters.map((character) => (
                <button
                  key={character.id}
                  className={`vec-option-card ${selectedOption === character.id ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(character.id)}
                  disabled={loading}
                >
                  <div className="vec-option-emoji">
                    {character.id === 'mickey_mouse' && '🐭'}
                    {character.id === 'minion' && '👨‍🚀'}
                    {character.id === 'darth_vader' && '🖤'}
                    {character.id === 'yoda' && '👴'}
                    {character.id === 'spongebob' && '🧽'}
                    {character.id === 'pikachu' && '⚡'}
                    {character.id === 'hulk' && '💚'}
                    {character.id === 'elsa' && '❄️'}
                  </div>
                  <div className="vec-option-name">{character.name}</div>
                  <div className="vec-option-desc">{character.description}</div>
                </button>
              ))}
            </div>

            <button
              onClick={generateCartoonVoice}
              disabled={loading || !selectedOption || !text.trim()}
              className="vec-generate-btn"
            >
              {loading ? '🔊 Generating...' : '🎭 Generate Cartoon Voice'}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="vec-error">
            ⚠️ {error}
          </div>
        )}

        {/* Audio Player */}
        {audio && (
          <div className="vec-result">
            <div className="vec-result-header">
              ✅ {activeTab === 'emotions' ? '😊 Emotional Voice' : '🎭 Cartoon Voice'} Generated!
            </div>

            {activeTab === 'emotions' && audio.emotion && (
              <p className="vec-result-info">
                <strong>Emotion:</strong> {audio.emotion.charAt(0).toUpperCase() + audio.emotion.slice(1)}
              </p>
            )}

            {activeTab === 'characters' && audio.characterName && (
              <p className="vec-result-info">
                <strong>Character:</strong> {audio.characterName}
              </p>
            )}

            <p className="vec-result-text">
              <strong>Text:</strong> "{audio.text}"
            </p>

            <audio
              controls
              src={`${API_URL}${audio.audioUrl}`}
              className="vec-audio-player"
            />

            <div className="vec-result-actions">
              <a
                href={`${API_URL}${audio.audioUrl}`}
                download
                className="vec-download-btn"
              >
                ⬇️ Download
              </a>
              <button
                onClick={() => setAudio(null)}
                className="vec-new-btn"
              >
                ➕ Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
