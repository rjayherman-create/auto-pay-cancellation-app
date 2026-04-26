import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Local JSON Database for Projects
 * Stores all project data, scripts, and voice assignments
 */

class ProjectDatabase {
  constructor() {
    this.dataDir = path.join(__dirname, '../../projects-data');
    this.projectsFile = path.join(this.dataDir, 'projects.json');
    this.scriptsFile = path.join(this.dataDir, 'scripts.json');
    this.ensureDataDir();
    this.loadData();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  loadData() {
    this.projects = this.loadFile(this.projectsFile, []);
    this.scripts = this.loadFile(this.scriptsFile, []);
  }

  loadFile(filePath, defaultValue) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error);
    }
    return defaultValue;
  }

  saveFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Error saving ${filePath}:`, error);
    }
  }

  // ============ PROJECT OPERATIONS ============

  createProject(name, description = '') {
    const project = {
      id: uuidv4(),
      name,
      description,
      voices: [],
      scripts: [],
      settings: {
        duration: 180,
        fps: 24,
        format: 'mp3'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.projects.push(project);
    this.saveFile(this.projectsFile, this.projects);
    return project;
  }

  getProject(projectId) {
    return this.projects.find(p => p.id === projectId);
  }

  getAllProjects() {
    return this.projects;
  }

  updateProject(projectId, updates) {
    const project = this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const updated = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const index = this.projects.findIndex(p => p.id === projectId);
    this.projects[index] = updated;
    this.saveFile(this.projectsFile, this.projects);
    return updated;
  }

  deleteProject(projectId) {
    this.projects = this.projects.filter(p => p.id !== projectId);
    this.scripts = this.scripts.filter(s => s.projectId !== projectId);
    this.saveFile(this.projectsFile, this.projects);
    this.saveFile(this.scriptsFile, this.scripts);
    return true;
  }

  // ============ VOICE ASSIGNMENT ============

  addVoiceToProject(projectId, voiceData) {
    const project = this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const voice = {
      id: uuidv4(),
      voiceId: voiceData.voiceId,
      voiceName: voiceData.voiceName,
      characterName: voiceData.characterName || voiceData.voiceName,
      personality: voiceData.personality || {},
      stability: voiceData.stability || 0.5,
      similarityBoost: voiceData.similarityBoost || 0.75,
      addedAt: new Date().toISOString()
    };

    project.voices.push(voice);
    return this.updateProject(projectId, project);
  }

  removeVoiceFromProject(projectId, voiceId) {
    const project = this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    project.voices = project.voices.filter(v => v.id !== voiceId);
    return this.updateProject(projectId, project);
  }

  getProjectVoices(projectId) {
    const project = this.getProject(projectId);
    return project ? project.voices : [];
  }

  // ============ SCRIPT OPERATIONS ============

  createScript(projectId, scriptData) {
    const script = {
      id: uuidv4(),
      projectId,
      name: scriptData.name,
      content: scriptData.content,
      voiceId: scriptData.voiceId || null,
      voiceName: scriptData.voiceName || 'None',
      type: scriptData.type || 'dialogue', // dialogue, narration, sfx, music
      duration: scriptData.duration || null,
      status: scriptData.status || 'draft', // draft, generated, mixed, final
      audioUrl: scriptData.audioUrl || null,
      tags: scriptData.tags || [],
      notes: scriptData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.scripts.push(script);
    this.saveFile(this.scriptsFile, this.scripts);
    return script;
  }

  getScript(scriptId) {
    return this.scripts.find(s => s.id === scriptId);
  }

  getProjectScripts(projectId) {
    return this.scripts.filter(s => s.projectId === projectId);
  }

  updateScript(scriptId, updates) {
    const script = this.getScript(scriptId);
    if (!script) throw new Error('Script not found');

    const updated = {
      ...script,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const index = this.scripts.findIndex(s => s.id === scriptId);
    this.scripts[index] = updated;
    this.saveFile(this.scriptsFile, this.scripts);
    return updated;
  }

  deleteScript(scriptId) {
    this.scripts = this.scripts.filter(s => s.id !== scriptId);
    this.saveFile(this.scriptsFile, this.scripts);
    return true;
  }

  // ============ BULK OPERATIONS ============

  getProjectWithDetails(projectId) {
    const project = this.getProject(projectId);
    if (!project) return null;

    return {
      ...project,
      scripts: this.getProjectScripts(projectId),
      voiceCount: project.voices.length,
      scriptCount: this.getProjectScripts(projectId).length
    };
  }

  searchScripts(projectId, query) {
    const projectScripts = this.getProjectScripts(projectId);
    return projectScripts.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.content.toLowerCase().includes(query.toLowerCase()) ||
      s.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }
}

export default new ProjectDatabase();
