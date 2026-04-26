import React, { useEffect, useState } from 'react';
import { mediaAPI } from '../services/api';
import { Upload, Trash2 } from 'lucide-react';
import type { MediaItem } from '../types';

const MediaManager: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const result = await mediaAPI.listMedia({ limit: 50 });
      setMedia(result.media || []);
    } catch (err) {
      console.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      await mediaAPI.uploadMedia(file);
      await loadMedia();
    } catch (err) {
      console.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media file?')) return;
    
    try {
      await mediaAPI.deleteMedia(id);
      setMedia(media.filter(m => m.id !== id));
    } catch (err) {
      console.error('Delete failed');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Media Manager</h2>

      {/* Upload */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-600 transition">
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-900">Click to upload media</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : media.length === 0 ? (
          <p className="text-gray-600">No media uploaded yet</p>
        ) : (
          media.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden group">
              <img
                src={item.url}
                alt={item.filename}
                className="w-full h-32 object-cover group-hover:opacity-75 transition"
              />
              <div className="p-3 flex items-center justify-between">
                <p className="text-xs text-gray-600 truncate">{item.filename}</p>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MediaManager;
