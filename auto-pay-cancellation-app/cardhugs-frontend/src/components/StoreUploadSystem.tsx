import React, { useState, useEffect } from 'react';
import { Download, Upload, Package, AlertCircle, CheckCircle2, Loader } from 'lucide-react';

interface ApprovedCard {
  id: string;
  occasion: string;
  front_text: string;
  front_image_url?: string;
  inside_text: string;
  inside_image_url?: string;
  style?: string;
  quality_score?: number;
}

interface ExportBatch {
  id: string;
  name: string;
  cardCount: number;
  status: 'pending' | 'ready' | 'exporting' | 'completed';
  createdAt: string;
  exportedAt?: string;
  fileSize?: number;
}

const StoreUploadSystem: React.FC = () => {
  const [approvedCards, setApprovedCards] = useState<ApprovedCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [batches, setBatches] = useState<ExportBatch[]>([]);
  const [batchName, setBatchName] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [cardhugsApiKey, setCardhugsApiKey] = useState(
    localStorage.getItem('cardhugs_api_key') || ''
  );
  const [directUploadEnabled, setDirectUploadEnabled] = useState(false);

  useEffect(() => {
    loadApprovedCards();
    loadExportBatches();
  }, []);

  const loadApprovedCards = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cards?status=approved&limit=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setApprovedCards(data.cards || []);
      }
    } catch (error) {
      console.error('Failed to load approved cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExportBatches = async () => {
    try {
      const response = await fetch('/api/export/batches', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
      }
    } catch (error) {
      console.error('Failed to load export batches:', error);
    }
  };

  const toggleCardSelection = (cardId: string) => {
    const newSelection = new Set(selectedCards);
    if (newSelection.has(cardId)) {
      newSelection.delete(cardId);
    } else {
      newSelection.add(cardId);
    }
    setSelectedCards(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedCards.size === approvedCards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(approvedCards.map(c => c.id)));
    }
  };

  const handleExportZip = async () => {
    if (selectedCards.size === 0) {
      alert('Please select at least one card to export');
      return;
    }

    if (!batchName.trim()) {
      alert('Please enter a batch name');
      return;
    }

    try {
      setExporting(true);
      setUploadStatus('Preparing cards for export...');

      const response = await fetch('/api/export/zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        },
        body: JSON.stringify({
          cardIds: Array.from(selectedCards),
          batchName: batchName.trim()
        })
      });

      if (response.ok) {
        setUploadStatus('Download starting...');
        
        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${batchName.replace(/\s+/g, '_')}_cards.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setUploadStatus('✓ Export completed successfully!');
        setBatchName('');
        setSelectedCards(new Set());
        
        // Reload batches
        setTimeout(() => {
          loadExportBatches();
          setUploadStatus('');
        }, 2000);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      setUploadStatus('✗ Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const handleDirectUpload = async () => {
    if (selectedCards.size === 0) {
      alert('Please select at least one card to upload');
      return;
    }

    if (!cardhugsApiKey.trim()) {
      alert('Please enter your CardHugs API key');
      return;
    }

    try {
      setExporting(true);
      setUploadStatus('Uploading cards to CardHugs...');

      const response = await fetch('/api/export/upload-to-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        },
        body: JSON.stringify({
          cardIds: Array.from(selectedCards),
          cardhugsApiKey,
          batchName: batchName.trim() || 'Batch ' + new Date().toLocaleDateString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        setUploadStatus(`✓ Successfully uploaded ${result.uploadedCount} cards to CardHugs store!`);
        setBatchName('');
        setSelectedCards(new Set());
        
        // Save API key
        localStorage.setItem('cardhugs_api_key', cardhugsApiKey);
        
        setTimeout(() => {
          loadExportBatches();
          setUploadStatus('');
        }, 3000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
    } catch (error) {
      setUploadStatus('✗ Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('cardhugs_api_key', cardhugsApiKey);
    alert('API key saved successfully!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading approved cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-8 h-8 text-indigo-600" />
          <h2 className="text-3xl font-bold">Store Upload System</h2>
        </div>
        <p className="text-gray-600">Export approved cards as ZIP files or upload directly to CardHugs store</p>
      </div>

      {/* Status Message */}
      {uploadStatus && (
        <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
          uploadStatus.includes('✓') 
            ? 'bg-green-50 border-green-200 text-green-900'
            : uploadStatus.includes('✗')
            ? 'bg-red-50 border-red-200 text-red-900'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          {uploadStatus.includes('✓') && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          {uploadStatus.includes('✗') && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {!uploadStatus.includes('✓') && !uploadStatus.includes('✗') && <Loader className="w-5 h-5 flex-shrink-0 animate-spin" />}
          <span>{uploadStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Card Selection Panel */}
        <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Approved Cards ({approvedCards.length})</h3>
            <button
              onClick={toggleSelectAll}
              className="px-3 py-1 text-sm bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200"
            >
              {selectedCards.size === approvedCards.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {approvedCards.map((card) => (
              <div
                key={card.id}
                onClick={() => toggleCardSelection(card.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                  selectedCards.has(card.id)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {card.front_image_url && (
                  <img 
                    src={card.front_image_url} 
                    alt={card.occasion}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                )}
                <p className="text-sm font-medium text-gray-900 truncate">{card.occasion}</p>
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">{card.front_text}</p>
                {card.quality_score && (
                  <p className="text-xs text-indigo-600 mt-2">
                    Quality: {(card.quality_score * 100).toFixed(0)}%
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCards.has(card.id)}
                    readOnly
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-xs text-gray-600">
                    {selectedCards.has(card.id) ? 'Selected' : 'Click to select'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {approvedCards.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No approved cards available for export</p>
            </div>
          )}
        </div>

        {/* Export Options Panel */}
        <div className="space-y-4">
          {/* Batch Name */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Name
            </label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g., Birthday Cards 2025"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-2">
              Selected: {selectedCards.size} cards
            </p>
          </div>

          {/* Export Options */}
          <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-4 space-y-3">
            <h4 className="font-semibold text-indigo-900 mb-3">Export Options</h4>

            {/* ZIP Export */}
            <button
              onClick={handleExportZip}
              disabled={selectedCards.size === 0 || exporting}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium"
            >
              <Download className="w-5 h-5" />
              {exporting ? 'Exporting...' : 'Export as ZIP'}
            </button>

            <div className="border-t border-indigo-200 pt-3">
              <h5 className="text-sm font-semibold text-indigo-900 mb-2">Direct to CardHugs</h5>
              
              <input
                type="password"
                value={cardhugsApiKey}
                onChange={(e) => setCardhugsApiKey(e.target.value)}
                placeholder="Enter CardHugs API key"
                className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />

              <button
                onClick={handleSaveApiKey}
                disabled={!cardhugsApiKey.trim()}
                className="w-full mt-2 px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 disabled:opacity-50"
              >
                Save API Key
              </button>

              <button
                onClick={handleDirectUpload}
                disabled={selectedCards.size === 0 || exporting || !cardhugsApiKey.trim()}
                className="w-full mt-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium"
              >
                <Upload className="w-5 h-5" />
                {exporting ? 'Uploading...' : 'Upload to Store'}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-sm">
            <p className="text-blue-900">
              <strong>📝 ZIP Format:</strong> Cards are exported with metadata, images, and import instructions for future bulk uploads.
            </p>
          </div>
        </div>
      </div>

      {/* Export History */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Export History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Batch Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Cards</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Created</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No export history yet
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{batch.name}</td>
                    <td className="px-6 py-3 text-gray-600">{batch.cardCount}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                        batch.status === 'exporting' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      {batch.status === 'completed' && (
                        <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                          Re-download
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StoreUploadSystem;
