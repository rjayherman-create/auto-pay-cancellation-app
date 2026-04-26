import React, { useEffect, useState } from 'react';
import { Card } from '../types';
import { cardAPI } from '../services/api';
import { ChevronRight, CheckCircle, XCircle, MessageSquare, Eye } from 'lucide-react';

interface ApprovalCard extends Card {
  notes?: string;
}

const CardApprovalWorkflow: React.FC = () => {
  const [pendingCards, setPendingCards] = useState<ApprovalCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<ApprovalCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const statuses = ['draft', 'qc_passed'];

  useEffect(() => {
    fetchPendingCards();
  }, []);

  const fetchPendingCards = async () => {
    try {
      setLoading(true);
      // Fetch cards that need approval (draft or qc_passed status)
      const allCards = await cardAPI.getAll({ limit: 500 });
      const pending = (allCards.cards || []).filter((card: Card) =>
        statuses.includes(card.status)
      );
      setPendingCards(pending.sort((a: Card, b: Card) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));
      if (pending.length > 0 && !selectedCard) {
        setSelectedCard(pending[0]);
      }
    } catch (err) {
      console.error('Failed to load pending cards');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedCard) return;

    try {
      await cardAPI.update(selectedCard.id, {
        status: 'approved',
        quality_score: 85,
      });

      setPendingCards(pendingCards.filter(c => c.id !== selectedCard.id));
      
      if (pendingCards.length > 1) {
        const nextCard = pendingCards.find(c => c.id !== selectedCard.id);
        setSelectedCard(nextCard || null);
      } else {
        setSelectedCard(null);
      }

      setNotes('');
    } catch (err) {
      console.error('Failed to approve card');
    }
  };

  const handleReject = async () => {
    if (!selectedCard) return;

    try {
      await cardAPI.update(selectedCard.id, {
        status: 'rejected',
        rejection_reason: rejectionReason,
      });

      setPendingCards(pendingCards.filter(c => c.id !== selectedCard.id));
      
      if (pendingCards.length > 1) {
        const nextCard = pendingCards.find(c => c.id !== selectedCard.id);
        setSelectedCard(nextCard || null);
      } else {
        setSelectedCard(null);
      }

      setRejectionReason('');
      setShowRejectForm(false);
    } catch (err) {
      console.error('Failed to reject card');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading approval queue...</div>;
  }

  if (pendingCards.length === 0) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All Caught Up!</h2>
          <p className="text-gray-600">There are no cards waiting for approval.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold">Card Approval Queue</h2>
          <p className="text-gray-600 mt-1">Review and approve generated cards</p>
        </div>

        {/* Queue Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm font-medium">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">{pendingCards.length}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm font-medium">Current</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {pendingCards.findIndex(c => c.id === selectedCard?.id) + 1} of {pendingCards.length}
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-indigo-800 text-sm font-medium">Approval Rate</p>
            <p className="text-2xl font-bold text-indigo-900 mt-1">
              {pendingCards.length > 0 ? '0%' : 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Queue List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <p className="text-sm font-semibold text-gray-900">Approval Queue</p>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {pendingCards.map((card, index) => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={`w-full text-left p-3 hover:bg-gray-50 transition ${
                      selectedCard?.id === card.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {index + 1}. {card.occasion}
                        </p>
                        <p className="text-xs text-gray-600 truncate mt-1">
                          {card.front_text}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 mt-1 flex-shrink-0 ${
                        selectedCard?.id === card.id ? 'text-indigo-600' : 'text-gray-400'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card Preview & Approval */}
          <div className="lg:col-span-3 space-y-6">
            {selectedCard && (
              <>
                {/* Card Preview */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-2 gap-4 p-6">
                    {/* Front */}
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase mb-3">Front</p>
                      <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden group">
                        {selectedCard.front_image_url ? (
                          <img
                            src={selectedCard.front_image_url}
                            alt="Front"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Eye className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-3">
                        {selectedCard.front_text}
                      </p>
                    </div>

                    {/* Inside */}
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase mb-3">Inside</p>
                      <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden group">
                        {selectedCard.inside_image_url ? (
                          <img
                            src={selectedCard.inside_image_url}
                            alt="Inside"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Eye className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-3">
                        {selectedCard.inside_text}
                      </p>
                    </div>
                  </div>

                  {/* Card Metadata */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Occasion</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedCard.occasion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Style</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedCard.style || 'Default'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Status</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedCard.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Created</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {new Date(selectedCard.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    Review Notes
                  </p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes about this card..."
                    className="w-full h-20 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Approval Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve Card
                  </button>

                  {!showRejectForm ? (
                    <button
                      onClick={() => setShowRejectForm(true)}
                      className="w-full px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium flex items-center justify-center gap-2 transition"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Card
                    </button>
                  ) : (
                    <div className="space-y-3 bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-red-900">Rejection Reason</p>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Why are you rejecting this card?..."
                        className="w-full h-20 px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleReject}
                          disabled={!rejectionReason.trim()}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium transition"
                        >
                          Confirm Rejection
                        </button>
                        <button
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectionReason('');
                          }}
                          className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-100 font-medium transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Skip Button */}
                  <button
                    onClick={() => {
                      const nextCard = pendingCards.find(c => c.id !== selectedCard.id);
                      if (nextCard) setSelectedCard(nextCard);
                    }}
                    className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                  >
                    Skip to Next
                  </button>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                  <p className="font-medium mb-2">💡 Keyboard Shortcuts:</p>
                  <div className="space-y-1 text-xs">
                    <p><kbd className="bg-white px-2 py-1 rounded border">A</kbd> to approve</p>
                    <p><kbd className="bg-white px-2 py-1 rounded border">R</kbd> to reject</p>
                    <p><kbd className="bg-white px-2 py-1 rounded border">N</kbd> for next</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardApprovalWorkflow;
