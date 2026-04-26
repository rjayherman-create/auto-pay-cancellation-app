import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Eye, MessageSquare, BarChart3, Clock } from 'lucide-react';

interface CardForQC {
  id: string;
  occasion: string;
  front_text: string;
  front_image_url?: string;
  inside_text: string;
  inside_image_url?: string;
  status: string;
  quality_check_status: string;
  created_at: string;
}

interface QCReview {
  cardId: string;
  qualityScore: number;
  rejectionReason: string;
  comments: string;
  approved: boolean;
}

const QCDashboard: React.FC = () => {
  const [cards, setCards] = useState<CardForQC[]>([]);
  const [currentCard, setCurrentCard] = useState<CardForQC | null>(null);
  const [loading, setLoading] = useState(true);
  const [qcData, setQcData] = useState<QCReview>({
    cardId: '',
    qualityScore: 0.85,
    rejectionReason: '',
    comments: '',
    approved: true
  });
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadCards();
    loadStats();
  }, [filter]);

  const loadCards = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cards?limit=100&status=draft`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCards(data.cards || []);
        if (data.cards && data.cards.length > 0) {
          setCurrentCard(data.cards[0]);
          setQcData({ ...qcData, cardId: data.cards[0].id });
        }
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats({
          pending: cards.filter(c => c.quality_check_status === 'pending').length,
          approved: cards.filter(c => c.quality_check_status === 'approved').length,
          rejected: cards.filter(c => c.quality_check_status === 'rejected').length,
          total: cards.length
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleApprove = async () => {
    if (!currentCard) return;

    try {
      const response = await fetch(`/api/cards/${currentCard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        },
        body: JSON.stringify({
          status: 'approved',
          quality_check_status: 'approved',
          quality_score: qcData.qualityScore
        })
      });

      if (response.ok) {
        alert('Card approved for store upload!');
        moveToNext();
      }
    } catch (error) {
      alert('Error approving card: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleReject = async () => {
    if (!currentCard || !qcData.rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const response = await fetch(`/api/cards/${currentCard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        },
        body: JSON.stringify({
          status: 'rejected',
          quality_check_status: 'rejected',
          rejection_reason: qcData.rejectionReason,
          quality_score: qcData.qualityScore
        })
      });

      if (response.ok) {
        alert('Card rejected. Reason saved.');
        moveToNext();
      }
    } catch (error) {
      alert('Error rejecting card: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const moveToNext = () => {
    const currentIndex = cards.indexOf(currentCard!);
    if (currentIndex < cards.length - 1) {
      const nextCard = cards[currentIndex + 1];
      setCurrentCard(nextCard);
      setQcData({
        cardId: nextCard.id,
        qualityScore: 0.85,
        rejectionReason: '',
        comments: '',
        approved: true
      });
    } else {
      loadCards();
    }
  };

  const moveToPrev = () => {
    const currentIndex = cards.indexOf(currentCard!);
    if (currentIndex > 0) {
      const prevCard = cards[currentIndex - 1];
      setCurrentCard(prevCard);
      setQcData({
        cardId: prevCard.id,
        qualityScore: 0.85,
        rejectionReason: '',
        comments: '',
        approved: true
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cards for QC...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          <h2 className="text-3xl font-bold">QC Quality Approval System</h2>
        </div>
        <p className="text-gray-600">Review and approve cards before uploading to the CardHugs store</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Cards</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending QC</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Main QC Panel */}
      <div className="grid grid-cols-4 gap-6">
        {/* Card List */}
        <div className="col-span-1 bg-white rounded-lg border border-gray-200 p-4 h-[600px] overflow-y-auto">
          <h3 className="font-semibold mb-4 text-sm text-gray-700">PENDING REVIEW ({cards.length})</h3>
          <div className="space-y-2">
            {cards.map((card, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setCurrentCard(card);
                  setQcData({ ...qcData, cardId: card.id });
                }}
                className={`p-3 rounded-lg border-2 cursor-pointer transition text-xs ${
                  currentCard?.id === card.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900 truncate">{card.occasion}</div>
                <div className="text-gray-600 line-clamp-2 mt-1">{card.front_text}</div>
                <div className="mt-2 text-xs text-gray-500">
                  {new Date(card.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QC Review Panel */}
        <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-6">
          {currentCard ? (
            <>
              {/* Card Preview */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Front</h4>
                  {currentCard.front_image_url && (
                    <img
                      src={currentCard.front_image_url}
                      alt="Front"
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                  )}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900 font-medium">{currentCard.front_text}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Inside</h4>
                  {currentCard.inside_image_url && (
                    <img
                      src={currentCard.inside_image_url}
                      alt="Inside"
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                  )}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900 font-medium">{currentCard.inside_text}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                {/* Quality Score */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Score (0.0 - 1.0)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={qcData.qualityScore}
                      onChange={(e) =>
                        setQcData({ ...qcData, qualityScore: parseFloat(e.target.value) })
                      }
                      className="flex-1"
                    />
                    <div className="text-2xl font-bold text-indigo-600 min-w-[60px]">
                      {(qcData.qualityScore * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Rejection Reason (if rejecting) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (if applicable)
                  </label>
                  <textarea
                    value={qcData.rejectionReason}
                    onChange={(e) => setQcData({ ...qcData, rejectionReason: e.target.value })}
                    placeholder="Explain why this card is being rejected..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Comments */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> QC Comments
                  </label>
                  <textarea
                    value={qcData.comments}
                    onChange={(e) => setQcData({ ...qcData, comments: e.target.value })}
                    placeholder="Add notes about this card..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Approve for Store
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Card
                  </button>
                </div>

                {/* Navigation */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={moveToPrev}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={moveToNext}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No cards pending review</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>ℹ️ QC Workflow:</strong> Cards start in draft status. Review them here to check quality,
          design, and text. Approved cards move to "ready for store upload" status. Rejected cards are returned
          to the editor with feedback. Only approved cards can be published to the CardHugs store.
        </p>
      </div>
    </div>
  );
};

export default QCDashboard;
