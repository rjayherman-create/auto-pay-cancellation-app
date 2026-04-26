-- CardHugs Complete Style Library (50 Styles)
-- Version: 1.0.0
-- Date: February 15, 2026
-- Status: Production Ready

-- Insert all 50 styles with complete metadata

INSERT INTO styles (id, name, slug, category, emoji, color, is_active, base_prompt, style_keywords, lora_trigger_word, training_status, card_count, popularity_score, created_at, updated_at) VALUES

-- ILLUSTRATION STYLES (001-015)
('style-001', 'Watercolor Dreams', 'watercolor-dreams', 'illustration', '🎨', '#A8D8EA', true, 'soft flowing watercolor, gentle bleeds, pastel colors, dreamy aesthetic', ARRAY['watercolor', 'soft', 'gentle', 'dreamy', 'artistic'], 'watercolor_dreams', 'trained', 0, 95, NOW(), NOW()),
('style-002', 'Clean Line Art', 'clean-line-art', 'illustration', '✏️', '#000000', true, 'minimalist black line drawings on white background, clean and precise', ARRAY['line art', 'minimalist', 'clean', 'precise', 'monochrome'], 'clean_line_art', 'trained', 0, 88, NOW(), NOW()),
('style-003', 'Modern Flat Design', 'modern-flat-design', 'illustration', '⬜', '#FF6B6B', true, 'geometric flat illustrations with bold colors and modern aesthetic', ARRAY['flat design', 'geometric', 'bold', 'modern', 'colorful'], 'modern_flat', 'trained', 0, 92, NOW(), NOW()),
('style-004', 'Hand-Drawn Sketch', 'hand-drawn-sketch', 'illustration', '🖍️', '#8B7355', true, 'organic imperfect hand-drawn illustrations with natural lines', ARRAY['sketch', 'hand-drawn', 'organic', 'loose', 'artistic'], 'hand_drawn_sketch', 'trained', 0, 85, NOW(), NOW()),
('style-005', 'Botanical Garden', 'botanical-garden', 'illustration', '🌿', '#2D5016', true, 'elegant botanical illustrations with vintage accuracy and detail', ARRAY['botanical', 'plants', 'vintage', 'elegant', 'detailed'], 'botanical_garden', 'trained', 0, 90, NOW(), NOW()),
('style-006', 'Abstract Expression', 'abstract-expression', 'illustration', '🌈', '#7B2D7B', true, 'non-representational art with flowing shapes and expressive colors', ARRAY['abstract', 'expressive', 'flowing', 'modern', 'artistic'], 'abstract_express', 'training', 0, 72, NOW(), NOW()),
('style-007', 'Geometric Patterns', 'geometric-patterns', 'illustration', '🔷', '#4A90E2', true, 'precise geometric patterns with symmetry and mathematical precision', ARRAY['geometric', 'patterns', 'symmetry', 'precise', 'modern'], 'geometric_pattern', 'training', 0, 78, NOW(), NOW()),
('style-008', 'Paper Collage', 'paper-collage', 'illustration', '📄', '#D4A373', true, 'layered paper collage with vintage ephemera and mixed textures', ARRAY['collage', 'paper', 'vintage', 'layered', 'textured'], 'paper_collage', 'training', 0, 81, NOW(), NOW()),
('style-009', 'Folk Art Traditional', 'folk-art-traditional', 'illustration', '🎭', '#C41E3A', true, 'traditional folk art with cultural patterns and ornamental details', ARRAY['folk art', 'traditional', 'cultural', 'ornamental', 'ethnic'], 'folk_art_trad', 'pending', 0, 65, NOW(), NOW()),
('style-010', 'Sumi-e Ink Wash', 'sumi-e-ink-wash', 'illustration', '🖌️', '#2C2C2C', true, 'minimalist ink wash with flowing brush strokes and negative space', ARRAY['sumi-e', 'ink', 'brush', 'minimalist', 'zen'], 'sumie_ink_wash', 'training', 0, 83, NOW(), NOW()),
('style-011', 'Vibrant Gouache', 'vibrant-gouache', 'illustration', '🎨', '#FF4081', true, 'opaque gouache paintings with vibrant saturated colors', ARRAY['gouache', 'vibrant', 'opaque', 'colorful', 'painterly'], 'vibrant_gouache', 'training', 0, 79, NOW(), NOW()),
('style-012', 'Soft Pastel Dreams', 'soft-pastel-dreams', 'illustration', '✨', '#FFB3D9', true, 'soft pastel art with gentle color blending and dreamy quality', ARRAY['pastel', 'soft', 'dreamy', 'gentle', 'blended'], 'soft_pastel', 'pending', 0, 74, NOW(), NOW()),
('style-013', 'Detailed Pen & Ink', 'detailed-pen-ink', 'illustration', '🖊️', '#1A1A1A', true, 'detailed pen and ink with cross-hatching and fine lines', ARRAY['pen and ink', 'detailed', 'cross-hatching', 'intricate', 'fine'], 'pen_ink_detail', 'trained', 0, 86, NOW(), NOW()),
('style-014', 'Digital Painting Pro', 'digital-painting-pro', 'illustration', '🖥️', '#00D4FF', true, 'professional digital painting with smooth blends and clean execution', ARRAY['digital', 'painting', 'professional', 'smooth', 'polished'], 'digital_paint_pro', 'training', 0, 82, NOW(), NOW()),
('style-015', 'Mixed Media Fusion', 'mixed-media-fusion', 'illustration', '🎪', '#AA5533', true, 'combined techniques with layered textures and experimental approach', ARRAY['mixed media', 'experimental', 'layered', 'textured', 'fusion'], 'mixed_media_art', 'pending', 0, 68, NOW(), NOW()),

