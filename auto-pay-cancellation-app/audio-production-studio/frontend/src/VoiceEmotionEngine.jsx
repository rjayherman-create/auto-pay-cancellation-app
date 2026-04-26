import React, { useState, useEffect } from 'react';
import './VoiceEmotionEngine.css';

const VoiceEmotionEngine = () => {
  const [emotions, setEmotions] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [presets, setPresets] = useState({});
  const [techniques, setTechniques] = useState({});
  const [savedVoices, setSavedVoices] = useState([]);
  const [activeTab, setActiveTab] = useState('emotions');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Emotion application state
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [emotionText, setEmotionText] = useState('');
  const [emotionIntensity, setEmotionIntensity] = useState(1.0);
  const [voiceId, setVoiceId] = useState('Rachel');
  const [generatedEmotion, setGeneratedEmotion] = useState(null);

  // Emotion blending state
  const [emotion1, setEmotion1] = useState('');
  const [emotion2, setEmotion2] = useState('');
  const [blendRatio, setBlendRatio] = useState(0.5);
  const [blendText, setBlendText] = useState('');
  const [blendResult, setBlendResult] = useState(null);

  // Character voice state
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [selectedScene, setSelectedScene] = useState('normal');
  const [characterVoiceResult, setCharacterVoiceResult] = useState(null);

  // Load data on mount
  useEffect(() => {
    fetchEmotions();
    fetchCharacters();
    fetchPresets();
    fetchTechniques();
    fetchSavedVoices();
  }, []);

  const fetchEmotions = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/emotions/available');
      const data = await response.json();
      if (data.success) {
        setEmotions(data.emotions);
        if (data.emotions.length > 0) {
          setSelectedEmotion(data.emotions[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching emotions:', error);
      setMessage('Failed to load emotions');
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/emotions/characters');
      const data = await response.json();
      if (data.success) {
        setCharacters(data.characters);
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  };

  const fetchPresets = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/emotions/presets');
      const data = await response.json();
      if (data.success) {
        setPresets(data.presets);
      }
    } catch (error) {
      console.error('Error fetching presets:', error);
    }
  };

  const fetchTechniques = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/emotions/techniques');
      const data = await response.json();
      if (data.success) {
        setTechniques(data.techniques);
      }
    } catch (error) {
      console.error('Error fetching techniques:', error);
    }
  };

  const fetchSavedVoices = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/emotions/library');
      const data = await response.json();
      if (data.success) {
        setSavedVoices(data.voices);
      }
    } catch (error) {
      console.error('Error fetching saved voices:', error);
    }
  };

  const handleApplyEmotion = async () => {
    if (!selectedEmotion || !emotionText) {
      setMessage('Please select an emotion and enter text');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/emotions/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emotionId: selectedEmotion,
          text: emotionText,
          voiceId: voiceId,
          intensity: emotionIntensity,
          blendAmount: 1.0
        })
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedEmotion(data.emotionalVoice);
        setMessage('✅ Emotional voice configured!');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error applying emotion:', error);
      setMessage('Failed to apply emotion');
    } finally {
      setLoading(false);
    }
  };

  const handleBlendEmotions = async () => {
    if (!emotion1 || !emotion2) {
      setMessage('Please select two emotions');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/emotions/blend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emotion1Id: emotion1,
          emotion2Id: emotion2,
          blendRatio: blendRatio,
          text: blendText
        })
      });

      const data = await response.json();

      if (data.success) {
        setBlendResult(data.blend);
        setMessage('✅ Emotions blended successfully!');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Blending error:', error);
      setMessage('Failed to blend emotions');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCharacterVoice = async () => {
    if (!selectedCharacter) {
      setMessage('Please select a character');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/emotions/character-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          characterId: selectedCharacter,
          scene: selectedScene
        })
      });

      const data = await response.json();

      if (data.success) {
        setCharacterVoiceResult(data.characterVoice);
        setMessage('✅ Character voice generated!');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Character voice error:', error);
      setMessage('Failed to generate character voice');
    } finally {
      setLoading(false);
    }
  };

  const sceneOptions = {
    'hero': ['normal', 'victory', 'challenge', 'moment'],
    'villain': ['normal', 'angry', 'gloating', 'threat'],
    'sidekick': ['normal', 'excited', 'scared', 'joke'],
    'mentor': ['normal', 'teaching', 'encouragement', 'warning'],
    'love_interest': ['normal', 'concerned', 'surprised', 'confession'],
    'scared_child': ['normal', 'scared', 'happy', 'crying'],
    'narrator': ['normal', 'dramatic', 'lighthearted', 'climax']
  };

  const selectedEmotionObj = emotions.find(e => e.id === selectedEmotion);

  return (
    <div className="emotion-engine-container">
      <div className="emotion-engine-header">
        <h1>💙 Voice Emotion Engine</h1>
        <p>Add emotional depth and human feel to AI voices</p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'emotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('emotions')}
        >
          💙 Apply Emotion
        </button>
        <button
          className={`tab-btn ${activeTab === 'blend' ? 'active' : ''}`}
          onClick={() => setActiveTab('blend')}
        >
          🎨 Blend Emotions
        </button>
        <button
          className={`tab-btn ${activeTab === 'characters' ? 'active' : ''}`}
          onClick={() => setActiveTab('characters')}
        >
          🎭 Character Voices
        </button>
        <button
          className={`tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          📋 Presets
        </button>
        <button
          className={`tab-btn ${activeTab === 'techniques' ? 'active' : ''}`}
          onClick={() => setActiveTab('techniques')}
        >
          🎙️ Techniques
        </button>
        <button
          className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          📚 Library ({savedVoices.length})
        </button>
      </div>

      {/* Tab: Apply Emotion */}
      {activeTab === 'emotions' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>💙 Apply Emotion to Voice</h2>
            <p>Choose an emotion and customize the intensity</p>
          </div>

          <div className="emotions-grid">
            {emotions.map(emotion => (
              <div
                key={emotion.id}
                className={`emotion-card ${selectedEmotion === emotion.id ? 'selected' : ''}`}
                onClick={() => setSelectedEmotion(emotion.id)}
              >
                <h3>{emotion.name}</h3>
                <p className="description">{emotion.description}</p>
                <div className="characteristics">
                  <span>Pitch: {(emotion.characteristics.pitch).toFixed(2)}x</span>
                  <span>Speed: {(emotion.characteristics.speed * 100).toFixed(0)}%</span>
                  <span>Volume: {(emotion.characteristics.volume * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>

          {selectedEmotionObj && (
            <div className="emotion-config-panel">
              <div className="section-header">
                <h3>Configure: {selectedEmotionObj.name}</h3>
              </div>

              <div className="config-form">
                <div className="form-group">
                  <label>Voice ID</label>
                  <select
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    className="form-select"
                  >
                    <option>Rachel</option>
                    <option>Bella</option>
                    <option>Adam</option>
                    <option>Arnold</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Text to Emotionalize</label>
                  <textarea
                    value={emotionText}
                    onChange={(e) => setEmotionText(e.target.value)}
                    placeholder={selectedEmotionObj.examples[0] || 'Enter text...'}
                    className="form-textarea"
                    rows="4"
                  />
                  <p className="suggestion">Suggestion: {selectedEmotionObj.examples[0]}</p>
                </div>

                <div className="form-group">
                  <label>Emotion Intensity: {emotionIntensity.toFixed(2)}x</label>
                  <input
                    type="range"
                    min="0.3"
                    max="1.5"
                    step="0.1"
                    value={emotionIntensity}
                    onChange={(e) => setEmotionIntensity(parseFloat(e.target.value))}
                    className="slider"
                  />
                </div>

                <div className="emotion-info">
                  <h4>Emotional Characteristics:</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Pitch Shift:</span>
                      <span className="value">{((selectedEmotionObj.characteristics.pitch - 1) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Speed Modifier:</span>
                      <span className="value">{((selectedEmotionObj.characteristics.speed - 1) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Breathiness:</span>
                      <span className="value">{(selectedEmotionObj.characteristics.breathiness * 100).toFixed(0)}%</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Resonance:</span>
                      <span className="value">{selectedEmotionObj.characteristics.resonance}</span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn-apply"
                  onClick={handleApplyEmotion}
                  disabled={loading}
                >
                  {loading ? '🔄 Applying...' : '💙 Apply Emotion'}
                </button>
              </div>

              {generatedEmotion && (
                <div className="result-panel">
                  <h3>Generated Emotional Voice Configuration</h3>
                  <div className="prosody-display">
                    <div className="prosody-item">
                      <strong>Pitch Shift:</strong> {(generatedEmotion.modulation.pitchShift * 100).toFixed(1)}%
                    </div>
                    <div className="prosody-item">
                      <strong>Speed Factor:</strong> {generatedEmotion.modulation.speedFactor.toFixed(2)}x
                    </div>
                    <div className="prosody-item">
                      <strong>Volume Shift:</strong> {(generatedEmotion.modulation.volumeShift * 100).toFixed(1)}%
                    </div>
                    <div className="prosody-item">
                      <strong>Breathiness:</strong> {(generatedEmotion.modulation.breathinessLevel * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Blend Emotions */}
      {activeTab === 'blend' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>🎨 Blend Emotions</h2>
            <p>Mix two emotions for complex character expression</p>
          </div>

          <div className="blend-panel">
            <div className="blend-selectors">
              <div className="blend-select">
                <label>Emotion 1</label>
                <select
                  value={emotion1}
                  onChange={(e) => setEmotion1(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Select --</option>
                  {emotions.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div className="blend-ratio-display">
                <div className="ratio">{(blendRatio * 100).toFixed(0)}%</div>
              </div>

              <div className="blend-select">
                <label>Emotion 2</label>
                <select
                  value={emotion2}
                  onChange={(e) => setEmotion2(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Select --</option>
                  {emotions.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Blend Ratio: {(blendRatio * 100).toFixed(0)}% Emotion 1 - {((1-blendRatio) * 100).toFixed(0)}% Emotion 2</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={blendRatio}
                onChange={(e) => setBlendRatio(parseFloat(e.target.value))}
                className="slider"
              />
            </div>

            <div className="form-group">
              <label>Text (optional)</label>
              <textarea
                value={blendText}
                onChange={(e) => setBlendText(e.target.value)}
                placeholder="Example: That's wonderful but scary..."
                className="form-textarea"
                rows="3"
              />
            </div>

            <button
              className="btn-blend"
              onClick={handleBlendEmotions}
              disabled={loading || !emotion1 || !emotion2}
            >
              {loading ? '🔄 Blending...' : '🎨 Blend Emotions'}
            </button>

            {blendResult && (
              <div className="result-panel">
                <h3>{blendResult.description}</h3>
                <div className="blend-characteristics">
                  <div className="char-item">
                    <span>Pitch:</span> {blendResult.blendedCharacteristics.pitch.toFixed(2)}x
                  </div>
                  <div className="char-item">
                    <span>Speed:</span> {blendResult.blendedCharacteristics.speed.toFixed(2)}x
                  </div>
                  <div className="char-item">
                    <span>Volume:</span> {blendResult.blendedCharacteristics.volume.toFixed(2)}x
                  </div>
                  <div className="char-item">
                    <span>Breathiness:</span> {(blendResult.blendedCharacteristics.breathiness * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Character Voices */}
      {activeTab === 'characters' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>🎭 Character Voice Profiles</h2>
            <p>Pre-configured emotional voices for character archetypes</p>
          </div>

          <div className="characters-grid">
            {characters.map(char => (
              <div
                key={char.id}
                className={`character-card ${selectedCharacter === char.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedCharacter(char.id);
                  setSelectedScene('normal');
                }}
              >
                <h3>{char.name}</h3>
                <p>{char.description}</p>
                <span className="intensity">Intensity: {(char.emotionIntensity * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>

          {selectedCharacter && (
            <div className="character-config">
              <div className="section-header">
                <h3>{characters.find(c => c.id === selectedCharacter)?.name}</h3>
              </div>

              <div className="form-group">
                <label>Select Scene/Moment</label>
                <div className="scene-buttons">
                  {sceneOptions[selectedCharacter]?.map(scene => (
                    <button
                      key={scene}
                      className={`scene-btn ${selectedScene === scene ? 'active' : ''}`}
                      onClick={() => setSelectedScene(scene)}
                    >
                      {scene.charAt(0).toUpperCase() + scene.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn-character"
                onClick={handleGenerateCharacterVoice}
                disabled={loading}
              >
                {loading ? '🔄 Generating...' : '🎭 Generate Character Voice'}
              </button>

              {characterVoiceResult && (
                <div className="character-result">
                  <h4>Character Voice Configuration</h4>
                  <div className="character-info">
                    <p><strong>Character:</strong> {characterVoiceResult.characterName}</p>
                    <p><strong>Scene:</strong> {characterVoiceResult.scene}</p>
                    <p><strong>Emotion:</strong> {characterVoiceResult.emotionName}</p>
                    <p><strong>Personality:</strong> {characterVoiceResult.voicePersonality}</p>
                    <div className="character-examples">
                      <strong>Example lines:</strong>
                      <ul>
                        {characterVoiceResult.examples.map((ex, idx) => (
                          <li key={idx}>"{ex}"</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Presets */}
      {activeTab === 'presets' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>📋 Emotion Presets</h2>
            <p>Pre-configured emotional sequences for different content types</p>
          </div>

          <div className="presets-grid">
            {Object.entries(presets).map(([presetName, emotions]) => (
              <div key={presetName} className="preset-card">
                <h3>{presetName.charAt(0).toUpperCase() + presetName.slice(1)}</h3>
                <div className="preset-emotions">
                  {emotions.map((e, idx) => (
                    <div key={idx} className="preset-item">
                      <span className="context">{e.context}:</span>
                      <span className="emotion">{e.emotion}</span>
                      <span className="intensity">{(e.intensity * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Techniques */}
      {activeTab === 'techniques' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>🎙️ Vocal Techniques</h2>
            <p>Professional techniques to enhance emotional expression</p>
          </div>

          <div className="techniques-grid">
            {Object.entries(techniques).map(([technique, description]) => (
              <div key={technique} className="technique-card">
                <h4>{technique}</h4>
                <p>{description}</p>
              </div>
            ))}
          </div>

          <div className="techniques-info">
            <h3>How to Use These Techniques</h3>
            <p>Combine multiple techniques to create realistic emotional performances:</p>
            <ul>
              <li><strong>Happy:</strong> Bright EQ + Compression + Slight Reverb</li>
              <li><strong>Sad:</strong> Dark EQ + Reverb + Slight Vocal Fry</li>
              <li><strong>Angry:</strong> Glottalization + Compression + Proximity Effect</li>
              <li><strong>Fearful:</strong> High Breathiness + Pitch Breaks + Reverb</li>
              <li><strong>Romantic:</strong> Vibrato + Harmonics + Close Proximity + Reverb</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab: Library */}
      {activeTab === 'library' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>📚 Saved Emotional Voices</h2>
            <p>Your custom emotional voice configurations</p>
          </div>

          {savedVoices.length === 0 ? (
            <div className="empty-state">
              <p>No saved emotional voices yet. Create one above!</p>
            </div>
          ) : (
            <div className="library-grid">
              {savedVoices.map(voice => (
                <div key={voice.id} className="library-card">
                  <h3>{voice.emotionName}</h3>
                  <p className="voice-id">ID: {voice.id}</p>
                  <p className="text-sample">"{voice.text}"</p>
                  <div className="stats">
                    <span>Intensity: {(voice.intensity * 100).toFixed(0)}%</span>
                    <span>Uses: {voice.usageCount}</span>
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

export default VoiceEmotionEngine;
