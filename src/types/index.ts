export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  profilePicture?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'archived';
  isSpam: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  _id: string;
  title: string;
  content: string;
  image?: string;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: string;
  createdBy: {
    _id: string;
    name: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  isExpired: boolean;
  isCurrentlyActive: boolean;
}

export interface NoticeStats {
  total: number;
  active: number;
  expired: number;
  priorityBreakdown: {
    low?: number;
    medium?: number;
    high?: number;
    urgent?: number;
  };
}

export interface Media {
  _id: string;
  title: string;
  description?: string;
  type: 'image' | 'video';
  fileUrl: string;
  thumbnailUrl?: string | null;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number | null;
  dimensions?: {
    width: number | null;
    height: number | null;
  };
  category?: string;
  tags: string[];
  isPublic: boolean;
  isActive: boolean;
  isUploaded?: boolean;
  externalUrl?: string | null;
  viewCount: number;
  downloadCount: number;
  uploadedBy: {
    _id: string;
    name: string;
    email?: string;
    fullName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  users: {
    total: number;
    byRole: {
      user: number;
      admin: number;
    };
    recent: number;
  };
  contacts: {
    total: number;
    spamCount: number;
    byStatus: {
      pending: number;
      read: number;
      replied: number;
      archived: number;
    };
    recentContacts: number;
    pendingContacts: number;
  };
  media: {
    total: number;
    publicCount: number;
    activeCount: number;
    byType: {
      image: {
        count: number;
        totalSize: number;
        totalViews: number;
        totalDownloads: number;
      };
      video: {
        count: number;
        totalSize: number;
        totalViews: number;
        totalDownloads: number;
      };
    };
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Array<{
    field: string;
    message: string;
    value: string;
  }>;
}

export interface PaginationResponse<T> {
  success: boolean;
  data: {
    media: T[];
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
      limit: number;
    };
  };
}