-- AESTHETIC STYLES (016-027)
('style-016', 'Pure Minimalism', 'pure-minimalism', 'aesthetic', '⚪', '#FFFFFF', true, 'ultra-clean minimalist design with abundant white space and simplicity', ARRAY['minimalism', 'clean', 'minimal', 'simple', 'whitespace'], 'pure_minimal', 'trained', 0, 91, NOW(), NOW()),
('style-017', 'Nostalgic Vintage', 'nostalgic-vintage', 'aesthetic', '📽️', '#B89968', true, 'nostalgic vintage design with aged textures and retro color palettes', ARRAY['vintage', 'nostalgic', 'retro', 'aged', 'classic'], 'nostalgic_vintage', 'trained', 0, 89, NOW(), NOW()),
('style-018', 'Modern Contemporary', 'modern-contemporary', 'aesthetic', '🏛️', '#1C1C1C', true, 'sleek contemporary design with sophistication and current trends', ARRAY['contemporary', 'modern', 'sleek', 'sophisticated', 'trendy'], 'modern_contemp', 'trained', 0, 87, NOW(), NOW()),
('style-019', 'Rustic Charm', 'rustic-charm', 'aesthetic', '🪵', '#704214', true, 'natural rustic design with earthy textures and warm tones', ARRAY['rustic', 'earthy', 'natural', 'warm', 'charm'], 'rustic_charm', 'training', 0, 80, NOW(), NOW()),
('style-020', 'Elegant Luxury', 'elegant-luxury', 'aesthetic', '👑', '#C9A961', true, 'sophisticated luxury design with refinement and premium materials', ARRAY['luxury', 'elegant', 'sophisticated', 'premium', 'refined'], 'elegant_luxury', 'trained', 0, 93, NOW(), NOW()),
('style-021', 'Whimsical Wonder', 'whimsical-wonder', 'aesthetic', '🌟', '#FF69B4', true, 'playful whimsical design with fantasy charm and imaginative elements', ARRAY['whimsical', 'playful', 'fantasy', 'imaginative', 'charming'], 'whimsical_wonder', 'training', 0, 76, NOW(), NOW()),
('style-022', 'Bold & Graphic', 'bold-graphic', 'aesthetic', '⚡', '#FF0000', true, 'strong bold graphics with high contrast and dramatic impact', ARRAY['bold', 'graphic', 'high contrast', 'dramatic', 'strong'], 'bold_graphic', 'training', 0, 84, NOW(), NOW()),
('style-023', 'Monochrome Elegance', 'monochrome-elegance', 'aesthetic', '⬛', '#333333', true, 'elegant single-color palette with tonal variations and depth', ARRAY['monochrome', 'elegant', 'tonal', 'sophisticated', 'minimal'], 'monochrome_elegant', 'trained', 0, 86, NOW(), NOW()),
('style-024', 'Gentle Pastels', 'gentle-pastels', 'aesthetic', '🌸', '#FFE6F0', true, 'gentle pastel colors with calming aesthetics and soft appeal', ARRAY['pastel', 'gentle', 'calming', 'soft', 'soothing'], 'gentle_pastels', 'trained', 0, 88, NOW(), NOW()),
('style-025', 'Bright & Vibrant', 'bright-vibrant', 'aesthetic', '🌞', '#FFD700', true, 'saturated vibrant colors with energetic impact and playfulness', ARRAY['vibrant', 'bright', 'energetic', 'colorful', 'saturated'], 'bright_vibrant', 'training', 0, 75, NOW(), NOW()),
('style-026', 'Neutral & Natural', 'neutral-natural', 'aesthetic', '🍃', '#A0A08A', true, 'neutral earth tones with organic aesthetics and natural materials', ARRAY['neutral', 'natural', 'earthy', 'organic', 'organic'], 'neutral_natural', 'trained', 0, 79, NOW(), NOW()),
('style-027', 'Metallic Shine', 'metallic-shine', 'aesthetic', '✨', '#D4AF37', true, 'metallic accents with gold, silver, and copper shine effects', ARRAY['metallic', 'gold', 'silver', 'shine', 'gloss'], 'metallic_shine', 'pending', 0, 70, NOW(), NOW()),

