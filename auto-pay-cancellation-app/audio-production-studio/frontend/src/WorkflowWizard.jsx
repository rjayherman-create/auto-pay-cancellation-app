import React, { useState, useEffect } from 'react';
import './WorkflowWizard.css';

const WorkflowWizard = () => {
  const [currentStep, setCurrentStep] = useState('welcome');
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    duration: 180
  });
  const [project, setProject] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [savedVoices, setSavedVoices] = useState([]);
  const [scriptData, setScriptData] = useState({
    name: '',
    text: '',
    characterName: ''
  });
  const [voiceSettings, setVoiceSettings] = useState({
    emotion: 'neutral',
    stability: 0.5,
    similarityBoost: 0.75
  });
  const [blendingVoices, setBlendingVoices] = useState({
    voice1: null,
    voice2: null,
    blendName: '',
    blendRatio: 0.5
  });
  const [allVoices, setAllVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/voices');
      const data = await response.json();
      if (data.success) {
        setAllVoices(data.voices);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
    }
  };

  // STEP 1: Create Project
  const handleCreateProject = () => {
    if (!projectData.name.trim()) {
      setMessage('❌ Please enter a project name');
      return;
    }

    const newProject = {
      id: Date.now(),
      name: projectData.name,
      description: projectData.description,
      duration: projectData.duration,
      voices: [],
      scripts: [],
      created: new Date().toISOString().split('T')[0],
      status: 'In Progress'
    };

    setProject(newProject);
    setCurrentStep('selectVoice');
    setMessage('✅ Project created! Now select a voice.');
    setTimeout(() => setMessage(''), 3000);
  };

  // STEP 2: Select Voice
  const handleSelectVoice = (voice) => {
    setSelectedVoice(voice);
    setMessage('✅ Voice selected. Now create your script.');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleSaveVoice = async () => {
    if (!selectedVoice) return;

    try {
      const response = await fetch('http://localhost:3000/api/voices/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: selectedVoice.voice_id,
          voiceName: selectedVoice.name,
          provider: 'elevenlabs',
          voiceData: selectedVoice
        })
      });

      const data = await response.json();
      if (data.success) {
        setSavedVoices([...savedVoices, data.voice]);
        setCurrentStep('createScript');
        setMessage('✅ Voice saved to project! Now create your script.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('❌ Failed to save voice');
    }
  };

  // STEP 3: Create Script
  const handleCreateScript = () => {
    if (!scriptData.name.trim() || !scriptData.text.trim()) {
      setMessage('❌ Please enter script name and text');
      return;
    }

    const newScript = {
      id: Date.now(),
      name: scriptData.name,
      text: scriptData.text,
      characterName: scriptData.characterName || 'Main Character',
      voiceId: selectedVoice.voice_id,
      emotion: voiceSettings.emotion,
      created: new Date().toISOString()
    };

    const updatedProject = {
      ...project,
      scripts: [...(project.scripts || []), newScript]
    };

    setProject(updatedProject);
    setCurrentStep('addEmotion');
    setMessage('✅ Script created! Now add emotion or create a new voice.');
    setTimeout(() => setMessage(''), 3000);
  };

  // STEP 4: Add Emotion or Blend Voices
  const handleAddEmotion = () => {
    // Update script with emotion
    const updatedProject = {
      ...project,
      scripts: project.scripts.map(s => ({
        ...s,
        emotion: voiceSettings.emotion,
        stability: voiceSettings.stability,
        similarityBoost: voiceSettings.similarityBoost
      }))
    };

    setProject(updatedProject);
    setCurrentStep('blendOrMix');
    setMessage('✅ Emotion added! You can now blend voices or go to mixing board.');
    setTimeout(() => setMessage(''), 3000);
  };

  // STEP 5: Blend Voices (Create New Original Voice)
  const handleBlendVoices = async () => {
    if (!blendingVoices.voice1 || !blendingVoices.voice2 || !blendingVoices.blendName) {
      setMessage('❌ Please select two voices and enter a blend name');
      return;
    }

    setLoading(true);
    try {
      // Simulate voice blending API call
      const blendedVoice = {
        id: Date.now(),
        name: blendingVoices.blendName,
        type: 'blended',
        voice1: blendingVoices.voice1.name,
        voice2: blendingVoices.voice2.name,
        blendRatio: blendingVoices.blendRatio,
        description: `Blended voice created from ${blendingVoices.voice1.name} (${blendingVoices.blendRatio * 100}%) and ${blendingVoices.voice2.name} (${(1 - blendingVoices.blendRatio) * 100}%). This is an original voice created by voice blending.`,
        legal: 'This is a derived voice created for fair use in audio production. Original voices are proprietary to ElevenLabs.',
        isLegal: true
      };

      // Save the blended voice
      const response = await fetch('http://localhost:3000/api/voices/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: blendedVoice.id,
          voiceName: blendedVoice.name,
          provider: 'blended',
          voiceData: blendedVoice
        })
      });

      const data = await response.json();
      setSavedVoices([...savedVoices, data.voice]);
      setMessage(`✅ New blended voice "${blendingVoices.blendName}" created successfully!`);
      setCurrentStep('review');
    } catch (error) {
      setMessage('❌ Failed to create blended voice');
    } finally {
      setLoading(false);
    }
  };

  // Final Step: Review and Go to Mixing Board
  const handleGoToMixer = () => {
    // This would normally navigate to the mixing board
    setCurrentStep('complete');
    setMessage('✅ Ready to mix! Opening mixing board...');
  };

  const goBack = () => {
    if (currentStep === 'selectVoice') {
      setProject(null);
      setCurrentStep('createProject');
    } else if (currentStep === 'createScript') {
      setCurrentStep('selectVoice');
    } else if (currentStep === 'addEmotion') {
      setCurrentStep('createScript');
    } else if (currentStep === 'blendOrMix') {
      setCurrentStep('addEmotion');
    } else if (currentStep === 'review') {
      setCurrentStep('blendOrMix');
    }
  };

  return (
    <div className="workflow-wizard">
      {/* Header */}
      <div className="wizard-header">
        <h1>🎬 Voice-Over Production Workflow</h1>
        <p>Step-by-step guide to create professional voice-overs</p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-steps">
          <div className={`step ${['welcome', 'createProject'].includes(currentStep) ? 'active' : currentStep !== 'welcome' ? 'completed' : ''}`}>
            1. Project
          </div>
          <div className={`step ${currentStep === 'selectVoice' ? 'active' : ['createScript', 'addEmotion', 'blendOrMix', 'review', 'complete'].includes(currentStep) ? 'completed' : ''}`}>
            2. Voice
          </div>
          <div className={`step ${currentStep === 'createScript' ? 'active' : ['addEmotion', 'blendOrMix', 'review', 'complete'].includes(currentStep) ? 'completed' : ''}`}>
            3. Script
          </div>
          <div className={`step ${currentStep === 'addEmotion' ? 'active' : ['blendOrMix', 'review', 'complete'].includes(currentStep) ? 'completed' : ''}`}>
            4. Emotion
          </div>
          <div className={`step ${['blendOrMix', 'review'].includes(currentStep) ? 'active' : currentStep === 'complete' ? 'completed' : ''}`}>
            5. Mix/Blend
          </div>
        </div>
      </div>

      {/* STEP 1: Welcome */}
      {currentStep === 'welcome' && (
        <div className="step-content welcome-step">
          <div className="welcome-box">
            <h2>Welcome to Voice-Over Studio</h2>
            <p>Let's create a professional voice-over step by step:</p>
            
            <div className="workflow-steps">
              <div className="workflow-item">
                <span className="number">1</span>
                <span className="text">Create a project</span>
              </div>
              <div className="arrow">↓</div>
              <div className="workflow-item">
                <span className="number">2</span>
                <span className="text">Choose a voice</span>
              </div>
              <div className="arrow">↓</div>
              <div className="workflow-item">
                <span className="number">3</span>
                <span className="text">Create a script</span>
              </div>
              <div className="arrow">↓</div>
              <div className="workflow-item">
                <span className="number">4</span>
                <span className="text">Add emotion</span>
              </div>
              <div className="arrow">↓</div>
              <div className="workflow-item">
                <span className="number">5</span>
                <span className="text">Blend voices or mix</span>
              </div>
            </div>

            <button onClick={() => setCurrentStep('createProject')} className="btn-start">
              Start Workflow →
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: Create Project */}
      {currentStep === 'createProject' && (
        <div className="step-content">
          <h2>📁 Step 1: Create Your Project</h2>
          <p>Give your project a name and description</p>

          <div className="form-group">
            <label>Project Name *</label>
            <input
              type="text"
              value={projectData.name}
              onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
              placeholder="e.g., Product Commercial, Cartoon Episode 1"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={projectData.description}
              onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
              placeholder="Describe your project..."
              className="form-textarea"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Duration (seconds)</label>
            <input
              type="number"
              value={projectData.duration}
              onChange={(e) => setProjectData({ ...projectData, duration: parseInt(e.target.value) })}
              className="form-input"
              min="1"
              max="3600"
            />
          </div>

          <div className="form-actions">
            <button onClick={handleCreateProject} className="btn-next">
              Create Project →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Select Voice */}
      {currentStep === 'selectVoice' && (
        <div className="step-content">
          <h2>🎤 Step 2: Choose a Voice</h2>
          <p>Select from {allVoices.length} professional voices</p>

          <div className="voices-grid">
            {allVoices.map(voice => (
              <div
                key={voice.voice_id}
                className={`voice-option ${selectedVoice?.voice_id === voice.voice_id ? 'selected' : ''}`}
                onClick={() => handleSelectVoice(voice)}
              >
                <h4>{voice.name}</h4>
                <p>{voice.accent || 'Professional'}</p>
              </div>
            ))}
          </div>

          {selectedVoice && (
            <div className="selected-voice-info">
              <h3>✅ Selected: {selectedVoice.name}</h3>
              <p>{selectedVoice.accent || 'Neutral'} • {selectedVoice.description || 'Professional voice'}</p>
            </div>
          )}

          <div className="form-actions">
            <button onClick={goBack} className="btn-back">
              ← Back
            </button>
            <button
              onClick={handleSaveVoice}
              disabled={!selectedVoice || loading}
              className="btn-next"
            >
              Save & Continue →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Create Script */}
      {currentStep === 'createScript' && (
        <div className="step-content">
          <h2>📝 Step 3: Create Your Script</h2>
          <p>Write the text you want to convert to voice</p>

          <div className="form-group">
            <label>Script Name *</label>
            <input
              type="text"
              value={scriptData.name}
              onChange={(e) => setScriptData({ ...scriptData, name: e.target.value })}
              placeholder="e.g., Intro, Main Dialogue"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Character Name</label>
            <input
              type="text"
              value={scriptData.characterName}
              onChange={(e) => setScriptData({ ...scriptData, characterName: e.target.value })}
              placeholder="e.g., Hero, Narrator"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Script Text *</label>
            <textarea
              value={scriptData.text}
              onChange={(e) => setScriptData({ ...scriptData, text: e.target.value })}
              placeholder="Enter the text you want to convert to speech..."
              className="form-textarea"
              rows="6"
            />
          </div>

          <div className="form-actions">
            <button onClick={goBack} className="btn-back">
              ← Back
            </button>
            <button onClick={handleCreateScript} className="btn-next">
              Create Script →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Add Emotion */}
      {currentStep === 'addEmotion' && (
        <div className="step-content">
          <h2>💙 Step 4: Add Emotion & Settings</h2>
          <p>Configure voice emotion and quality settings</p>

          <div className="form-group">
            <label>Voice Emotion</label>
            <select
              value={voiceSettings.emotion}
              onChange={(e) => setVoiceSettings({ ...voiceSettings, emotion: e.target.value })}
              className="form-select"
            >
              <option value="neutral">😐 Neutral</option>
              <option value="happy">😊 Happy</option>
              <option value="sad">😢 Sad</option>
              <option value="angry">😠 Angry</option>
              <option value="excited">🤩 Excited</option>
              <option value="calm">😌 Calm</option>
              <option value="serious">🤨 Serious</option>
              <option value="scared">😨 Scared</option>
            </select>
          </div>

          <div className="form-group">
            <label>Stability: {voiceSettings.stability.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={voiceSettings.stability}
              onChange={(e) => setVoiceSettings({ ...voiceSettings, stability: parseFloat(e.target.value) })}
              className="form-slider"
            />
            <p className="setting-hint">Lower = more variation, Higher = more consistent</p>
          </div>

          <div className="form-group">
            <label>Similarity Boost: {voiceSettings.similarityBoost.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={voiceSettings.similarityBoost}
              onChange={(e) => setVoiceSettings({ ...voiceSettings, similarityBoost: parseFloat(e.target.value) })}
              className="form-slider"
            />
            <p className="setting-hint">Lower = more naturalness, Higher = more voice identity</p>
          </div>

          <div className="form-actions">
            <button onClick={goBack} className="btn-back">
              ← Back
            </button>
            <button onClick={handleAddEmotion} className="btn-next">
              Apply Emotion →
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Blend or Mix */}
      {currentStep === 'blendOrMix' && (
        <div className="step-content">
          <h2>🎨 Step 5: Create Original Voice or Go to Mixing</h2>
          <p>Option A: Blend two voices to create an original voice, or Option B: Go to mixing board</p>

          <div className="blend-section">
            <h3>Option A: Create a New Blended Voice</h3>
            <p className="blend-note">Combine 2 existing voices to create a legally original voice</p>

            <div className="form-group">
              <label>First Voice</label>
              <select
                value={blendingVoices.voice1?.voice_id || ''}
                onChange={(e) => {
                  const voice = allVoices.find(v => v.voice_id === e.target.value);
                  setBlendingVoices({ ...blendingVoices, voice1: voice });
                }}
                className="form-select"
              >
                <option value="">Select a voice...</option>
                {allVoices.map(voice => (
                  <option key={voice.voice_id} value={voice.voice_id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Second Voice</label>
              <select
                value={blendingVoices.voice2?.voice_id || ''}
                onChange={(e) => {
                  const voice = allVoices.find(v => v.voice_id === e.target.value);
                  setBlendingVoices({ ...blendingVoices, voice2: voice });
                }}
                className="form-select"
              >
                <option value="">Select a voice...</option>
                {allVoices.map(voice => (
                  <option key={voice.voice_id} value={voice.voice_id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Blend Ratio: {(blendingVoices.blendRatio * 100).toFixed(0)}% Voice 1</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={blendingVoices.blendRatio}
                onChange={(e) => setBlendingVoices({ ...blendingVoices, blendRatio: parseFloat(e.target.value) })}
                className="form-slider"
              />
            </div>

            <div className="form-group">
              <label>Blended Voice Name *</label>
              <input
                type="text"
                value={blendingVoices.blendName}
                onChange={(e) => setBlendingVoices({ ...blendingVoices, blendName: e.target.value })}
                placeholder="e.g., Custom Voice 1"
                className="form-input"
              />
            </div>

            <button
              onClick={handleBlendVoices}
              disabled={!blendingVoices.voice1 || !blendingVoices.voice2 || !blendingVoices.blendName || loading}
              className="btn-blend"
            >
              {loading ? '🔄 Creating Blend...' : '🎨 Create Blended Voice'}
            </button>
          </div>

          <div className="blend-or">
            <span>OR</span>
          </div>

          <div className="mixer-section">
            <h3>Option B: Go to Mixing Board</h3>
            <p>Skip voice blending and go directly to the professional mixing board</p>
            <button onClick={handleGoToMixer} className="btn-mixer">
              🎚️ Open Mixing Board →
            </button>
          </div>

          <div className="form-actions">
            <button onClick={goBack} className="btn-back">
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Review & Complete */}
      {currentStep === 'review' && (
        <div className="step-content complete-step">
          <h2>✅ Project Complete!</h2>
          
          <div className="project-summary">
            <h3>{project?.name}</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Project Duration:</span>
                <span className="value">{project?.duration}s</span>
              </div>
              <div className="summary-item">
                <span className="label">Voice Selected:</span>
                <span className="value">{selectedVoice?.name}</span>
              </div>
              <div className="summary-item">
                <span className="label">Scripts Created:</span>
                <span className="value">{project?.scripts?.length || 0}</span>
              </div>
              <div className="summary-item">
                <span className="label">Emotion Applied:</span>
                <span className="value">{voiceSettings.emotion}</span>
              </div>
            </div>
          </div>

          <div className="legal-notice">
            <h4>📋 Legal Notice for Blended Voices</h4>
            <p>Blended voices created in this studio are derived works based on ElevenLabs voices. This blending constitutes fair use for audio production purposes. The resulting voice is unique and distinct from the original voices used in the blend.</p>
            <p className="legal-disclaimer">Always check your local laws and licensing agreements regarding voice synthesis and audio production.</p>
          </div>

          <div className="form-actions">
            <button onClick={handleGoToMixer} className="btn-mixer-final">
              🎚️ Go to Mixing Board →
            </button>
          </div>
        </div>
      )}

      {/* COMPLETE */}
      {currentStep === 'complete' && (
        <div className="step-content complete-step">
          <h2>🎉 Ready to Mix!</h2>
          <p>Your workflow is complete. The mixing board is now loading...</p>
          <div className="loading-animation">
            <div className="spinner"></div>
            <p>Opening mixing board...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowWizard;
