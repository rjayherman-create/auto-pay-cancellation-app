import React, { useState, useEffect } from 'react';
import { Sparkles, Upload, Loader2, CheckCircle, AlertCircle, ChevronRight, Edit2, Copy, Trash2 } from 'lucide-react';

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
}

interface FormData {
  stylePackName: string;
  triggerWord: string;
  jobName: string;
  epochs: number;
  learningRate: number;
}

type Step = 'style-info' | 'trigger-word' | 'upload-images' | 'model-info' | 'review';

export function LoRATraining() {
  // Form state
  const [currentStep, setCurrentStep] = useState<Step>('style-info');
  const [formData, setFormData] = useState<FormData>({
    stylePackName: '',
    triggerWord: '',
    jobName: '',
    epochs: 100,
    learningRate: 0.0001
  });

  // Images state
  const [images, setImages] = useState<TrainingImage[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Jobs state
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit mode
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  // Get auth token
  const getAuthToken = () => localStorage.getItem('cardhugs_token') || '';

  // Fetch existing jobs
  useEffect(() => {
    fetchJobs();
  }, []);

  // Auto-generate job name when reaching model-info step
  useEffect(() => {
    if (currentStep === 'model-info' && !formData.jobName && formData.triggerWord) {
      const suggestedName = generateJobName(formData.triggerWord);
      setFormData(prev => ({ ...prev, jobName: suggestedName }));
    }
  }, [currentStep, formData.triggerWord, formData.jobName]);

  /**
   * Generate job name from trigger word + date
   * Format: [trigger-word]-[YYYYMMDD-HHMMSS]
   * Example: watercolor-floral-20260215-143022
   */
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
      case 'style-info':
        if (!formData.stylePackName.trim()) {
          setError('Style pack name is required');
          return false;
        }
        return true;
      case 'trigger-word':
        if (!formData.triggerWord.trim()) {
          setError('Trigger word is required');
          return false;
        }
        if (formData.triggerWord.length < 2) {
          setError('Trigger word must be at least 2 characters');
          return false;
        }
        return true;
      case 'upload-images':
        if (images.length < 5) {
          setError('Please upload at least 5 images');
          return false;
        }
        if (images.length > 100) {
          setError('Maximum 100 images allowed');
          return false;
        }
        return true;
      case 'model-info':
        if (!formData.jobName.trim()) {
          setError('Job name is required');
          return false;
        }
        if (formData.epochs < 1 || formData.epochs > 1000) {
          setError('Epochs must be between 1 and 1000');
          return false;
        }
        if (formData.learningRate < 0.00001 || formData.learningRate > 0.1) {
          setError('Learning rate must be between 0.00001 and 0.1');
          return false;
        }
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const moveToStep = (step: Step) => {
    setError('');
    if (validateStep(currentStep)) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Prepare form data
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.jobName);
      formDataToSend.append('style_pack_name', formData.stylePackName);
      formDataToSend.append('trigger_word', formData.triggerWord);
      formDataToSend.append('epochs', formData.epochs.toString());
      formDataToSend.append('learning_rate', formData.learningRate.toString());

      // Add images
      images.forEach((img, idx) => {
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

      setSuccess(`✅ Training job "${formData.jobName}" started! ID: ${data.job?.id}`);
      
      // Reset form
      setFormData({
        stylePackName: '',
        triggerWord: '',
        jobName: '',
        epochs: 100,
        learningRate: 0.0001
      });
      setImages([]);
      setCurrentStep('style-info');
      
      // Refresh jobs
      fetchJobs();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start training job');
    } finally {
      setLoading(false);
    }
  };

  const copyJobName = () => {
    navigator.clipboard.writeText(formData.jobName);
    setSuccess('Job name copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const regenerateJobName = () => {
    const newName = generateJobName(formData.triggerWord);
    setFormData(prev => ({ ...prev, jobName: newName }));
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure? This will delete the training job.')) return;

    try {
      const response = await fetch(`/api/training/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });

      const data = await response.json();
      if (data.success) {
        setJobs(prev => prev.filter(j => j.id !== jobId));
        setSuccess('Job deleted');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete job');
    }
  };

  // Step components
  const StepContent = () => {
    switch (currentStep) {
      case 'style-info':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Style Pack Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style Pack Name *
              </label>
              <input
                type="text"
                value={formData.stylePackName}
                onChange={(e) => setFormData(prev => ({ ...prev, stylePackName: e.target.value }))}
                placeholder="e.g., Watercolor Flowers, Minimalist Modern"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="mt-2 text-xs text-gray-500">
                A descriptive name for your custom style (e.g., Watercolor Flowers, Oil Painting)
              </p>
            </div>
          </div>
        );

      case 'trigger-word':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Trigger Word</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigger Word *
              </label>
              <input
                type="text"
                value={formData.triggerWord}
                onChange={(e) => setFormData(prev => ({ ...prev, triggerWord: e.target.value }))}
                placeholder="e.g., sktch, wpclr, minml"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="mt-2 text-xs text-gray-500">
                A unique word (2-15 chars) that activates this style in prompts. Use lowercase, no spaces.
              </p>
              {formData.triggerWord && (
                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
                  <p className="text-sm text-purple-900">
                    <strong>Suggested job name:</strong> {generateJobName(formData.triggerWord)}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'upload-images':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload Training Images</h3>
            <p className="text-sm text-gray-600">
              Upload 5-100 images of your desired style. Better quality and variety = better LoRA model.
            </p>

            {/* Drag & drop area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                dragActive
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Drag and drop images here</p>
              <p className="text-xs text-gray-500 mt-1">or click to select files</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(Array.from(e.target.files || []))}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="mt-4 inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm">
                  Select Images
                </div>
              </label>
            </div>

            {/* Image preview grid */}
            {images.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {images.length} image{images.length !== 1 ? 's' : ''} selected
                </p>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview}
                        alt="Training"
                        className="w-full h-20 object-cover rounded-lg"
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

      case 'model-info':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Model Configuration</h3>

            {/* Job name with auto-generation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Name *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.jobName}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobName: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                />
                <button
                  onClick={copyJobName}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={regenerateJobName}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  title="Regenerate name"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Auto-generated format: [trigger-word]-[YYYYMMDD-HHMMSS]. You can edit this.
              </p>
            </div>

            {/* Epochs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Epochs: {formData.epochs}
              </label>
              <input
                type="range"
                min="1"
                max="1000"
                value={formData.epochs}
                onChange={(e) => setFormData(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">
                More epochs = better quality but longer training time. Typical: 50-500
              </p>
            </div>

            {/* Learning rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Rate: {formData.learningRate.toFixed(6)}
              </label>
              <input
                type="range"
                min="-5"
                max="-1"
                step="0.5"
                value={Math.log10(formData.learningRate)}
                onChange={(e) => setFormData(prev => ({ ...prev, learningRate: Math.pow(10, parseFloat(e.target.value)) }))}
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">
                Controls training speed. Default: 0.0001. Lower = slower but more stable.
              </p>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Your LoRA Training Job</h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Style Pack Name</p>
                <p className="text-lg font-semibold text-gray-900">{formData.stylePackName}</p>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Trigger Word</p>
                <p className="text-lg font-mono bg-purple-50 px-3 py-2 rounded border border-purple-200">
                  {formData.triggerWord}
                </p>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Job Name</p>
                <p className="text-sm font-mono text-gray-700 bg-white px-3 py-2 rounded border border-gray-200">
                  {formData.jobName}
                </p>
              </div>
              <div className="border-t pt-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Training Images</p>
                  <p className="text-2xl font-bold text-purple-600">{images.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Epochs</p>
                  <p className="text-2xl font-bold text-purple-600">{formData.epochs}</p>
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Learning Rate</p>
                <p className="text-lg font-mono text-gray-700">{formData.learningRate.toFixed(6)}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                ✓ Ready to submit! Your LoRA model will be trained on {images.length} images with {formData.epochs} epochs.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Step indicator
  const steps: { id: Step; label: string }[] = [
    { id: 'style-info', label: 'Style Info' },
    { id: 'trigger-word', label: 'Trigger Word' },
    { id: 'upload-images', label: 'Images' },
    { id: 'model-info', label: 'Model Config' },
    { id: 'review', label: 'Review' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-2">LoRA Model Training</h1>
        <p className="text-lg opacity-90">Create custom art styles by training LoRA models with your images</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Step indicator */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                      idx <= currentStepIndex
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition ${
                        idx < currentStepIndex ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Step {currentStepIndex + 1} of {steps.length}</p>
              <p className="text-lg font-semibold text-gray-900">{steps[currentStepIndex].label}</p>
            </div>
          </div>

          {/* Step content */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <StepContent />
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 justify-between">
            <button
              onClick={() => moveToStep(steps[currentStepIndex - 1]?.id)}
              disabled={currentStepIndex === 0}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 font-medium transition"
            >
              ← Previous
            </button>

            {currentStep === 'review' ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-medium flex items-center gap-2 transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting Training...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Start Training
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => moveToStep(steps[currentStepIndex + 1]?.id)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium flex items-center gap-2 transition"
              >
                Next →
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar: Recent jobs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">Training Jobs</h2>

          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No training jobs yet</p>
              <p className="text-xs mt-1">Create your first LoRA model →</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-mono text-xs text-gray-600 truncate">{job.name}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{job.style_pack_name}</p>
                    </div>
                    <button
                      onClick={() => deleteJob(job.id)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-600 transition"
                      title="Delete job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {job.trigger_word}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        job.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : job.status === 'training'
                          ? 'bg-blue-100 text-blue-700'
                          : job.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">{job.images_count} images</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoRATraining;
