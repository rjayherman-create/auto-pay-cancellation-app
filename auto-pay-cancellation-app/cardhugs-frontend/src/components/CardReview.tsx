import React, { useEffect, useState } from 'react';
import { cardAPI } from '../services/api';
import { ThumbsUp, ThumbsDown, RotateCcw, RotateCw, CheckSquare } from 'lucide-react';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { Tooltip, HelpIcon } from './Tooltip';
import type { Card } from '../types';

interface CardReviewProps {
  batchId?: string;
  onReviewComplete?: (approved: number) => void;
}

interface CardWithSelection {
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
  _selected?: boolean;
}

const CardReview: React.FC<CardReviewProps> = ({ batchId, onReviewComplete }) => {
  const [cards, setCards] = useState<CardWithSelection[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [approvedCount, setApprovedCount] = useState(0);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);

  // Undo/redo for selection state
  const undoRedo = useUndoRedo<Set<string>>(new Set());

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (bulkMode) {
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undoRedo.undo();
        } else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
          e.preventDefault();
          undoRedo.redo();
        }
      } else {
        if (e.key === 'ArrowRight') moveToNext();
        if (e.key === 'ArrowLeft') moveToPrev();
        if (e.key === 'a') handleApprove();
        if (e.key === 'r') handleReject();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, bulkMode, undoRedo]);

  useEffect(() => {
    loadCards();
  }, [batchId]);

  const loadCards = async () => {
    try {
      setLoading(true);
      const params = batchId ? { batch_id: batchId, status: 'draft', limit: 50 } : { status: 'draft', limit: 50 };
      const result = await cardAPI.getAll(params);
      setCards((result.cards || []).map(card => ({ ...card, _selected: false })));
      setCurrentIndex(0);
      setApprovedCount(0);
      setBulkMode(false);
      undoRedo.reset(new Set());
    } catch (err) {
      console.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (currentIndex >= cards.length) return;
    
    const card = cards[currentIndex] as CardWithSelection;
    try {
      await cardAPI.update(card.id, { status: 'approved' });
      setApprovedCount(approvedCount + 1);
      moveToNext();
    } catch (err) {
      console.error('Failed to approve card');
    }
  };

  const handleReject = async () => {
    if (currentIndex >= cards.length) return;
    
    const card = cards[currentIndex];
    try {
      await cardAPI.update(card.id, { status: 'rejected' });
      moveToNext();
    } catch (err) {
      console.error('Failed to reject card');
    }
  };

  const moveToNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      if (onReviewComplete) onReviewComplete(approvedCount);
    }
  };

  const moveToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Bulk operations
  const toggleCardSelection = (cardId: string) => {
    const newSelection = new Set(undoRedo.state);
    if (newSelection.has(cardId)) {
      newSelection.delete(cardId);
    } else {
      newSelection.add(cardId);
    }
    undoRedo.setState(newSelection);
  };

  const toggleSelectAll = () => {
    if (undoRedo.state.size === cards.length) {
      undoRedo.setState(new Set());
    } else {
      undoRedo.setState(new Set(cards.map(c => c.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (undoRedo.state.size === 0) return;
    
    setBulkActionInProgress(true);
    try {
      await cardAPI.bulkUpdateStatus(Array.from(undoRedo.state), 'approved');
      // Remove approved cards from view
      const remainingCards = cards.filter((c: CardWithSelection) => !undoRedo.state.has(c.id));
      setCards(remainingCards.map(c => ({ ...c, _selected: false })));
      setApprovedCount(approvedCount + undoRedo.state.size);
      undoRedo.reset(new Set());
      setCurrentIndex(0);
    } catch (err) {
      console.error('Failed to bulk approve cards');
    } finally {
      setBulkActionInProgress(false);
    }
  };

  const handleBulkReject = async () => {
    if (undoRedo.state.size === 0) return;
    
    setBulkActionInProgress(true);
    try {
      await cardAPI.bulkUpdateStatus(Array.from(undoRedo.state), 'rejected');
      // Remove rejected cards from view
      const remainingCards = cards.filter((c: CardWithSelection) => !undoRedo.state.has(c.id));
      setCards(remainingCards.map(c => ({ ...c, _selected: false })));
      undoRedo.reset(new Set());
      setCurrentIndex(0);
    } catch (err) {
      console.error('Failed to bulk reject cards');
    } finally {
      setBulkActionInProgress(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-600">Loading cards...</div>;
  if (cards.length === 0) return <div className="p-6 text-gray-600">No cards to review</div>;

  const card = cards[currentIndex];
  const selectedCount = undoRedo.state.size;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-bold">Card Review</h2>
            <div className="text-sm text-gray-600 mt-2">
              {bulkMode ? (
                <span>{selectedCount} selected</span>
              ) : (
                <span>{currentIndex + 1} of {cards.length}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setBulkMode(!bulkMode);
              undoRedo.reset(new Set());
              setCurrentIndex(0);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              bulkMode
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {bulkMode ? '✓ Bulk Mode' : 'Bulk Mode'}
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Bulk Selection Mode */}
      {bulkMode && (
        <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-indigo-900">Batch Review</h3>
              <p className="text-sm text-indigo-700 mt-1">
                Select cards to approve or reject in bulk. Use Ctrl+Z to undo selections.
              </p>
            </div>
            <button
              onClick={toggleSelectAll}
              className="px-3 py-1 text-sm bg-white rounded border border-indigo-300 hover:bg-indigo-50"
            >
              {selectedCount === cards.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Bulk action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleBulkApprove}
              disabled={selectedCount === 0 || bulkActionInProgress}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium"
            >
              <ThumbsUp className="w-4 h-4" />
              Approve {selectedCount > 0 && `(${selectedCount})`}
            </button>
            <button
              onClick={handleBulkReject}
              disabled={selectedCount === 0 || bulkActionInProgress}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium"
            >
              <ThumbsDown className="w-4 h-4" />
              Reject {selectedCount > 0 && `(${selectedCount})`}
            </button>
            {undoRedo.canUndo && (
              <button
                onClick={undoRedo.undo}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            {undoRedo.canRedo && (
              <button
                onClick={undoRedo.redo}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                title="Redo (Ctrl+Y)"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cards Grid (Bulk Mode) */}
      {bulkMode && (
        <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((c: CardWithSelection) => (
            <div
              key={c.id}
              onClick={() => toggleCardSelection(c.id)}
              className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                undoRedo.state.has(c.id)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-indigo-300'
              }`}
            >
              {c.front_image_url && (
                <img src={c.front_image_url} alt="Card" className="w-full h-20 object-cover rounded mb-2" />
              )}
              <div className="flex items-start justify-between">
                <p className="text-xs text-gray-700 line-clamp-2 flex-1">{c.front_text}</p>
                {undoRedo.state.has(c.id) && (
                  <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0 ml-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single Card Review (Normal Mode) */}
      {!bulkMode && (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-2">
                  Front <HelpIcon text="Click to preview full size" />
                </p>
                {card.front_image_url && (
                  <img src={card.front_image_url} alt="Front" className="w-full rounded-lg mb-2" />
                )}
                <p className="text-sm text-gray-900">{card.front_text}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-2">
                  Inside <HelpIcon text="Message or design for inside of card" />
                </p>
                {card.inside_image_url && (
                  <img src={card.inside_image_url} alt="Inside" className="w-full rounded-lg mb-2" />
                )}
                <p className="text-sm text-gray-900">{card.inside_text}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-600 font-medium">Occasion</p>
                <p className="text-sm font-semibold">{card.occasion}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Status</p>
                <p className="text-sm font-semibold capitalize">{card.status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Created</p>
                <p className="text-sm font-semibold">{new Date(card.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Navigation & Action Buttons */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={moveToPrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              title="Previous (← Arrow)"
            >
              ← Previous
            </button>
            <span className="flex items-center text-gray-600 px-4 py-2">
              {currentIndex + 1} / {cards.length}
            </span>
            <button
              onClick={moveToNext}
              disabled={currentIndex >= cards.length - 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              title="Next (→ Arrow)"
            >
              Next →
            </button>
          </div>

          {/* Approve/Reject Buttons */}
          <div className="flex gap-4">
            <button
                onClick={handleReject}
                className="flex-1 px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium flex items-center justify-center gap-2"
              >
                <ThumbsDown className="w-5 h-5" />
                Reject
              </button>
            <button
                onClick={handleApprove}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
              >
                <ThumbsUp className="w-5 h-5" />
                Approve
              </button>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">
              <strong>Keyboard:</strong> ← → (navigate), <strong>A</strong> (approve), <strong>R</strong> (reject)
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default CardReview;
