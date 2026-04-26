-- Add QC approval workflow table
CREATE TABLE IF NOT EXISTS card_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  quality_score DECIMAL(3,2),
  rejection_reason TEXT,
  comments TEXT,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for card_approvals
CREATE INDEX IF NOT EXISTS idx_card_approvals_card_id ON card_approvals(card_id);
CREATE INDEX IF NOT EXISTS idx_card_approvals_status ON card_approvals(status);
CREATE INDEX IF NOT EXISTS idx_card_approvals_reviewer_id ON card_approvals(reviewer_id);

-- Update cards table to support quality workflow
ALTER TABLE cards ADD COLUMN IF NOT EXISTS quality_check_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;

-- Create index for approved cards (ready to publish)
CREATE INDEX IF NOT EXISTS idx_cards_quality_status ON cards(quality_check_status);
