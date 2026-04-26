import axios from 'axios';
import type {
  User,
  Batch,
  Card,
  Occasion,
  TrainingJob,
  Settings,
  LoginCredentials,
  AuthResponse,
  MediaItem,
} from '../types';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cardhugs_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cardhugs_token');
      localStorage.removeItem('cardhugs_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get('/auth/me');
    return data;
  },

  async register(userData: { email: string; password: string; name: string; role?: string }): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },
};

export const batchAPI = {
  async getAll(params?: { status?: string; occasion?: string; skip?: number; limit?: number }) {
    const { data } = await api.get('/batches', { params });
    return data;
  },

  async getOne(id: string): Promise<Batch> {
    const { data } = await api.get(`/batches/${id}`);
    return data;
  },

  async create(batchData: Partial<Batch>): Promise<Batch> {
    const { data } = await api.post('/batches', batchData);
    return data;
  },

  async update(id: string, batchData: Partial<Batch>): Promise<Batch> {
    const { data } = await api.put(`/batches/${id}`, batchData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/batches/${id}`);
  },

  async getStats(id: string) {
    const { data } = await api.get(`/batches/${id}/stats`);
    return data;
  },
};

export const cardAPI = {
  async getAll(params?: { batch_id?: string; status?: string; occasion?: string; skip?: number; limit?: number }) {
    const { data } = await api.get('/cards', { params });
    return data;
  },

  async getOne(id: string): Promise<Card> {
    const { data } = await api.get(`/cards/${id}`);
    return data;
  },

  async generate(cardData: { prompt: string; occasion: string; style: string; batch_id?: string; lora_model?: string }): Promise<Card> {
    const { data } = await api.post('/cards/generate', cardData);
    return data;
  },

  async update(id: string, cardData: Partial<Card>): Promise<Card> {
    const { data } = await api.put(`/cards/${id}`, cardData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/cards/${id}`);
  },

  // Bulk update status (approve/reject multiple)
  async bulkUpdateStatus(cardIds: string[], status: string) {
    const { data } = await api.put('/cards/bulk/update-status', { cardIds, status });
    return data;
  },

  // Bulk delete cards
  async bulkDelete(cardIds: string[]) {
    const { data } = await api.post('/cards/bulk/delete', { cardIds });
    return data;
  },
};

export const occasionAPI = {
  async getAll(params?: { category?: string; is_active?: boolean; skip?: number; limit?: number }) {
    const { data } = await api.get('/occasions', { params });
    return data;
  },

  async getOne(id: string): Promise<Occasion> {
    const { data } = await api.get(`/occasions/${id}`);
    return data;
  },

  async create(occasionData: Partial<Occasion>): Promise<Occasion> {
    const { data } = await api.post('/occasions', occasionData);
    return data;
  },

  async update(id: string, occasionData: Partial<Occasion>): Promise<Occasion> {
    const { data } = await api.put(`/occasions/${id}`, occasionData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/occasions/${id}`);
  },
};

export const trainingAPI = {
  async getAll(params?: { status?: string; skip?: number; limit?: number }) {
    const { data } = await api.get('/training', { params });
    return data;
  },

  async getOne(id: string): Promise<TrainingJob> {
    const { data } = await api.get(`/training/${id}`);
    return data;
  },

  async create(jobData: {
    name: string;
    style_pack_name: string;
    images_urls: string[];
    trigger_word: string;
    epochs?: number;
    learning_rate?: number;
  }): Promise<TrainingJob> {
    const { data } = await api.post('/training', jobData);
    return data;
  },

  async update(id: string, jobData: Partial<TrainingJob>): Promise<TrainingJob> {
    const { data } = await api.put(`/training/${id}`, jobData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/training/${id}`);
  },
};

export const settingsAPI = {
  async getAll(params?: { category?: string }) {
    const { data } = await api.get('/settings', { params });
    return data;
  },

  async getOne(key: string): Promise<Settings> {
    const { data } = await api.get(`/settings/${key}`);
    return data;
  },

  async save(settingData: { key: string; value: any; category?: string; description?: string }): Promise<Settings> {
    const { data } = await api.post('/settings', settingData);
    return data;
  },

  async delete(key: string): Promise<void> {
    await api.delete(`/settings/${key}`);
  },
};

export const tonesAPI = {
  async getAll(params?: { is_active?: boolean }) {
    const { data } = await api.get('/tones', { params });
    return data;
  },
};

export const visualStylesAPI = {
  async getAll(params?: { is_active?: boolean }) {
    const { data } = await api.get('/visual-styles', { params });
    return data;
  },
};

export const mediaAPI = {
  async uploadMedia(file: File): Promise<{ url: string; id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async listMedia(params?: { skip?: number; limit?: number }): Promise<{ media: MediaItem[] }> {
    const { data } = await api.get('/media', { params });
    return data;
  },

  async deleteMedia(id: string): Promise<void> {
    await api.delete(`/media/${id}`);
  },
};

export const storeAPI = {
  async getStoreInventory(params?: { status?: string; skip?: number; limit?: number }) {
    const { data } = await api.get('/store/inventory', { params });
    return data;
  },

  async unpublishCard(cardId: string): Promise<void> {
    await api.post(`/store/cards/${cardId}/unpublish`);
  },

  async publishCard(cardId: string): Promise<void> {
    await api.post(`/store/cards/${cardId}/publish`);
  },
};

export const aiAPI = {
  async getAISuggestion(prompt: string, occasion?: string): Promise<{ text: string; alternatives?: string[] }> {
    const { data } = await api.post('/ai/suggest', { prompt, occasion });
    return data;
  },
};

// Admin API for database browsing
export const adminAPI = {
  async getDatabases() {
    const { data } = await api.get('/admin/databases');
    return data;
  },

  async getTables() {
    const { data } = await api.get('/admin/tables');
    return data;
  },

  async getTableSchema(tableName: string) {
    const { data } = await api.get(`/admin/tables/${tableName}/schema`);
    return data;
  },

  async getTableData(tableName: string, limit: number = 50, offset: number = 0) {
    const { data } = await api.get(`/admin/tables/${tableName}/data`, {
      params: { limit, offset }
    });
    return data;
  },

  async getStats() {
    const { data } = await api.get('/admin/stats');
    return data;
  },
};

export default api;
