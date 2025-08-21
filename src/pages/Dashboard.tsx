import React, { useEffect, useState } from 'react';
import {
  Users,
  MessageCircle,
  Images,
  TrendingUp,
  Mail,
  Eye,
  Download,
  AlertCircle,
} from 'lucide-react';
import { apiService } from '../services/api';
import { DashboardStats } from '../types';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await apiService.getDashboardStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users?.total || 0,
      subtitle: `${stats?.users?.recent || 0} new this month`,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'Contacts',
      value: stats?.contacts?.total || 0,
      subtitle: `${stats?.contacts?.pendingContacts || 0} pending`,
      icon: MessageCircle,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    {
      title: 'Media Files',
      value: stats?.media?.total || 0,
      subtitle: `${stats?.media?.publicCount || 0} public`,
      icon: Images,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
    {
      title: 'Total Views',
      value: (stats?.media?.byType?.image?.totalViews || 0) + (stats?.media?.byType?.video?.totalViews || 0),
      subtitle: `${(stats?.media?.byType?.image?.totalDownloads || 0) + (stats?.media?.byType?.video?.totalDownloads || 0)} downloads`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your admin panel.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${card.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${card.textColor}`} />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
                </div>
              </div>
              <div className={`absolute inset-x-0 bottom-0 h-1 ${card.color}`}></div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Status Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Status</h3>
          <div className="space-y-3">
            {stats?.contacts?.byStatus && Object.entries(stats.contacts.byStatus).map(([status, count]) => {
              const statusColors = {
                pending: 'bg-yellow-100 text-yellow-800',
                read: 'bg-blue-100 text-blue-800',
                replied: 'bg-emerald-100 text-emerald-800',
                archived: 'bg-gray-100 text-gray-800',
              };
              
              return (
                <div key={status} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[status as keyof typeof statusColors]}`}>
                      {status}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Media Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Media Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Images className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Images</span>
              </div>
              <span className="text-sm font-bold text-blue-900">
                {stats?.media?.byType?.image?.count || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Videos</span>
              </div>
              <span className="text-sm font-bold text-purple-900">
                {stats?.media?.byType?.video?.count || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Download className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-900">Total Downloads</span>
              </div>
              <span className="text-sm font-bold text-emerald-900">
                {((stats?.media?.byType?.image?.totalDownloads || 0) + (stats?.media?.byType?.video?.totalDownloads || 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <Mail className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">View Contacts</span>
          </button>
          
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <Images className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-gray-900">Upload Media</span>
          </button>
          
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <Users className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">Manage Users</span>
          </button>
        </div>
      </div>

      {stats?.contacts?.pendingContacts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              You have <strong>{stats.contacts.pendingContacts}</strong> pending contacts that need your attention.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;