-- THEME STYLES (028-037)
('style-028', 'Nature Landscapes', 'nature-landscapes', 'theme', '🏞️', '#2D5016', true, 'beautiful natural landscapes with outdoor scenes and panoramic views', ARRAY['landscape', 'nature', 'outdoor', 'scenic', 'panoramic'], 'nature_landscape', 'training', 0, 82, NOW(), NOW()),
('style-029', 'Floral Blooms', 'floral-blooms', 'theme', '🌹', '#FF1493', true, 'beautiful floral illustrations with garden blooms and botanical focus', ARRAY['floral', 'flowers', 'blooms', 'botanical', 'garden'], 'floral_blooms', 'trained', 0, 94, NOW(), NOW()),
('style-030', 'Animal Friends', 'animal-friends', 'theme', '🐾', '#8B4513', true, 'adorable animal illustrations with friendly creatures and personality', ARRAY['animals', 'cute', 'friendly', 'creatures', 'adorable'], 'animal_friends', 'training', 0, 85, NOW(), NOW()),
('style-031', 'Typography Art', 'typography-art', 'theme', '📝', '#2C3E50', true, 'bold typography as primary visual element with artistic letterforms', ARRAY['typography', 'text', 'lettering', 'fonts', 'artistic'], 'typography_art', 'trained', 0, 80, NOW(), NOW()),
('style-032', 'Pattern Play', 'pattern-play', 'theme', '🎨', '#9370DB', true, 'decorative repeating patterns with ornamental motifs and symmetry', ARRAY['pattern', 'decorative', 'ornamental', 'repeating', 'symmetrical'], 'pattern_play', 'training', 0, 77, NOW(), NOW()),
('style-033', 'Photo Realistic', 'photo-realistic', 'theme', '📷', '#696969', true, 'photographic realism with natural lighting and fine detail', ARRAY['realistic', 'photographic', 'detailed', 'naturalistic', 'lifelike'], 'photo_realistic', 'pending', 0, 64, NOW(), NOW()),
('style-034', 'Tactile Textures', 'tactile-textures', 'theme', '🏔️', '#8B6914', true, 'rich textured surfaces with tactile details and dimensional depth', ARRAY['texture', 'tactile', 'dimensional', 'rich', 'detailed'], 'tactile_texture', 'training', 0, 73, NOW(), NOW()),
('style-035', 'Seasonal Beauty', 'seasonal-beauty', 'theme', '🍂', '#DAA520', true, 'seasonal themed designs celebrating times of year and holidays', ARRAY['seasonal', 'holiday', 'celebration', 'festive', 'timely'], 'seasonal_beauty', 'training', 0, 81, NOW(), NOW()),
('style-036', 'Cultural Mosaic', 'cultural-mosaic', 'theme', '🌍', '#FF6B6B', true, 'internationally inspired diverse cultural motifs and patterns', ARRAY['cultural', 'international', 'diverse', 'mosaic', 'ethnic'], 'cultural_mosaic', 'pending', 0, 66, NOW(), NOW()),
('style-037', 'Kawaii Cuteness', 'kawaii-cuteness', 'theme', '😊', '#FF69B4', true, 'ultra-cute kawaii style with adorable characters and expressions', ARRAY['kawaii', 'cute', 'adorable', 'playful', 'endearing'], 'kawaii_cute', 'trained', 0, 89, NOW(), NOW()),

