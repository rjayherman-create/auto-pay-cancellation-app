const { sequelize, User, Batch, Card, Occasion, TrainingJob, Settings } = require('../models');

const occasions = [
  { name: 'Birthday', category: 'Life Events', emoji: '🎂', color: '#f59e0b', slug: 'birthday' },
  { name: 'Anniversary', category: 'Love & Romance', emoji: '💕', color: '#ec4899', slug: 'anniversary' },
  { name: 'Wedding', category: 'Love & Romance', emoji: '💒', color: '#f472b6', slug: 'wedding' },
  { name: 'Graduation', category: 'Achievements', emoji: '🎓', color: '#8b5cf6', slug: 'graduation' },
  { name: 'New Baby', category: 'Life Events', emoji: '👶', color: '#60a5fa', slug: 'new-baby' },
  { name: 'Thank You', category: 'Gratitude', emoji: '🙏', color: '#10b981', slug: 'thank-you' },
  { name: 'Get Well Soon', category: 'Support', emoji: '🏥', color: '#06b6d4', slug: 'get-well-soon' },
  { name: 'Sympathy', category: 'Support', emoji: '🕊️', color: '#64748b', slug: 'sympathy' },
  { name: 'Congratulations', category: 'Achievements', emoji: '🎉', color: '#f59e0b', slug: 'congratulations' },
  { name: 'Christmas', category: 'Holidays', emoji: '🎄', color: '#ef4444', slug: 'christmas', seasonal_start: '12-01', seasonal_end: '12-31' },
  { name: 'Easter', category: 'Holidays', emoji: '🐰', color: '#a855f7', slug: 'easter', seasonal_start: '03-15', seasonal_end: '04-30' },
  { name: 'Halloween', category: 'Holidays', emoji: '🎃', color: '#f97316', slug: 'halloween', seasonal_start: '10-01', seasonal_end: '10-31' },
  { name: 'Thanksgiving', category: 'Holidays', emoji: '🦃', color: '#d97706', slug: 'thanksgiving', seasonal_start: '11-01', seasonal_end: '11-30' },
  { name: "Valentine's Day", category: 'Love & Romance', emoji: '💝', color: '#ec4899', slug: 'valentines-day', seasonal_start: '02-01', seasonal_end: '02-14' },
  { name: "Mother's Day", category: 'Family', emoji: '🌷', color: '#f472b6', slug: 'mothers-day', seasonal_start: '05-01', seasonal_end: '05-15' },
  { name: "Father's Day", category: 'Family', emoji: '👔', color: '#3b82f6', slug: 'fathers-day', seasonal_start: '06-01', seasonal_end: '06-21' },
  { name: 'Retirement', category: 'Life Events', emoji: '🎯', color: '#8b5cf6', slug: 'retirement' },
  { name: 'Housewarming', category: 'Life Events', emoji: '🏡', color: '#10b981', slug: 'housewarming' },
  { name: 'Good Luck', category: 'Support', emoji: '🍀', color: '#22c55e', slug: 'good-luck' },
  { name: 'Thinking of You', category: 'Support', emoji: '💭', color: '#a78bfa', slug: 'thinking-of-you' },
];

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    await User.destroy({ where: {}, truncate: true, cascade: true });
    await Occasion.destroy({ where: {}, truncate: true });
    await Settings.destroy({ where: {}, truncate: true });
    await TrainingJob.destroy({ where: {}, truncate: true, cascade: true });
    await Card.destroy({ where: {}, truncate: true });
    await Batch.destroy({ where: {}, truncate: true, cascade: true });
    console.log('🧹 Cleared existing data');
    const adminUser = await User.create({
      email: 'admin@cardhugs.com',
      password: 'demo123',
      name: 'Admin User',
      role: 'admin',
      is_active: true,
    });
    const designerUser = await User.create({
      email: 'designer@cardhugs.com',
      password: 'demo123',
      name: 'Designer User',
      role: 'designer',
      is_active: true,
    });
    console.log('✅ Created admin user: admin@cardhugs.com / demo123');
    console.log('✅ Created designer user: designer@cardhugs.com / demo123');
    for (const occ of occasions) {
      await Occasion.create({
        ...occ,
        description: `Beautiful ${occ.name} cards`,
        is_active: true,
        popularity_score: Math.floor(Math.random() * 100),
        card_count: 0,
      });
    }
    console.log(`✅ Created ${occasions.length} occasions`);
    const defaultSettings = [
      { key: 'app_name', value: 'CardHugs Admin Studio', category: 'general', description: 'Application name' },
      { key: 'cards_per_batch', value: 50, category: 'generation', description: 'Default cards per batch' },
      { key: 'default_style', value: 'watercolor', category: 'generation', description: 'Default card style' },
      { key: 'enable_ai_generation', value: true, category: 'features', description: 'Enable AI card generation' },
      { key: 'max_batch_size', value: 100, category: 'generation', description: 'Maximum cards per batch' },
      { key: 'default_guidance_scale', value: 3.5, category: 'generation', description: 'Default AI guidance scale' },
      { key: 'default_steps', value: 28, category: 'generation', description: 'Default inference steps' },
    ];
    for (const setting of defaultSettings) {
      await Settings.create(setting);
    }
    console.log('✅ Created default settings');
    const batch1 = await Batch.create({
      name: 'Birthday Collection - Spring 2026',
      occasion: 'Birthday',
      style: 'watercolor',
      total_cards: 50,
      generated_count: 48,
      approved_count: 42,
      published_count: 35,
      status: 'completed',
      created_by: adminUser.id,
    });
    const batch2 = await Batch.create({
      name: "Valentine's Day Premium",
      occasion: "Valentine's Day",
      style: 'romantic',
      total_cards: 30,
      generated_count: 30,
      approved_count: 28,
      published_count: 20,
      status: 'review',
      created_by: designerUser.id,
    });
    const batch3 = await Batch.create({
      name: 'Thank You Cards - Corporate',
      occasion: 'Thank You',
      style: 'minimalist',
      total_cards: 25,
      generated_count: 15,
      approved_count: 0,
      published_count: 0,
      status: 'generating',
      created_by: adminUser.id,
    });
    console.log('✅ Created 3 sample batches');
    const sampleCards = [
      {
        batch_id: batch1.id,
        image_url: 'https://placehold.co/800x1000/fbbf24/ffffff?text=Birthday+Card+1',
        thumbnail_url: 'https://placehold.co/400x500/fbbf24/ffffff?text=Birthday+Card+1',
        prompt: 'Watercolor birthday card with colorful balloons and confetti',
        occasion: 'Birthday',
        style: 'watercolor',
        status: 'published',
        quality_score: 95,
        tags: ['balloons', 'colorful', 'festive'],
        metadata: { width: 800, height: 1000, seed: 12345 },
      },
      {
        batch_id: batch1.id,
        image_url: 'https://placehold.co/800x1000/ec4899/ffffff?text=Birthday+Card+2',
        thumbnail_url: 'https://placehold.co/400x500/ec4899/ffffff?text=Birthday+Card+2',
        prompt: 'Watercolor birthday card with birthday cake and candles',
        occasion: 'Birthday',
        style: 'watercolor',
        status: 'approved',
        quality_score: 92,
        tags: ['cake', 'candles', 'celebration'],
        metadata: { width: 800, height: 1000, seed: 12346 },
        reviewed_by: adminUser.id,
        reviewed_at: new Date(),
      },
      {
        batch_id: batch2.id,
        image_url: 'https://placehold.co/800x1000/f472b6/ffffff?text=Valentine+Card+1',
        thumbnail_url: 'https://placehold.co/400x500/f472b6/ffffff?text=Valentine+Card+1',
        prompt: 'Romantic Valentine card with hearts and roses',
        occasion: "Valentine's Day",
        style: 'romantic',
        status: 'qc_passed',
        quality_score: 88,
        tags: ['hearts', 'roses', 'love'],
        metadata: { width: 800, height: 1000, seed: 12347 },
      },
      {
        batch_id: batch3.id,
        image_url: 'https://placehold.co/800x1000/10b981/ffffff?text=Thank+You+Card',
        thumbnail_url: 'https://placehold.co/400x500/10b981/ffffff?text=Thank+You+Card',
        prompt: 'Minimalist thank you card with elegant typography',
        occasion: 'Thank You',
        style: 'minimalist',
        status: 'draft',
        quality_score: null,
        tags: ['minimalist', 'elegant', 'professional'],
        metadata: { width: 800, height: 1000, seed: 12348 },
      },
    ];
    for (const cardData of sampleCards) {
      await Card.create(cardData);
    }
    console.log('✅ Created 4 sample cards');
    const trainingJob1 = await TrainingJob.create({
      name: 'Watercolor Style v2',
      style_pack_name: 'Watercolor Dreams',
      images_count: 48,
      epochs: 100,
      learning_rate: 0.0001,
      status: 'training',
      progress: 65,
      current_epoch: 65,
      trigger_word: 'WHMSCLR',
      estimated_time_remaining: '2h 15m',
      started_at: new Date(Date.now() - 3600000),
      created_by: adminUser.id,
    });
    const trainingJob2 = await TrainingJob.create({
      name: 'Vintage Floral',
      style_pack_name: 'Classic Blooms',
      images_count: 36,
      epochs: 80,
      learning_rate: 0.0001,
      status: 'completed',
      progress: 100,
      current_epoch: 80,
      trigger_word: 'VNTFLR',
      lora_url: 'https://fal.ai/models/lora-12345.safetensors',
      started_at: new Date(Date.now() - 14400000),
      completed_at: new Date(Date.now() - 3600000),
      created_by: designerUser.id,
    });
    const trainingJob3 = await TrainingJob.create({
      name: 'Modern Minimalist',
      style_pack_name: 'Clean Lines',
      images_count: 52,
      epochs: 120,
      learning_rate: 0.0001,
      status: 'queued',
      progress: 0,
      current_epoch: 0,
      trigger_word: 'MDNMIN',
      created_by: adminUser.id,
    });
    console.log('✅ Created 3 sample training jobs');
    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Summary:');
    console.log('  - Users: 2 (admin, designer)');
    console.log('  - Occasions: ' + occasions.length);
    console.log('  - Batches: 3');
    console.log('  - Cards: 4');
    console.log('  - Training Jobs: 3');
    console.log('  - Settings: 7');
    console.log('\n🔐 Login credentials:');
    console.log('  Admin: admin@cardhugs.com / demo123');
    console.log('  Designer: designer@cardhugs.com / demo123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
