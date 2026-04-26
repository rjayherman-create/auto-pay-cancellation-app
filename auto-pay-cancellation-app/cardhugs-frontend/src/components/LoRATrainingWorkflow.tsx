import React, { useState, useEffect } from 'react';
import {
  Sparkles, Upload, Loader2, CheckCircle, AlertCircle, ChevronRight,
  Edit2, Copy, Trash2, ArrowRight, BookOpen, Zap, Target, ImageIcon,
  Settings, FileText, CheckCircle2, Clock, AlertTriangle
} from 'lucide-react';

interface TrainingImage {
  file: File;
  preview: string;
  id: string;
}

interface TrainingJob {
  id: string;
  name: string;
  style_pack_name: string;
  trigger_word: string;
  images_count: number;
  status: 'pending' | 'training' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  model_url?: string;
  epochs?: number;
  learning_rate?: number;
  training_time?: number;
}

interface FormData {
  stylePackName: string;
  styleDescription: string;
  triggerWord: string;
  triggerWordAlias: string;
  jobName: string;
  epochs: number;
  learningRate: number;
}

type Step = 'overview' | 'style-definition' | 'trigger-word' | 'upload-images' | 'training-config' | 'review' | 'training';

export function LoRATrainingWorkflow() {
  // Form state
  const [currentStep, setCurrentStep] = useState<Step>('overview');
  const [formData, setFormData] = useState<FormData>({
    stylePackName: '',
    styleDescription: '',
    triggerWord: '',
    triggerWordAlias: '',
    jobName: '',
    epochs: 100,
    learningRate: 0.0001
  });

  // Images state
  const [images, setImages] = useState<TrainingImage[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Jobs state
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<TrainingJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trainingInProgress, setTrainingInProgress] = useState(false);

  // Edit mode
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  // Get auth token
  const getAuthToken = () => localStorage.getItem('cardhugs_token') || '';

  // Fetch existing jobs
  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-generate job name when reaching training-config step
  useEffect(() => {
    if (currentStep === 'training-config' && !formData.jobName && formData.triggerWord) {
      const suggestedName = generateJobName(formData.triggerWord);
      setFormData(prev => ({ ...prev, jobName: suggestedName }));
    }
  }, [currentStep, formData.triggerWord, formData.jobName]);

  const generateJobName = (triggerWord: string): string => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const cleanTrigger = triggerWord
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 30);
    return `${cleanTrigger}-${dateStr}-${timeStr}`;
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/training', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await response.json();
      if (data.jobs) {
        setJobs(data.jobs);
        // Update selected job if it exists
        if (selectedJob) {
          const updated = data.jobs.find((j: TrainingJob) => j.id === selectedJob.id);
          if (updated) setSelectedJob(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const handleImageUpload = (uploadedFiles: File[]) => {
    const newImages = uploadedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
    setImages(prev => [...prev, ...newImages]);
    setError('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) {
      setError('Please drop image files only');
      return;
    }
    handleImageUpload(files as File[]);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 'style-definition':
        if (!formData.stylePackName.trim()) {
          setError('Style pack name is required');
          return false;
        }
        if (!formData.styleDescription.trim()) {
          setError('Style description is required');
          return false;
        }
        return true;
      case 'trigger-word':
        if (!formData.triggerWord.trim()) {
          setError('Trigger word is required');
          return false;
        }
        if (formData.triggerWord.length < 2 || formData.triggerWord.length > 15) {
          setError('Trigger word must be 2-15 characters');
          return false;
        }
        if (!/^[a-z0-9]+$/.test(formData.triggerWord.toLowerCase())) {
          setError('Trigger word must contain only letters and numbers (no spaces)');
          return false;
        }
        return true;
      case 'upload-images':
        if (images.length < 10) {
          setError('Please upload at least 10 images (recommended: 20-50)');
          return false;
        }
        if (images.length > 200) {
          setError('Maximum 200 images allowed');
          return false;
        }
        return true;
      case 'training-config':
        if (!formData.jobName.trim()) {
          setError('Job name is required');
          return false;
        }
        if (formData.epochs < 10 || formData.epochs > 2000) {
          setError('Epochs must be between 10 and 2000');
          return false;
        }
        if (formData.learningRate < 0.00001 || formData.learningRate > 0.1) {
          setError('Learning rate must be between 0.00001 and 0.1');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const moveToStep = (step: Step) => {
    setError('');
    if (validateStep(currentStep)) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    setTrainingInProgress(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.jobName);
      formDataToSend.append('style_pack_name', formData.stylePackName);
      formDataToSend.append('style_description', formData.styleDescription);
      formDataToSend.append('trigger_word', formData.triggerWord);
      formDataToSend.append('trigger_word_alias', formData.triggerWordAlias);
      formDataToSend.append('epochs', formData.epochs.toString());
      formDataToSend.append('learning_rate', formData.learningRate.toString());

      images.forEach((img) => {
        formDataToSend.append(`images`, img.file);
      });

      const response = await fetch('/api/training', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start training');
      }

      setSuccess(`✅ LoRA Training Started!\nJob: ${formData.jobName}\nID: ${data.job?.id}`);
      setCurrentStep('training');
      setSelectedJob(data.job);
      
      // Reset form
      setFormData({
        stylePackName: '',
        styleDescription: '',
        triggerWord: '',
        triggerWordAlias: '',
        jobName: '',
        epochs: 100,
        learningRate: 0.0001
      });
      setImages([]);
      
      // Refresh jobs
      fetchJobs();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start training job');
      setCurrentStep('review');
    } finally {
      setTrainingInProgress(false);
    }
  };

  const copyTriggerWord = () => {
    navigator.clipboard.writeText(formData.triggerWord);
    setSuccess('Trigger word copied!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure? This will delete the training job and cannot be undone.')) return;

    try {
      const response = await fetch(`/api/training/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });

      const data = await response.json();
      if (data.success) {
        setJobs(prev => prev.filter(j => j.id !== jobId));
        if (selectedJob?.id === jobId) setSelectedJob(null);
        setSuccess('Training job deleted');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete job');
    }
  };

  const downloadModel = async (job: TrainingJob) => {
    if (!job.model_url) {
      setError('Model file not yet available');
      return;
    }
    // Implementation would download the model file
    window.open(job.model_url, '_blank');
  };

  // Step components
  const StepContent = () => {
    switch (currentStep) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">What is LoRA Training?</h3>
              <p className="text-gray-700 mb-4">
                LoRA (Low-Rank Adaptation) is a machine learning technique that allows you to create custom AI art styles. 
                By training a LoRA model on your images, you create a unique style that can be applied to card generation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <Target className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Why Train a LoRA?</h4>
                    <p className="text-sm text-blue-800">
                      Create a unique visual style that's consistent across all your cards. Perfect for brand identity and visual cohesion.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex gap-3">
                  <Sparkles className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">How It Works</h4>
                    <p className="text-sm text-green-800">
                      Upload 10-50 images of your desired style. AI learns the visual patterns and creates a reusable model.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex gap-3">
                  <Clock className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-purple-900 mb-1">Training Time</h4>
                    <p className="text-sm text-purple-800">
                      Typically 5-30 minutes depending on image count and epochs. You can monitor progress in real-time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex gap-3">
                  <Zap className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-orange-900 mb-1">Use Your LoRA</h4>
                    <p className="text-sm text-orange-800">
                      Once trained, use your trigger word to generate cards with your custom style in the Card Creator.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex gap-3">
                <BookOpen className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">📋 Best Practices</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Use 20-50 high-quality images for best results</li>
                    <li>Images should all feature your desired style consistently</li>
                    <li>Variety in composition helps create a flexible style</li>
                    <li>Training takes longer but results in better quality</li>
                    <li>Keep trigger words short and unique (2-5 characters)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'style-definition':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Define Your Style</h3>
              <p className="text-gray-600 mb-4">
                Give your LoRA a descriptive name and description. This helps you remember what style you trained and identify it later.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Style Pack Name *
              </label>
              <input
                type="text"
                value={formData.stylePackName}
                onChange={(e) => setFormData(prev => ({ ...prev, stylePackName: e.target.value }))}
                placeholder="e.g., Watercolor Flowers, Minimalist Modern, Oil Painting"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
              />
              <p className="mt-2 text-xs text-gray-500">
                A clear, descriptive name for your custom style
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Style Description *
              </label>
              <textarea
                value={formData.styleDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, styleDescription: e.target.value }))}
                placeholder="Describe the visual characteristics of your style. Example: 'Soft watercolor paintings with pastel colors, delicate brushstrokes, floral subjects'"
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
              />
              <p className="mt-2 text-xs text-gray-500">
                This description helps you remember the style and is used by AI during generation
              </p>
            </div>
          </div>
        );

      case 'trigger-word':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Set Trigger Word</h3>
              <p className="text-gray-600 mb-4">
                A trigger word is a unique keyword that activates your trained style in AI generation prompts.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Primary Trigger Word *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.triggerWord}
                  onChange={(e) => setFormData(prev => ({ ...prev, triggerWord: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                  placeholder="e.g., wpclr, oilpnt, minml"
                  maxLength={15}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition font-mono"
                />
                <button
                  onClick={copyTriggerWord}
                  disabled={!formData.triggerWord}
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                  title="Copy trigger word"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                2-15 characters, lowercase, no spaces. Examples: wpclr, oilpnt, minml, sketch
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Alternative Trigger Word (Optional)
              </label>
              <input
                type="text"
                value={formData.triggerWordAlias}
                onChange={(e) => setFormData(prev => ({ ...prev, triggerWordAlias: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                placeholder="e.g., watercolor"
                maxLength={15}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition font-mono"
              />
              <p className="mt-2 text-xs text-gray-500">
                Optional: Another word that also triggers this style. Useful for longer or more descriptive words.
              </p>
            </div>

            {formData.triggerWord && (
              <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                <p className="text-sm font-semibold text-purple-900 mb-2">📝 Example Usage</p>
                <p className="text-xs text-purple-800 font-mono">
                  "a birthday card in {formData.triggerWord} style"
                </p>
              </div>
            )}
          </div>
        );

      case 'upload-images':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">🖼️ Upload Training Images</h3>
              <p className="text-gray-600 mb-2">
                Upload 10-200 images that represent your desired style. Recommended: 20-50 images.
              </p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 mb-4">
                <strong>💡 Tip:</strong> More images = better quality but longer training time. Aim for 20-50 well-curated images.
              </div>
            </div>

            {/* Drag & drop area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-3 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
                dragActive
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
              }`}
            >
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-700">Drag images here</p>
              <p className="text-sm text-gray-500 mt-1">or click to select files</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(Array.from(e.target.files || []))}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="mt-4 inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition">
                  Select Images
                </div>
              </label>
            </div>

            {/* Image preview grid */}
            {images.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="font-semibold text-gray-700">
                    {images.length} image{images.length !== 1 ? 's' : ''} selected
                  </p>
                  <div className="text-sm text-gray-500">
                    {images.length < 10 ? (
                      <span className="text-orange-600 font-medium">Need {10 - images.length} more</span>
                    ) : (
                      <span className="text-green-600 font-medium">✓ Ready</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview}
                        alt="Training"
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'training-config':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">⚙️ Training Configuration</h3>
              <p className="text-gray-600 mb-4">
                Configure the training parameters. Default settings work well for most cases.
              </p>
            </div>

            {/* Job name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Name *
              </label>
              <input
                type="text"
                value={formData.jobName}
                onChange={(e) => setFormData(prev => ({ ...prev, jobName: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition font-mono text-sm"
              />
              <p className="mt-2 text-xs text-gray-500">
                Auto-generated: [trigger-word]-[timestamp]. You can customize this.
              </p>
            </div>

            {/* Epochs */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Training Epochs: <span className="text-purple-600">{formData.epochs}</span>
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="10"
                  max="2000"
                  step="10"
                  value={formData.epochs}
                  onChange={(e) => setFormData(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="grid grid-cols-5 gap-2 text-xs text-gray-500">
                  <div className="text-left">10 (Quick)</div>
                  <div className="text-center">250 (Good)</div>
                  <div className="text-center">500 (Better)</div>
                  <div className="text-center">1000 (Best)</div>
                  <div className="text-right">2000 (Extensive)</div>
                </div>
              </div>
              <p className="mt-3 p-3 bg-blue-50 rounded text-xs text-blue-800">
                <strong>📊 Recommendation:</strong> Start with 100-300 epochs. More epochs = better quality but longer training (30+ minutes).
              </p>
            </div>

            {/* Learning rate */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Learning Rate: <span className="text-purple-600 font-mono">{formData.learningRate.toFixed(6)}</span>
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="-5"
                  max="-1"
                  step="0.1"
                  value={Math.log10(formData.learningRate)}
                  onChange={(e) => setFormData(prev => ({ ...prev, learningRate: Math.pow(10, parseFloat(e.target.value)) }))}
                  className="w-full"
                />
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                  <div className="text-left">Lower (Stable)</div>
                  <div className="text-center">Default</div>
                  <div className="text-right">Higher (Fast)</div>
                </div>
              </div>
              <p className="mt-3 p-3 bg-blue-50 rounded text-xs text-blue-800">
                <strong>💡 Default (0.0001):</strong> Works well for most cases. Lower values = slower but more stable training.
              </p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-900 mb-2">✓ Configuration Ready</p>
              <ul className="text-xs text-green-800 space-y-1">
                <li>• Estimated training time: {formData.epochs < 100 ? '5-10' : formData.epochs < 500 ? '10-20' : '20-60'} minutes</li>
                <li>• Images: {images.length}</li>
                <li>• Style: {formData.stylePackName}</li>
                <li>• Trigger word: <span className="font-mono">{formData.triggerWord}</span></li>
              </ul>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">✅ Review Your LoRA Training</h3>
              <p className="text-gray-600 mb-4">
                Everything looks good? Review the details below and start training.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Style Information */}
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Style Name</p>
                <p className="text-lg font-bold text-gray-900 mb-3">{formData.stylePackName}</p>
                
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Description</p>
                <p className="text-sm text-gray-700 italic">{formData.styleDescription}</p>
              </div>

              {/* Trigger Words */}
              <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Trigger Words</p>
                <div className="space-y-2">
                  <div className="inline-block bg-purple-100 text-purple-900 px-3 py-1 rounded-full font-mono text-sm">
                    {formData.triggerWord}
                  </div>
                  {formData.triggerWordAlias && (
                    <div className="inline-block ml-2 bg-purple-100 text-purple-900 px-3 py-1 rounded-full font-mono text-sm">
                      {formData.triggerWordAlias}
                    </div>
                  )}
                </div>
              </div>

              {/* Training Images */}
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Training Images</p>
                <p className="text-3xl font-bold text-blue-600">{images.length}</p>
                <p className="text-xs text-blue-700 mt-1">images ready for training</p>
              </div>

              {/* Training Parameters */}
              <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Training Config</p>
                <div className="space-y-1 text-sm text-orange-900">
                  <p><strong>Epochs:</strong> {formData.epochs}</p>
                  <p><strong>Learning Rate:</strong> {formData.learningRate.toFixed(6)}</p>
                  <p className="text-xs text-orange-700 mt-2">Est. time: {formData.epochs < 100 ? '5-10' : formData.epochs < 500 ? '10-20' : '20-60'} minutes</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900 mb-1">Ready to Train</p>
                  <p className="text-sm text-green-800">
                    All settings configured. Click "Start Training" to begin. You can monitor progress on the Training Status page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'training':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">🚀 LoRA Training in Progress</h3>
            </div>

            {selectedJob ? (
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-purple-600 font-semibold uppercase">Training Job</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedJob.style_pack_name}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      selectedJob.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedJob.status === 'training' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                      selectedJob.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedJob.status === 'training' ? '⚙️ Training' : 
                       selectedJob.status === 'completed' ? '✅ Complete' :
                       selectedJob.status === 'failed' ? '❌ Failed' :
                       '⏳ Pending'}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p><strong>Trigger Word:</strong> <span className="font-mono bg-purple-100 px-2 py-1 rounded">{selectedJob.trigger_word}</span></p>
                    <p><strong>Images:</strong> {selectedJob.images_count}</p>
                    {selectedJob.epochs && <p><strong>Epochs:</strong> {selectedJob.epochs}</p>}
                    <p><strong>Created:</strong> {new Date(selectedJob.created_at).toLocaleString()}</p>
                    {selectedJob.training_time && <p><strong>Training Time:</strong> {selectedJob.training_time} minutes</p>}
                  </div>
                </div>

                {selectedJob.status === 'training' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-3">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-blue-900 mb-1">Training in Progress...</p>
                        <p className="text-sm text-blue-800">
                          This page will auto-refresh every 10 seconds. You can check back later.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedJob.status === 'completed' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-green-900 mb-2">✅ Training Complete!</p>
                        <p className="text-sm text-green-800 mb-3">
                          Your LoRA model is ready to use. You can now use the trigger word in card generation.
                        </p>
                        <button
                          onClick={() => {
                            setCurrentStep('overview');
                            setFormData({
                              stylePackName: '',
                              styleDescription: '',
                              triggerWord: '',
                              triggerWordAlias: '',
                              jobName: '',
                              epochs: 100,
                              learningRate: 0.0001
                            });
                            setImages([]);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
                        >
                          Train Another Style
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedJob.status === 'failed' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-red-900 mb-1">Training Failed</p>
                        <p className="text-sm text-red-800 mb-3">
                          The training job encountered an error. Please try again or contact support.
                        </p>
                        <button
                          onClick={() => setCurrentStep('overview')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
                        >
                          Start Over
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3 text-purple-600" />
                <p>Loading training status...</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Step indicator
  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'style-definition', label: 'Define Style', icon: <FileText className="w-4 h-4" /> },
    { id: 'trigger-word', label: 'Trigger Word', icon: <Target className="w-4 h-4" /> },
    { id: 'upload-images', label: 'Upload Images', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'training-config', label: 'Configure', icon: <Settings className="w-4 h-4" /> },
    { id: 'review', label: 'Review', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'training', label: 'Training', icon: <Sparkles className="w-4 h-4" /> }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">🎨 LoRA Training Hub</h1>
              <p className="text-lg opacity-90">
                Create custom AI art styles by training LoRA models with your images
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-75">Step {currentStepIndex + 1} of {steps.length}</p>
              <p className="text-2xl font-bold">{steps[currentStepIndex].label}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Step indicator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Training Steps</h3>
              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (idx <= currentStepIndex) {
                        setCurrentStep(step.id);
                      }
                    }}
                    disabled={idx > currentStepIndex}
                    className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium ${
                      step.id === currentStep
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-400'
                        : idx < currentStepIndex
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {step.icon}
                    {step.label}
                    {idx < currentStepIndex && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                  </button>
                ))}
              </div>

              {jobs.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <p className="font-semibold text-gray-900 mb-3 text-sm">Recent Jobs</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {jobs.slice(0, 5).map(job => (
                      <button
                        key={job.id}
                        onClick={() => {
                          setSelectedJob(job);
                          setCurrentStep('training');
                        }}
                        className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition"
                      >
                        <p className="text-xs font-semibold text-gray-700 truncate">{job.style_pack_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {job.status === 'completed' ? '✅ Done' : job.status === 'training' ? '⚙️ Training' : job.status === 'failed' ? '❌ Failed' : '⏳ Pending'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Error message */}
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{error}</p>
                </div>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg text-green-800 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold whitespace-pre-line">{success}</p>
                </div>
              </div>
            )}

            {/* Main card */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <StepContent />
            </div>

            {/* Navigation buttons */}
            {currentStep !== 'training' && (
              <div className="flex gap-3 justify-between">
                <button
                  onClick={() => moveToStep(steps[currentStepIndex - 1]?.id)}
                  disabled={currentStepIndex === 0}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 font-semibold transition"
                >
                  ← Previous
                </button>

                {currentStep === 'review' ? (
                  <button
                    onClick={handleSubmit}
                    disabled={trainingInProgress}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-semibold flex items-center gap-2 transition shadow-lg"
                  >
                    {trainingInProgress ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Starting Training...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Start LoRA Training
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => moveToStep(steps[currentStepIndex + 1]?.id)}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold flex items-center gap-2 transition shadow-lg"
                  >
                    Next
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoRATrainingWorkflow;
