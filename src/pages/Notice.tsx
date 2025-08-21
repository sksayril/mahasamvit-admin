import React, { useEffect, useState } from 'react';
import {
  Bell,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { apiService, getNoticeImageUrl, getNoticeImageUrlWithFallback, showToast } from '../services/api';
import { Notice, NoticeStats } from '../types';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { format } from 'date-fns';

const NoticePage: React.FC = () => {
  const [currentNotice, setCurrentNotice] = useState<Notice | null>(null);
  const [stats, setStats] = useState<NoticeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '',
    isActive: true,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    expiresAt: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageLoadAttempts, setImageLoadAttempts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchNoticeData();
  }, []);

  const fetchNoticeData = async () => {
    try {
      setIsLoading(true);
      const [noticeResponse, statsResponse] = await Promise.all([
        apiService.getCurrentNotice(),
        apiService.getNoticeStats(),
      ]);

      if (noticeResponse.success) {
        setCurrentNotice(noticeResponse.data.notice);
        if (noticeResponse.data.notice) {
          setFormData({
            title: noticeResponse.data.notice.title,
            content: noticeResponse.data.notice.content,
            image: noticeResponse.data.notice.image || '',
            isActive: noticeResponse.data.notice.isActive,
            priority: noticeResponse.data.notice.priority,
            expiresAt: noticeResponse.data.notice.expiresAt 
              ? format(new Date(noticeResponse.data.notice.expiresAt), "yyyy-MM-dd'T'HH:mm")
              : '',
          });
          if (noticeResponse.data.notice.image) {
            setImagePreview(getNoticeImageUrl(noticeResponse.data.notice.image));
          }
        }
      }

      if (statsResponse.success) {
        setStats(statsResponse.data.stats);
      }
          } catch (error) {
        console.error('Failed to fetch notice data:', error);
        showToast('error', 'Failed to load notice data');
      } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        showToast('error', 'Please select a valid image file (JPG, PNG, GIF, WebP, SVG)');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'Image file size must be less than 5MB');
        return;
      }

      setImageFile(file);
      setImageLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageLoading(false);
    setFormData({ ...formData, image: '' });
  };

  const handleImageError = (imagePath: string, imgElement: HTMLImageElement) => {
    const attempts = imageLoadAttempts[imagePath] || 0;
    setImageLoadAttempts(prev => ({ ...prev, [imagePath]: attempts + 1 }));

    if (attempts === 0) {
      // First attempt failed, try with fallback URL
      const fallbackUrl = getNoticeImageUrlWithFallback(imagePath);
      if (fallbackUrl !== imgElement.src) {
        imgElement.src = fallbackUrl;
        return;
      }
    }
    
    // All attempts failed, hide the image
    imgElement.style.display = 'none';
    console.error('Failed to load notice image after all attempts:', imagePath);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      
      if (imageFile) {
        // Use image upload endpoint
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('content', formData.content);
        formDataToSend.append('image', imageFile);
        formDataToSend.append('isActive', formData.isActive.toString());
        formDataToSend.append('priority', formData.priority);
        if (formData.expiresAt) {
          formDataToSend.append('expiresAt', new Date(formData.expiresAt).toISOString());
        }

        const response = currentNotice 
          ? await apiService.updateNoticeWithImage(formDataToSend)
          : await apiService.createOrUpdateNoticeWithImage(formDataToSend);

        if (response.success) {
          showToast('success', currentNotice ? 'Notice updated successfully' : 'Notice created successfully');
          setShowForm(false);
          setImageFile(null);
          setImagePreview(null);
          fetchNoticeData();
        }
      } else {
        // Use text-only endpoint
        const submitData = {
          ...formData,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
        };

        const response = currentNotice 
          ? await apiService.updateNotice(submitData)
          : await apiService.createOrUpdateNotice(submitData);

        if (response.success) {
          showToast('success', currentNotice ? 'Notice updated successfully' : 'Notice created successfully');
          setShowForm(false);
          fetchNoticeData();
        }
      }
    } catch (error) {
      console.error('Failed to save notice:', error);
      showToast('error', 'Failed to save notice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentNotice) return;
    
    if (window.confirm('Are you sure you want to delete this notice? This action cannot be undone.')) {
      try {
        const response = await apiService.deleteNotice();
        if (response.success) {
          showToast('success', 'Notice deleted successfully');
          setCurrentNotice(null);
          setFormData({
            title: '',
            content: '',
            image: '',
            isActive: true,
            priority: 'medium',
            expiresAt: '',
          });
          setImageFile(null);
          setImagePreview(null);
          fetchNoticeData();
        }
      } catch (error) {
        console.error('Failed to delete notice:', error);
        showToast('error', 'Failed to delete notice');
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notice Management</h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage system-wide notices and announcements
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Edit className="h-5 w-5 mr-2" />
          <span>{currentNotice ? 'Edit Notice' : 'Create Notice'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notices</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-3xl font-bold text-orange-600">
                  {(stats.priorityBreakdown.high || 0) + (stats.priorityBreakdown.urgent || 0)}
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Notice Display */}
      {currentNotice ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{currentNotice.title}</h2>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${getPriorityColor(currentNotice.priority)}`}>
                    {getPriorityIcon(currentNotice.priority)}
                    <span className="ml-2 capitalize">{currentNotice.priority}</span>
                  </span>
                  {currentNotice.isActive ? (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 border-2 border-green-200">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-800 border-2 border-gray-200">
                      <EyeOff className="h-4 w-4 mr-2" />
                      Inactive
                    </span>
                  )}
                </div>
                
                {currentNotice.image && (
                  <div className="mb-6">
                    <img 
                      src={getNoticeImageUrl(currentNotice.image)} 
                      alt={currentNotice.title}
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto max-h-80 rounded-xl object-cover shadow-lg"
                      onError={(e) => {
                        if (currentNotice.image) {
                          handleImageError(currentNotice.image, e.target as HTMLImageElement);
                        }
                      }}
                      onLoad={() => {
                        console.log('Notice image loaded successfully:', currentNotice.image);
                      }}
                    />
                  </div>
                )}
                
                <div className="prose max-w-none text-gray-700 mb-6">
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">{currentNotice.content}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Created by {currentNotice.createdBy.name}</span>
                  </div>
                  {currentNotice.updatedBy && (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Updated by {currentNotice.updatedBy.name}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Created {format(new Date(currentNotice.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  {currentNotice.expiresAt && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Expires {format(new Date(currentNotice.expiresAt), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-3 ml-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6">
            <Bell className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No Notice Set</h3>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Create a notice to display important information to users across the system.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-base font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Edit className="h-5 w-5 mr-2" />
            <span>Create Notice</span>
          </button>
        </div>
      )}

      {/* Notice Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-8 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">
                {currentNotice ? 'Edit Notice' : 'Create Notice'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter notice title"
                  required
                  minLength={3}
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  rows={8}
                  placeholder="Enter notice content"
                  required
                  minLength={10}
                  maxLength={5000}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Image (Optional)
                </label>
                <div className="space-y-4">
                  {imagePreview && (
                    <div className="relative">
                      {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-xl">
                          <LoadingSpinner size="sm" />
                        </div>
                      )}
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-auto max-h-64 rounded-xl object-cover shadow-lg"
                        onLoad={() => setImageLoading(false)}
                        onError={(e) => {
                          setImageLoading(false);
                          (e.target as HTMLImageElement).style.display = 'none';
                          showToast('error', 'Failed to load image preview');
                        }}
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <div className="text-sm text-gray-500">
                      <p>Max 5MB</p>
                      <p>JPG, PNG, GIF, WebP, SVG</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Expires At
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-3 text-sm font-medium text-gray-700">
                  Make notice active
                </label>
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-base font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-200"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>{currentNotice ? 'Update Notice' : 'Create Notice'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticePage;