-- SPECIAL EFFECT STYLES (038-045)
('style-038', 'Gradient Flow', 'gradient-flow', 'effect', '🌈', '#FF6B9D', true, 'smooth gradient transitions with flowing colors and seamless blends', ARRAY['gradient', 'flow', 'blend', 'smooth', 'colorful'], 'gradient_flow', 'training', 0, 77, NOW(), NOW()),
('style-039', 'Foil Shimmer', 'foil-shimmer', 'effect', '✨', '#FFD700', true, 'simulated foil effects with metallic shimmer and reflective quality', ARRAY['foil', 'shimmer', 'metallic', 'reflective', 'shiny'], 'foil_shimmer', 'pending', 0, 69, NOW(), NOW()),
('style-040', 'Embossed Depth', 'embossed-depth', 'effect', '↗️', '#C0C0C0', true, 'embossed appearance with dimensional depth and tactile quality', ARRAY['embossed', 'dimensional', 'depth', 'textured', 'relief'], 'embossed_depth', 'pending', 0, 62, NOW(), NOW()),
('style-041', 'Paper Cutout', 'paper-cutout', 'effect', '📑', '#E8C547', true, 'layered paper cutout aesthetic with shadows and dimensional layers', ARRAY['paper cutout', 'layered', 'shadow', 'dimensional', 'craft'], 'paper_cutout', 'training', 0, 75, NOW(), NOW()),
('style-042', 'Letterpress Classic', 'letterpress-classic', 'effect', '🔤', '#8B0000', true, 'classic letterpress with pressed-in typography and ink impression', ARRAY['letterpress', 'typography', 'vintage', 'pressed', 'classic'], 'letterpress_classic', 'trained', 0, 84, NOW(), NOW()),
('style-043', 'Glitter Magic', 'glitter-magic', 'effect', '✨', '#FF1493', true, 'sparkly glitter effects with magical shimmer and celebratory feel', ARRAY['glitter', 'sparkle', 'magic', 'festive', 'shimmery'], 'glitter_magic', 'pending', 0, 67, NOW(), NOW()),
('style-044', 'Ombre Fade', 'ombre-fade', 'effect', '🌅', '#FF7F50', true, 'gradual ombre color fade with soft transitions and gradient appeal', ARRAY['ombre', 'fade', 'gradient', 'transition', 'soft'], 'ombre_fade', 'training', 0, 76, NOW(), NOW()),
('style-045', 'Neon Glow', 'neon-glow', 'effect', '⚡', '#39FF14', true, 'bright neon glow with electric color effects and modern edge', ARRAY['neon', 'glow', 'electric', 'bright', 'modern'], 'neon_glow', 'training', 0, 78, NOW(), NOW()),

-- AGE/DEMOGRAPHIC STYLES (046-050)
('style-046', 'Kids & Playful', 'kids-playful', 'demographic', '🎈', '#FF6B9D', true, 'bright playful designs for children and families with fun appeal', ARRAY['kids', 'playful', 'fun', 'bright', 'family'], 'kids_playful', 'trained', 0, 90, NOW(), NOW()),
('style-047', 'Teen Trends', 'teen-trends', 'demographic', '🎮', '#FF00FF', true, 'trendy contemporary design for young adults with current appeal', ARRAY['teen', 'trendy', 'contemporary', 'youthful', 'cool'], 'teen_trends', 'training', 0, 74, NOW(), NOW()),
('style-048', 'Professional Polish', 'professional-polish', 'demographic', '💼', '#1C1C1C', true, 'business-appropriate professional design with corporate polish', ARRAY['professional', 'business', 'corporate', 'polished', 'formal'], 'professional_polish', 'trained', 0, 87, NOW(), NOW()),
('style-049', 'Classic Timeless', 'classic-timeless', 'demographic', '⌚', '#8B7355', true, 'timeless classic design with enduring appeal and versatility', ARRAY['classic', 'timeless', 'traditional', 'timeless', 'elegant'], 'classic_timeless', 'trained', 0, 92, NOW(), NOW()),
('style-050', 'Luxury Premium', 'luxury-premium', 'demographic', '💎', '#C9A961', true, 'ultra-premium luxury design with highest sophistication and materials', ARRAY['luxury', 'premium', 'sophisticated', 'exclusive', 'elite'], 'luxury_premium', 'trained', 0, 96, NOW(), NOW());

