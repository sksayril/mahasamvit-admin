import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Grid3X3,
  MessageSquare,
  Image,
  Bell,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Star,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: Grid3X3, label: 'Dashboard', adminOnly: false },
    { path: '/contacts', icon: MessageSquare, label: 'Contacts', adminOnly: true },
    { path: '/media', icon: Image, label: 'Media Gallery', adminOnly: true },
    { path: '/notice', icon: Bell, label: 'Notice Management', adminOnly: true },
    { path: '/users', icon: Users, label: 'Users', adminOnly: true },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', adminOnly: true },
    { path: '/profile', icon: Settings, label: 'Profile Settings', adminOnly: false },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white shadow-2xl">
      {/* Header with Logo */}
      <div className="p-6 border-b border-blue-700/50">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-xl backdrop-blur-sm">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Mahasamvit</h1>
            <p className="text-xs text-blue-200 font-medium">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-blue-700/30">
        <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full">
            <span className="text-white font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
            <p className="text-xs text-blue-200 truncate">{user?.email}</p>
            <div className="flex items-center mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                Admin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null;
          
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-white/15 text-white shadow-lg backdrop-blur-sm border border-white/20'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${
                isActive(item.path) ? 'scale-110' : 'group-hover:scale-105'
              }`} />
              <span className="font-medium">{item.label}</span>
              {isActive(item.path) && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer with Branding */}
      <div className="p-4 border-t border-blue-700/30">
        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-200 hover:bg-red-500/10 hover:text-red-100 rounded-xl transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 group-hover:scale-105 transition-transform duration-200" />
          <span className="font-medium">Logout</span>
        </button>

        {/* Developer Branding */}
        <div className="mt-4 p-3 bg-white/5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-center space-x-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-blue-200 font-medium">Developed by</span>
          </div>
          <div className="text-center mt-1">
            <span className="text-sm font-bold text-white">Skystar Solution</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;