import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory project store (replace with database in Phase 2)
let projects = [];

// Get all projects
router.get('/', (req, res) => {
  try {
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create new project
router.post('/', (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = {
      id: uuidv4(),
      name,
      description: description || '',
      files: [],
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    projects.push(project);

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Error creating project:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get specific project
router.get('/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update project
router.put('/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;

    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (name) project.name = name;
    if (description) project.description = description;
    project.lastModified = new Date().toISOString();

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Error updating project:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete project
router.delete('/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const index = projects.findIndex(p => p.id === projectId);

    if (index === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    projects.splice(index, 1);

    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('Error deleting project:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Add file to project
router.post('/:projectId/files', (req, res) => {
  try {
    const { projectId } = req.params;
    const { fileId, filePath, filename, filesize } = req.body;

    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const file = {
      fileId: fileId || uuidv4(),
      filePath,
      filename,
      filesize,
      added: new Date().toISOString()
    };

    project.files.push(file);
    project.lastModified = new Date().toISOString();

    res.json({
      success: true,
      file
    });
  } catch (error) {
    console.error('Error adding file:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete file from project
router.delete('/:projectId/files/:fileId', (req, res) => {
  try {
    const { projectId, fileId } = req.params;

    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const fileIndex = project.files.findIndex(f => f.fileId === fileId);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File not found' });
    }

    project.files.splice(fileIndex, 1);
    project.lastModified = new Date().toISOString();

    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Error deleting file:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
