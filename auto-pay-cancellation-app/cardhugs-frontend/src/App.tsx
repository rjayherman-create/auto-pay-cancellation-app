import StoreInventory from './components/StoreInventory';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Core Components
import AdminDashboard from './components/AdminDashboard';
import CardLibrary from './components/CardLibrary';
import CardEditor from './components/CardEditor';
import CardReview from './components/CardReview';
import QCDashboard from './components/QCDashboard';
import StoreUploadSystem from './components/StoreUploadSystem';
import CardNamingDashboard from './components/CardNamingDashboard';
import DatabaseBrowser from './components/DatabaseBrowser';
import BatchManagement from './components/BatchManagement';

// Creation & Tools
import CardGeneratorComplete from './components/CardGeneratorComplete';
import IndividualCardCreator from './components/IndividualCardCreator';
import LoRATrainingWorkflow from './components/LoRATrainingWorkflow';
import TextGenerator from './components/TextGenerator';
import OccasionLibrary from './components/OccasionLibrary';
import MediaManager from './components/MediaManager';
import Settings from './components/Settings';
import StyleSelector from './components/StyleSelector';

// Auth & Layout
import Layout from './components/Layout';
import { authAPI } from './services/api';
import type { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('cardhugs_user');
    const storedToken = localStorage.getItem('cardhugs_token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('cardhugs_user');
        localStorage.removeItem('cardhugs_token');
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore errors on logout
    } finally {
      setUser(null);
      localStorage.removeItem('cardhugs_user');
      localStorage.removeItem('cardhugs_token');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route element={<Layout user={user} onLogout={handleLogout} />}>
          {/* Main Dashboard & Library */}
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/library" element={<CardLibrary />} />

          {/* Card Management */}
          <Route path="/card-editor" element={<CardEditor />} />
          <Route path="/review" element={<CardReview />} />
          <Route path="/qc-approval" element={<QCDashboard />} />
          <Route path="/store-upload" element={<StoreUploadSystem />} />

          {/* Card Creation - Core Features */}
          <Route path="/lora-training" element={<LoRATrainingWorkflow />} />
          <Route path="/card-creator" element={<IndividualCardCreator />} />
          <Route path="/generate" element={<CardGeneratorComplete />} />

          {/* Content Tools */}
          <Route path="/text-generator" element={<TextGenerator />} />
          <Route path="/occasions" element={<OccasionLibrary />} />

          {/* Batch & Organization */}
          <Route path="/batches" element={<BatchManagement />} />
          <Route path="/card-naming" element={<CardNamingDashboard />} />

          {/* Admin Tools */}
          <Route path="/media" element={<MediaManager />} />
          <Route path="/database-browser" element={<DatabaseBrowser />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/store-inventory" element={<StoreInventory />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
