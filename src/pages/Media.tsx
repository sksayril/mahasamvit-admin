import React, { useEffect, useState } from 'react';
import {
  Upload,
  Image,
  Video,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  Download,
  X,
  Link as LinkIcon,
  ZoomIn,
} from 'lucide-react';
import { apiService, getMediaUrl, getBestImageUrl, showToast } from '../services/api';
import { Media } from '../types';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Menu } from '@headlessui/react';

const MediaPage: React.FC = () => {
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    isPublic: true,
  });
  const [externalData, setExternalData] = useState({
    title: '',
    description: '',
    type: 'video' as 'image' | 'video',
    externalUrl: '',
    category: '',
    tags: '',
    isPublic: true,
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, [currentPage, typeFilter, searchTerm]);

  // Initialize loading states for new media items
  useEffect(() => {
    const newLoadingStates: { [key: string]: boolean } = {};
    media.forEach(item => {
      if (imageLoadingStates[item._id] === undefined) {
        newLoadingStates[item._id] = true;
      }
    });
    if (Object.keys(newLoadingStates).length > 0) {
      setImageLoadingStates(prev => ({ ...prev, ...newLoadingStates }));
    }
  }, [media]);

  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(searchTerm && { search: searchTerm }),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const response = await apiService.getAllMedia(params);
      if (response.success) {
        setMedia(response.data.media);
        setTotalPages(response.data.pagination.totalPages);
      }
          } catch (error) {
        console.error('Failed to fetch media:', error);
        showToast('error', 'Failed to load media');
      } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('media', uploadFile);
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('category', uploadData.category);
      formData.append('tags', JSON.stringify(uploadData.tags.split(',').map(tag => tag.trim()).filter(Boolean)));
      formData.append('isPublic', uploadData.isPublic.toString());

              const response = await apiService.uploadMedia(formData);
        if (response.success) {
          showToast('success', 'Media uploaded successfully');
          setShowUploadModal(false);
          resetUploadForm();
          fetchMedia();
        }
      } catch (error) {
        showToast('error', 'Failed to upload media');
      } finally {
        setIsUploading(false);
      }
    };

    const handleExternalMediaAdd = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setIsUploading(true);
        const response = await apiService.addExternalMedia({
          ...externalData,
          tags: externalData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        });

        if (response.success) {
          showToast('success', 'External media added successfully');
          setShowExternalModal(false);
          resetExternalForm();
          fetchMedia();
        }
      } catch (error) {
        showToast('error', 'Failed to add external media');
      } finally {
        setIsUploading(false);
      }
    };

  const handleImagePreview = (item: Media) => {
    if (item.type === 'image') {
      setPreviewImage({
        url: getBestImageUrl(item),
        title: item.title
      });
      setShowImagePreview(true);
    }
  };

  const handleImageLoad = (itemId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [itemId]: false }));
  };

  const handleImageError = (itemId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [itemId]: false }));
  };

  const getImageFallback = (item: Media) => {
    if (item.externalUrl) {
      return item.externalUrl;
    }
    return 'https://via.placeholder.com/300x200?text=Image+Not+Found';
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showImagePreview) {
      setShowImagePreview(false);
    }
  };

  useEffect(() => {
    if (showImagePreview) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showImagePreview]);

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadData({
      title: '',
      description: '',
      category: '',
      tags: '',
      isPublic: true,
    });
  };

  const resetExternalForm = () => {
    setExternalData({
      title: '',
      description: '',
      type: 'video',
      externalUrl: '',
      category: '',
      tags: '',
      isPublic: true,
    });
  };

  const handleDelete = async (mediaId: string) => {
    if (window.confirm('Are you sure you want to delete this media?')) {
      try {
                  const response = await apiService.deleteMedia(mediaId);
          if (response.success) {
            showToast('success', 'Media deleted successfully');
            fetchMedia();
          }
        } catch (error) {
          showToast('error', 'Failed to delete media');
        }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading && media.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Gallery</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage images and videos
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowExternalModal(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <LinkIcon className="h-4 w-4" />
            <span>Add URL</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {media.map((item) => (
          <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative">
              {item.type === 'image' ? (
                <div className="relative group cursor-pointer">
                  {imageLoadingStates[item._id] !== false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                  <img
                    src={getBestImageUrl(item)}
                    alt={item.title}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    className={`w-full h-48 object-cover transition-transform group-hover:scale-105 ${
                      imageLoadingStates[item._id] !== false ? 'opacity-0' : 'opacity-100'
                    }`}
                    onLoad={() => handleImageLoad(item._id)}
                    onError={(e) => {
                      handleImageError(item._id);
                      (e.target as HTMLImageElement).src = getImageFallback(item);
                    }}
                  />
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center"
                    onClick={() => handleImagePreview(item)}
                  >
                    <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {item.externalUrl && (
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        External
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-900 flex items-center justify-center relative">
                  <Video className="h-12 w-12 text-white" />
                  {item.duration && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                  {item.externalUrl && (
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        External
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="absolute top-2 right-2">
                <Menu as="div" className="relative">
                  <Menu.Button className="p-2 bg-black bg-opacity-50 text-white rounded-md hover:bg-opacity-75 transition-all">
                    <MoreHorizontal className="h-4 w-4" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href={getBestImageUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${active ? 'bg-gray-50' : ''} flex items-center space-x-2 w-full px-4 py-2 text-left text-sm`}
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                          <span>View</span>
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href={`${getBestImageUrl(item)}?download=1`}
                          download
                          className={`${active ? 'bg-gray-50' : ''} flex items-center space-x-2 w-full px-4 py-2 text-left text-sm`}
                        >
                          <Download className="h-4 w-4 text-emerald-600" />
                          <span>Download</span>
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleDelete(item._id)}
                          className={`${active ? 'bg-gray-50' : ''} flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-red-600`}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Menu>
              </div>

              <div className="absolute top-2 left-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  item.type === 'image' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {item.type === 'image' ? <Image className="h-3 w-3 mr-1" /> : <Video className="h-3 w-3 mr-1" />}
                  {item.type}
                </span>
              </div>

              {!item.isPublic && (
                <div className="absolute bottom-2 left-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Private
                  </span>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {item.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                  {item.fileSize && (
                    <span>{formatFileSize(item.fileSize)}</span>
                  )}
                  {item.mimeType && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{item.mimeType.split('/')[1]}</span>
                    </>
                  )}
                  {item.dimensions?.width && item.dimensions?.height && (
                    <>
                      <span>•</span>
                      <span>{item.dimensions.width}×{item.dimensions.height}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{item.viewCount} views</span>
                </div>
                <span>{format(new Date(item.createdAt), 'MMM dd')}</span>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      +{item.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
              
              {item.category && (
                <div className="mt-2 text-xs text-gray-500">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {item.category}
                  </span>
                </div>
              )}
              
              {item.uploadedBy && (
                <div className="mt-2 text-xs text-gray-500">
                  <span>By {item.uploadedBy.fullName || item.uploadedBy.name}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {media.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <Image className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || typeFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by uploading your first image or video.'
              }
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center space-x-2 mx-auto"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Media</span>
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upload Media</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={uploadData.category}
                  onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., portfolio, nature, events"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData({...uploadData, tags: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={uploadData.isPublic}
                  onChange={(e) => setUploadData({...uploadData, isPublic: e.target.checked})}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                  Make public
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Upload</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* External Media Modal */}
      {showExternalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add External Media</h3>
              <button
                onClick={() => setShowExternalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExternalMediaAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={externalData.type}
                  onChange={(e) => setExternalData({...externalData, type: e.target.value as 'image' | 'video'})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  External URL
                </label>
                <input
                  type="url"
                  value={externalData.externalUrl}
                  onChange={(e) => setExternalData({...externalData, externalUrl: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/media.jpg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={externalData.title}
                  onChange={(e) => setExternalData({...externalData, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={externalData.description}
                  onChange={(e) => setExternalData({...externalData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={externalData.category}
                  onChange={(e) => setExternalData({...externalData, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., portfolio, nature, events"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={externalData.tags}
                  onChange={(e) => setExternalData({...externalData, tags: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublicExternal"
                  checked={externalData.isPublic}
                  onChange={(e) => setExternalData({...externalData, isPublic: e.target.checked})}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPublicExternal" className="ml-2 text-sm text-gray-700">
                  Make public
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExternalModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Media</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImagePreview && previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            {/* Close button */}
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Image container */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={previewImage.url} 
                alt={previewImage.title} 
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                }}
              />
            </div>
            
            {/* Image info overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">{previewImage.title}</h3>
              <div className="flex items-center space-x-4 text-sm">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 hover:text-blue-300 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>Open in new tab</span>
                </a>
                <a
                  href={`${previewImage.url}?download=1`}
                  download
                  className="flex items-center space-x-1 hover:text-green-300 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPage;