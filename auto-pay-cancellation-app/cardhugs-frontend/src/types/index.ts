export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  batch_id?: string;
  occasion: string;
  style?: string;
  front_text: string;
  front_image_url?: string;
  inside_text: string;
  inside_image_url?: string;
  status: 'draft' | 'qc_passed' | 'approved' | 'rejected' | 'published';
  quality_score?: number;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'failed';
  card_count: number;
  created_at: string;
  updated_at: string;
}

export interface Occasion {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  emoji: string;
  color: string;
  is_active: boolean;
  lora_model_id: string;
  seasonal_start?: string;
  seasonal_end?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingJob {
  id: string;
  name: string;
  style_pack_name: string;
  status: 'pending' | 'training' | 'completed' | 'failed';
  images_urls: string[];
  trigger_word: string;
  epochs?: number;
  learning_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  key: string;
  value: any;
  category?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  created_at: string;
}

export interface ApprovalCard extends Card {
  notes?: string;
}

export interface StoreCard extends Card {
  inventory_count?: number;
  is_published?: boolean;
}
