import React, { useEffect, useState } from 'react';
import { Occasion } from '../types';
import { occasionAPI } from '../services/api';
import { Plus, Edit2, Trash2, Search, Save, X } from 'lucide-react';

const OccasionLibrary: React.FC = () => {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: '',
    description: '',
    emoji: '',
    color: '#6366f1',
    is_active: true,
    lora_model_id: '',
    seasonal_start: '',
    seasonal_end: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const categories = ['celebrations', 'milestones', 'sympathy', 'seasonal', 'business', 'personal'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const occasionsData = await occasionAPI.getAll({ limit: 100 });
      setOccasions(occasionsData.occasions || []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const { name, value, type } = target;
    const isCheckbox = type === 'checkbox';
    const checked = (target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: isCheckbox ? checked : value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      category: '',
      description: '',
      emoji: '',
      color: '#6366f1',
      is_active: true,
      lora_model_id: '',
      seasonal_start: '',
      seasonal_end: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError('');
      if (editingId) {
        await occasionAPI.update(editingId, formData);
        setSuccess('Occasion updated');
      } else {
        await occasionAPI.create(formData);
        setSuccess('Occasion created');
      }

      fetchData();
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleEdit = (occasion: Occasion) => {
    setFormData({
      name: occasion.name,
      slug: occasion.slug,
      category: occasion.category,
      description: occasion.description || '',
      emoji: occasion.emoji || '',
      color: occasion.color,
      is_active: occasion.is_active,
      lora_model_id: '',
      seasonal_start: occasion.seasonal_start || '',
      seasonal_end: occasion.seasonal_end || '',
    });
    setEditingId(occasion.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this occasion?')) return;
    try {
      await occasionAPI.delete(id);
      setSuccess('Occasion deleted');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete');
    }
  };

  const filteredOccasions = occasions.filter((occasion: Occasion) => {
    const matchesSearch = occasion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         occasion.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || occasion.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">Occasion Library</h2>
            <p className="text-gray-600 mt-1">Manage card occasions</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Occasion
          </button>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {showForm && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">{editingId ? 'Edit' : 'Create'}</h3>
                  <button onClick={resetForm} className="text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="Name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <input type="text" name="slug" value={formData.slug} onChange={handleFormChange} placeholder="Slug" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <select name="category" value={formData.category} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">Select category...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="text" name="emoji" value={formData.emoji} onChange={handleFormChange} placeholder="Emoji" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <input type="color" name="color" value={formData.color} onChange={handleFormChange} className="w-full h-10 border border-gray-300 rounded cursor-pointer" />
                  <textarea name="description" value={formData.description} onChange={handleFormChange} placeholder="Description" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <div>
                    <label className="text-xs text-gray-600">Seasonal Start</label>
                    <input type="date" name="seasonal_start" value={formData.seasonal_start} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Seasonal End</label>
                    <input type="date" name="seasonal_end" value={formData.seasonal_end} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleFormChange} className="w-4 h-4 rounded" />
                    <label htmlFor="is_active" className="ml-2 text-sm">Active</label>
                  </div>
                  <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 text-sm">
                    <Save className="w-4 h-4" />
                    {editingId ? 'Update' : 'Create'}
                  </button>
                </form>
              </div>
            </div>
          )}

          <div className={`${showForm ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOccasions.map(occasion => (
                <div key={occasion.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded flex items-center justify-center text-xl" style={{ backgroundColor: occasion.color + '20' }}>
                      {occasion.emoji}
                    </div>
                    <div>
                      <h3 className="font-semibold">{occasion.name}</h3>
                      <p className="text-xs text-gray-500">{occasion.category}</p>
                    </div>
                  </div>
                  {occasion.description && <p className="text-sm text-gray-600 mb-3">{occasion.description}</p>}
                  <div className="space-y-1 text-xs mb-4">
                    <div><span className="text-gray-600">Slug:</span> <span>{occasion.slug}</span></div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button onClick={() => handleEdit(occasion)} className="flex-1 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded text-xs font-medium flex items-center justify-center gap-1">
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button onClick={() => handleDelete(occasion.id)} className="flex-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded text-xs font-medium flex items-center justify-center gap-1">
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {filteredOccasions.length === 0 && <div className="text-center py-12 text-gray-600">No occasions found</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OccasionLibrary;
