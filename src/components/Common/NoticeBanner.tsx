import React, { useEffect, useState } from 'react';
import { Bell, X, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { apiService, getNoticeImageUrl, getNoticeImageUrlWithFallback } from '../../services/api';
import { Notice } from '../../types';

interface NoticeBannerProps {
  className?: string;
}

const NoticeBanner: React.FC<NoticeBannerProps> = ({ className = '' }) => {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoadAttempts, setImageLoadAttempts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchCurrentNotice();
  }, []);

  const fetchCurrentNotice = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCurrentNotice();
      if (response.success && response.data.notice) {
        const currentNotice = response.data.notice;
        // Only show if notice is active and not expired
        if (currentNotice.isActive && currentNotice.isCurrentlyActive) {
          setNotice(currentNotice);
        }
      }
    } catch (error) {
      console.error('Failed to fetch current notice:', error);
    } finally {
      setIsLoading(false);
    }
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
    console.error('Failed to load notice banner image after all attempts:', imagePath);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
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

  if (isLoading || !notice || !isVisible) {
    return null;
  }

  return (
    <div className={`border-l-4 ${getPriorityColor(notice.priority)} p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            {getPriorityIcon(notice.priority)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-medium">{notice.title}</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white bg-opacity-50">
                {notice.priority}
              </span>
            </div>
            {notice.image && (
              <div className="mb-2">
                <img 
                  src={getNoticeImageUrlWithFallback(notice.image)} 
                  alt={notice.title}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  className="max-w-full h-auto max-h-32 rounded object-cover"
                  onError={(e) => {
                    if (notice.image) {
                      handleImageError(notice.image, e.target as HTMLImageElement);
                    }
                  }}
                  onLoad={() => {
                    console.log('Notice banner image loaded successfully:', notice.image);
                  }}
                />
              </div>
            )}
            <p className="text-sm whitespace-pre-wrap">{notice.content}</p>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 ml-3 p-1 rounded-md hover:bg-white hover:bg-opacity-20 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default NoticeBanner;