-- Create function to get style recommendations by occasion
CREATE OR REPLACE FUNCTION get_style_recommendations(occasion_name TEXT)
RETURNS TABLE (
  style_id UUID,
  style_name TEXT,
  style_slug TEXT,
  emoji TEXT,
  color TEXT,
  match_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name, s.slug, s.emoji, s.color, 
    CASE 
      WHEN occasion_name ILIKE '%Mother%' THEN CASE WHEN s.slug IN ('watercolor-dreams', 'botanical-garden', 'nostalgic-vintage', 'gentle-pastels', 'floral-blooms') THEN 95 ELSE 0 END
      WHEN occasion_name ILIKE '%Father%' THEN CASE WHEN s.slug IN ('clean-line-art', 'pure-minimalism', 'neutral-natural', 'typography-art', 'professional-polish') THEN 95 ELSE 0 END
      WHEN occasion_name ILIKE '%Birthday%' THEN CASE WHEN s.slug IN ('modern-flat-design', 'bright-vibrant', 'kawaii-cuteness', 'kids-playful', 'whimsical-wonder') THEN 95 ELSE 0 END
      WHEN occasion_name ILIKE '%Valentine%' THEN CASE WHEN s.slug IN ('watercolor-dreams', 'elegant-luxury', 'floral-blooms', 'gradient-flow', 'luxury-premium') THEN 95 ELSE 0 END
      WHEN occasion_name ILIKE '%Anniversary%' THEN CASE WHEN s.slug IN ('detailed-pen-ink', 'elegant-luxury', 'monochrome-elegance', 'letterpress-classic', 'classic-timeless') THEN 95 ELSE 0 END
      WHEN occasion_name ILIKE '%Thank%' THEN CASE WHEN s.slug IN ('hand-drawn-sketch', 'botanical-garden', 'paper-collage', 'gentle-pastels', 'pattern-play') THEN 95 ELSE 0 END
      WHEN occasion_name ILIKE '%Wedding%' THEN CASE WHEN s.slug IN ('clean-line-art', 'detailed-pen-ink', 'elegant-luxury', 'monochrome-elegance', 'luxury-premium') THEN 95 ELSE 0 END
      WHEN occasion_name ILIKE '%Get Well%' THEN CASE WHEN s.slug IN ('watercolor-dreams', 'gentle-pastels', 'floral-blooms', 'animal-friends', 'tactile-textures') THEN 95 ELSE 0 END
      WHEN occasion_name ILIKE '%Sympathy%' THEN CASE WHEN s.slug IN ('clean-line-art', 'sumi-e-ink-wash', 'pure-minimalism', 'monochrome-elegance', 'neutral-natural') THEN 95 ELSE 0 END
      WHEN occasion_name ILIKE '%Graduation%' THEN CASE WHEN s.slug IN ('modern-flat-design', 'bold-graphic', 'bright-vibrant', 'typography-art', 'professional-polish') THEN 95 ELSE 0 END
      ELSE 50
    END as match_score
  FROM styles s
  WHERE s.is_active = true AND s.training_status = 'trained'
  ORDER BY match_score DESC, s.popularity_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_styles_category ON styles(category);
CREATE INDEX IF NOT EXISTS idx_styles_training_status ON styles(training_status);
CREATE INDEX IF NOT EXISTS idx_styles_popularity ON styles(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_styles_is_active ON styles(is_active);

-- Insert default style recommendations
INSERT INTO style_recommendations (id, occasion, recommended_styles, created_at) VALUES
('rec-001', 'Mother''s Day', ARRAY['style-001', 'style-005', 'style-017', 'style-024', 'style-029'], NOW()),
('rec-002', 'Father''s Day', ARRAY['style-002', 'style-016', 'style-026', 'style-031', 'style-048'], NOW()),
('rec-003', 'Birthday', ARRAY['style-003', 'style-025', 'style-037', 'style-046', 'style-021'], NOW()),
('rec-004', 'Valentine''s Day', ARRAY['style-001', 'style-020', 'style-029', 'style-038', 'style-050'], NOW()),
('rec-005', 'Anniversary', ARRAY['style-013', 'style-020', 'style-023', 'style-042', 'style-049'], NOW()),
('rec-006', 'Thank You', ARRAY['style-004', 'style-005', 'style-008', 'style-024', 'style-032'], NOW()),
('rec-007', 'Wedding', ARRAY['style-002', 'style-013', 'style-020', 'style-023', 'style-050'], NOW()),
('rec-008', 'Get Well', ARRAY['style-001', 'style-024', 'style-029', 'style-030', 'style-034'], NOW()),
('rec-009', 'Sympathy', ARRAY['style-002', 'style-010', 'style-016', 'style-023', 'style-026'], NOW()),
('rec-010', 'Graduation', ARRAY['style-003', 'style-022', 'style-025', 'style-031', 'style-048'], NOW());

-- Summary stats
SELECT 
  'CARDHUGS STYLE LIBRARY' as system,
  COUNT(*) as total_styles,
  COUNT(CASE WHEN training_status = 'trained' THEN 1 END) as trained,
  COUNT(CASE WHEN training_status = 'training' THEN 1 END) as training,
  COUNT(CASE WHEN training_status = 'pending' THEN 1 END) as pending
FROM styles;
