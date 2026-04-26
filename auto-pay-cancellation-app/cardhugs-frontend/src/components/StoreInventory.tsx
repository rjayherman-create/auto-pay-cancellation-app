import React, { useEffect, useState } from 'react';
import { storeAPI, cardAPI } from '../services/api';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import type { StoreCard } from '../types';

const StoreInventory: React.FC = () => {
  const [inventory, setInventory] = useState<StoreCard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const result = await storeAPI.getStoreInventory({ limit: 100 });
      setInventory(result.cards || []);
    } catch (err) {
      console.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (cardId: string) => {
    try {
      await storeAPI.publishCard(cardId);
      setInventory(inventory.map(c => 
        c.id === cardId ? { ...c, is_published: true } : c
      ));
    } catch (err) {
      console.error('Publish failed');
    }
  };

  const handleUnpublish = async (cardId: string) => {
    try {
      await storeAPI.unpublishCard(cardId);
      setInventory(inventory.map(c => 
        c.id === cardId ? { ...c, is_published: false } : c
      ));
    } catch (err) {
      console.error('Unpublish failed');
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm('Delete this card?')) return;
    
    try {
      await cardAPI.delete(cardId);
      setInventory(inventory.filter(c => c.id !== cardId));
    } catch (err) {
      console.error('Delete failed');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Store Inventory</h2>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : inventory.length === 0 ? (
        <p className="text-gray-600">No cards in inventory</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Occasion</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Published</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventory.map((card) => (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{card.occasion}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {card.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {card.is_published ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {card.is_published ? (
                        <button
                          onClick={() => handleUnpublish(card.id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePublish(card.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(card.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StoreInventory;
