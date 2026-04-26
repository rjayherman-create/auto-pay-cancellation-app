import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import type { User } from '../types';

interface LayoutProps {
  user?: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;

  const menuGroups = {
    main: [
      { label: '📊 Dashboard', path: '/admin' },
      { label: '📚 Library', path: '/library' },
      { label: '🖊️ Editor', path: '/card-editor' },
    ],
    creation: [
      { label: '🎨 LoRA Training', path: '/lora-training' },
      { label: '✨ Create Card', path: '/card-creator' },
      { label: '📦 Batch Generate', path: '/generate' },
    ],
    workflow: [
      { label: '👀 Review', path: '/review' },
      { label: '✅ QC', path: '/qc-approval' },
      { label: '📦 Store', path: '/store-upload' },
    ],
    tools: [
      { label: '📋 Batches', path: '/batches' },
      { label: '#️⃣ Numbering', path: '/card-naming' },
      { label: '📝 Text Generator', path: '/text-generator' },
      { label: '🎯 Occasions', path: '/occasions' },
      { label: '🖼️ Media', path: '/media' },
      { label: '🗄️ Database', path: '/database-browser' },
      { label: '⚙️ Settings', path: '/settings' },
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link to="/admin" className="font-bold text-2xl hover:opacity-90 transition flex items-center gap-2">
            🎨 CardHugs
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
          {/* Main Items */}
            {menuGroups.main.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg transition ${
                  isActive(item.path)
                    ? 'bg-indigo-700 text-white'
                    : 'hover:bg-indigo-500'
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* LoRA Training - Direct Link */}
            <Link
              to="/lora-training"
              className={`px-3 py-2 rounded-lg transition font-semibold ${
                isActive('/lora-training')
                  ? 'bg-indigo-700 text-white'
                  : 'hover:bg-indigo-500'
              }`}
            >
              🎨 LoRA Training
            </Link>

            {/* Create - Dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 rounded-lg hover:bg-indigo-500 transition flex items-center gap-1 font-semibold">
                ✨ Create
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-white text-gray-900 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-50">
                <Link
                  to="/card-creator"
                  className={`block px-4 py-2 first:rounded-t-lg transition ${
                    isActive('/card-creator')
                      ? 'bg-indigo-100 text-indigo-700 font-semibold'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  ✨ Create Individual Card
                </Link>
                <Link
                  to="/generate"
                  className={`block px-4 py-2 last:rounded-b-lg transition ${
                    isActive('/generate')
                      ? 'bg-indigo-100 text-indigo-700 font-semibold'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  📦 Batch Generate
                </Link>
              </div>
            </div>

            {/* Workflow Dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 rounded-lg hover:bg-indigo-500 transition flex items-center gap-1">
                ⚡ Workflow
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-white text-gray-900 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-50">
                {menuGroups.workflow.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-4 py-2 first:rounded-t-lg last:rounded-b-lg transition ${
                      isActive(item.path)
                        ? 'bg-indigo-100 text-indigo-700 font-semibold'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Tools Dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 rounded-lg hover:bg-indigo-500 transition flex items-center gap-1">
                🛠️ Tools
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute right-0 mt-0 w-56 bg-white text-gray-900 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-50">
                {menuGroups.tools.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-4 py-2 first:rounded-t-lg last:rounded-b-lg transition ${
                      isActive(item.path)
                        ? 'bg-indigo-100 text-indigo-700 font-semibold'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-indigo-500 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm">{user?.name || 'Guest'}</span>
            <button
              onClick={onLogout}
              className="bg-white text-indigo-600 px-4 py-1 rounded-lg font-medium hover:bg-indigo-50 transition"
            >
              Logout
            </button>
          </div>
        </div>

            {mobileMenuOpen && (
          <div className="md:hidden bg-indigo-700 px-4 py-4 space-y-2">
            {[
              ...menuGroups.main,
              ...menuGroups.creation,
              ...menuGroups.workflow,
              ...menuGroups.tools
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg transition ${
                  isActive(item.path)
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-indigo-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-indigo-600 my-2" />
            <div className="px-4 py-2 text-sm">{user?.name || 'Guest'}</div>
            <button
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
