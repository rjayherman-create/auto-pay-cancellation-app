import React, { useState, useEffect } from 'react';
import './ProjectManager.css';

const ProjectManager = () => {
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'Cartoon Episode 1',
      description: 'Voice acting and mixing for first episode',
      voiceCount: 3,
      scriptCount: 5,
      duration: 180,
      created: '2025-02-14',
      status: 'In Progress'
    },
    {
      id: 2,
      name: 'Commercial 30s',
      description: 'Product commercial with music and effects',
      voiceCount: 2,
      scriptCount: 1,
      duration: 30,
      created: '2025-02-15',
      status: 'Completed'
    }
  ]);

  const [view, setView] = useState('list'); // list, create, detail
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectDuration, setNewProjectDuration] = useState(180);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createProject = () => {
    if (!newProjectName.trim()) {
      setMessage('❌ Please enter a project name');
      return;
    }

    const newProject = {
      id: projects.length + 1,
      name: newProjectName,
      description: newProjectDesc,
      voiceCount: 0,
      scriptCount: 0,
      duration: newProjectDuration,
      created: new Date().toISOString().split('T')[0],
      status: 'New'
    };

    setProjects([...projects, newProject]);
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectDuration(180);
    setView('list');
    setMessage('✅ Project created successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const deleteProject = (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    setProjects(projects.filter(p => p.id !== id));
    setMessage('✅ Project deleted');
    setTimeout(() => setMessage(''), 3000);
  };

  const openProject = (project) => {
    setSelectedProject(project);
    setView('detail');
  };

  return (
    <div className="project-manager-container">
      <div className="pm-header">
        <h1>📁 Project Manager</h1>
        <p>Create and manage your voice-over production projects</p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="pm-list-view">
          <div className="list-header">
            <h2>My Projects</h2>
            <button
              onClick={() => setView('create')}
              className="btn-create-project"
            >
              ➕ New Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="empty-projects">
              <p>📭 No projects yet</p>
              <p className="small">Click "New Project" to create your first project</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(project => (
                <div key={project.id} className="project-card">
                  <div className="card-header">
                    <h3>{project.name}</h3>
                    <span className={`status-badge ${project.status.toLowerCase()}`}>
                      {project.status}
                    </span>
                  </div>

                  <p className="card-description">{project.description || 'No description'}</p>

                  <div className="card-stats">
                    <stat>
                      <span className="stat-icon">🎤</span>
                      <span>{project.voiceCount} Voices</span>
                    </stat>
                    <stat>
                      <span className="stat-icon">📝</span>
                      <span>{project.scriptCount} Scripts</span>
                    </stat>
                    <stat>
                      <span className="stat-icon">⏱️</span>
                      <span>{project.duration}s</span>
                    </stat>
                  </div>

                  <p className="card-date">Created: {project.created}</p>

                  <div className="card-actions">
                    <button
                      onClick={() => openProject(project)}
                      className="btn-open"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE VIEW */}
      {view === 'create' && (
        <div className="pm-create-view">
          <div className="create-card">
            <h2>📁 Create New Project</h2>

            <div className="form-group">
              <label>Project Name *</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Cartoon Episode 1"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Describe your project..."
                className="form-textarea"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Project Duration (seconds)</label>
              <input
                type="number"
                value={newProjectDuration}
                onChange={(e) => setNewProjectDuration(parseInt(e.target.value))}
                className="form-input"
                min="1"
                max="3600"
              />
            </div>

            <div className="form-actions">
              <button
                onClick={createProject}
                disabled={loading}
                className="btn-create"
              >
                {loading ? '🔄 Creating...' : '✅ Create Project'}
              </button>
              <button
                onClick={() => setView('list')}
                className="btn-cancel"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL VIEW */}
      {view === 'detail' && selectedProject && (
        <div className="pm-detail-view">
          <button
            onClick={() => setView('list')}
            className="btn-back"
          >
            ← Back to Projects
          </button>

          <div className="detail-header">
            <h2>{selectedProject.name}</h2>
            <span className={`status-badge ${selectedProject.status.toLowerCase()}`}>
              {selectedProject.status}
            </span>
          </div>

          {selectedProject.description && (
            <p className="detail-description">{selectedProject.description}</p>
          )}

          {/* PROJECT STATS */}
          <div className="detail-stats">
            <div className="stat-box">
              <div className="stat-label">🎤 Voices</div>
              <div className="stat-value">{selectedProject.voiceCount}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">📝 Scripts</div>
              <div className="stat-value">{selectedProject.scriptCount}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">⏱️ Duration</div>
              <div className="stat-value">{selectedProject.duration}s</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">📅 Created</div>
              <div className="stat-value">{selectedProject.created}</div>
            </div>
          </div>

          {/* SECTIONS */}
          <div className="detail-sections">
            {/* Voices Section */}
            <section className="detail-section">
              <h3>🎤 Project Voices</h3>
              <div className="section-content">
                <button className="btn-add-voice">
                  ➕ Add Voice to Project
                </button>
                <p className="section-info">
                  Add voices from the Voice Library to use in this project
                </p>
              </div>
            </section>

            {/* Scripts Section */}
            <section className="detail-section">
              <h3>📝 Scripts</h3>
              <div className="section-content">
                <button className="btn-add-script">
                  ➕ Create Script
                </button>
                <p className="section-info">
                  Create and manage scripts for voice generation
                </p>
              </div>
            </section>

            {/* Mixing Section */}
            <section className="detail-section">
              <h3>🎚️ Audio Mixing</h3>
              <div className="section-content">
                <button className="btn-open-mixer">
                  🎚️ Open Mixing Board
                </button>
                <p className="section-info">
                  Mix voices, music, and sound effects for this project
                </p>
              </div>
            </section>

            {/* Settings Section */}
            <section className="detail-section">
              <h3>⚙️ Project Settings</h3>
              <div className="settings-list">
                <div className="setting-item">
                  <label>Project Name:</label>
                  <span>{selectedProject.name}</span>
                </div>
                <div className="setting-item">
                  <label>Duration:</label>
                  <span>{selectedProject.duration} seconds</span>
                </div>
                <div className="setting-item">
                  <label>Created:</label>
                  <span>{selectedProject.created}</span>
                </div>
                <div className="setting-item">
                  <label>Status:</label>
                  <span>{selectedProject.status}</span>
                </div>
              </div>
            </section>

            {/* Export Section */}
            <section className="detail-section export-section">
              <h3>💾 Export & Delivery</h3>
              <div className="export-buttons">
                <button className="btn-export-wav">
                  💾 Export as WAV
                </button>
                <button className="btn-export-mp3">
                  💾 Export as MP3
                </button>
                <button className="btn-export-project">
                  📦 Save Project File
                </button>
              </div>
            </section>
          </div>

          {/* DANGER ZONE */}
          <div className="danger-zone">
            <h3>⚠️ Danger Zone</h3>
            <button
              onClick={() => deleteProject(selectedProject.id)}
              className="btn-delete-project"
            >
              🗑️ Delete This Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
