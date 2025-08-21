import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = 'https://api.mahasamvit.com/api';

// Error message extraction utility
const extractErrorMessage = (error: AxiosError): string => {
	// Try to get error message from API response
	if (error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
		return (error.response.data as any).message;
	}
	
	// Try to get error message from validation errors
	if (error.response?.data && typeof error.response.data === 'object' && 'errors' in error.response.data) {
		const errors = (error.response.data as any).errors;
		if (Array.isArray(errors) && errors.length > 0 && errors[0]?.message) {
			return errors[0].message;
		}
	}
	
	// Try to get error message from error field
	if (error.response?.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
		return (error.response.data as any).error;
	}
	
	// Fallback to status-based messages
	switch (error.response?.status) {
		case 400:
			return 'Invalid request. Please check your input.';
		case 401:
			return 'Authentication required. Please login again.';
		case 403:
			return 'You do not have permission to perform this action.';
		case 404:
			return 'The requested resource was not found.';
		case 409:
			return 'This resource already exists.';
		case 422:
			return 'Validation failed. Please check your input.';
		case 429:
			return 'Too many requests. Please try again later.';
		case 500:
			return 'Internal server error. Please try again later.';
		case 502:
			return 'Bad gateway. Please try again later.';
		case 503:
			return 'Service temporarily unavailable. Please try again later.';
		case 504:
			return 'Gateway timeout. Please try again later.';
		default:
			return error.message || 'An unexpected error occurred.';
	}
};

// Toast notification utility with better styling
export const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
	const toastOptions = {
		duration: type === 'error' ? 5000 : 4000,
		position: 'top-right' as const,
		style: {
			background: type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : type === 'warning' ? '#F59E0B' : '#3B82F6',
			color: '#fff',
			fontWeight: '500',
			borderRadius: '8px',
			padding: '12px 16px',
		},
		iconTheme: {
			primary: '#fff',
			secondary: type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : type === 'warning' ? '#F59E0B' : '#3B82F6',
		},
	};

	switch (type) {
		case 'success':
			toast.success(message, toastOptions);
			break;
		case 'error':
			toast.error(message, toastOptions);
			break;
		case 'warning':
			toast(message, { ...toastOptions, icon: '⚠️' });
			break;
		case 'info':
			toast(message, { ...toastOptions, icon: 'ℹ️' });
			break;
	}
};

// Utility function to construct complete media URLs
export const getMediaUrl = (fileUrl: string): string => {
	if (!fileUrl) return '';
	
	// If it's already a complete URL, return as is
	if (/^https?:\/\//i.test(fileUrl)) {
		return fileUrl;
	}
	
	// Normalize base to API origin (strip trailing /api and any trailing slash)
	const apiOrigin = (() => {
		try {
			const u = new URL(BASE_URL);
			return `${u.protocol}//${u.host}`;
		} catch {
			return BASE_URL.replace(/\/api\/?$/, '');
		}
	})();
	
	// Join using URL to avoid double slashes and handle missing leading slash
	try {
		const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
		return new URL(normalizedPath, apiOrigin).toString();
	} catch {
		// Fallback simple concatenation
		return `${apiOrigin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
	}
};

// Utility function to get the best available image URL
export const getBestImageUrl = (media: { fileUrl: string; thumbnailUrl?: string | null; externalUrl?: string | null }): string => {
	// Priority: thumbnailUrl > fileUrl > externalUrl
	if (media.thumbnailUrl) {
		return getMediaUrl(media.thumbnailUrl);
	}
	if (media.fileUrl) {
		return getMediaUrl(media.fileUrl);
	}
	if (media.externalUrl) {
		return media.externalUrl;
	}
	return '';
};

// Utility function to construct notice image URLs
export const getNoticeImageUrl = (imagePath: string): string => {
	if (!imagePath) return '';
	
	// If it's already a complete URL, return as is
	if (/^https?:\/\//i.test(imagePath)) {
		return imagePath;
	}
	
	// If it's a relative path, combine with base URL
	const apiOrigin = (() => {
		try {
			const u = new URL(BASE_URL);
			return `${u.protocol}//${u.host}`;
		} catch {
			return BASE_URL.replace(/\/api\/?$/, '');
		}
	})();
	
	// Join using URL to avoid double slashes and handle missing leading slash
	try {
		const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
		return new URL(normalizedPath, apiOrigin).toString();
	} catch {
		// Fallback simple concatenation
		return `${apiOrigin}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
	}
};

// Utility function to get notice image URL with CORS fallback
export const getNoticeImageUrlWithFallback = (imagePath: string): string => {
	const directUrl = getNoticeImageUrl(imagePath);
	
	// If it's a relative path, try to use the API as a proxy
	if (imagePath && !imagePath.startsWith('http')) {
		// Try using the API endpoint as a proxy
		return `${BASE_URL.replace('/api', '')}/api/notice/image?path=${encodeURIComponent(imagePath)}`;
	}
	
	return directUrl;
};

class ApiService {
	private api: AxiosInstance;

	constructor() {
		this.api = axios.create({
			baseURL: BASE_URL,
			timeout: 10000,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		this.setupInterceptors();
	}

	private setupInterceptors() {
		// Request interceptor
		this.api.interceptors.request.use(
			(config) => {
				const token = localStorage.getItem('token');
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}
				return config;
			},
			(error) => {
				return Promise.reject(error);
			}
		);

		// Response interceptor
		this.api.interceptors.response.use(
			(response: AxiosResponse) => {
				return response;
			},
			(error: AxiosError) => {
				const errorMessage = extractErrorMessage(error);
				const status = error.response?.status;
				
				if (status === 401) {
					localStorage.removeItem('token');
					localStorage.removeItem('user');
					window.location.href = '/login';
					showToast('error', errorMessage);
				} else if (status === 403) {
					showToast('error', errorMessage);
				} else if (status && status >= 500) {
					showToast('error', errorMessage);
				} else {
					showToast('error', errorMessage);
				}
				return Promise.reject(error);
			}
		);
	}

	// Authentication
	async login(credentials: { email: string; password: string }) {
		try {
			const response = await this.api.post('/auth/login', credentials);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async register(credentials: { name: string; email: string; password: string }) {
		try {
			const response = await this.api.post('/auth/register', credentials);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async getProfile() {
		try {
			const response = await this.api.get('/auth/profile');
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async updateProfile(data: { name: string; email: string; profilePicture?: string }) {
		try {
			const response = await this.api.put('/auth/profile', data);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }) {
		try {
			const response = await this.api.put('/auth/change-password', data);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async logout() {
		try {
			const response = await this.api.post('/auth/logout');
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async verifyToken() {
		try {
			const response = await this.api.get('/auth/verify');
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	// Admin Dashboard
	async getDashboardStats() {
		try {
			const response = await this.api.get('/admin/dashboard');
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	// Contact Management
	async getContacts(params?: any) {
		try {
			const response = await this.api.get('/contact', { params });
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async getContactById(id: string) {
		try {
			const response = await this.api.get(`/contact/${id}`);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async markContactAsRead(id: string) {
		try {
			const response = await this.api.put(`/contact/${id}/read`);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async markContactAsReplied(id: string) {
		try {
			const response = await this.api.put(`/contact/${id}/replied`);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async markContactAsSpam(id: string) {
		try {
			const response = await this.api.put(`/contact/${id}/spam`);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async deleteContact(id: string) {
		try {
			const response = await this.api.delete(`/contact/${id}`);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async bulkContactActions(data: { action: string; contactIds: string[] }) {
		try {
			const response = await this.api.post('/contact/bulk-actions', data);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async getContactStats() {
		try {
			const response = await this.api.get('/contact/stats/overview');
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	// Media Management
	async getAllMedia(params?: any) {
		try {
			const response = await this.api.get('/media/admin/all', { params });
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async getPublicMedia(params?: any) {
		try {
			const response = await this.api.get('/media', { params });
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async getMediaById(id: string) {
		try {
			const response = await this.api.get(`/media/${id}`);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async uploadMedia(formData: FormData) {
		try {
			const response = await this.api.post('/media/upload', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async addExternalMedia(data: any) {
		try {
			const response = await this.api.post('/media/external', data);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async updateMedia(id: string, data: any) {
		try {
			const response = await this.api.put(`/media/${id}`, data);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async deleteMedia(id: string) {
		try {
			const response = await this.api.delete(`/media/${id}`);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async bulkDeleteMedia(data: { mediaIds: string[] }) {
		try {
			const response = await this.api.post('/media/bulk-delete', data);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async getMediaStats() {
		try {
			const response = await this.api.get('/media/stats/overview');
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	// User Management (Admin)
	async getAllUsers(params?: any) {
		try {
			const response = await this.api.get('/admin/users', { params });
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async getUserById(id: string) {
		try {
			const response = await this.api.get(`/admin/users/${id}`);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async updateUser(id: string, data: any) {
		try {
			const response = await this.api.put(`/admin/users/${id}`, data);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async deleteUser(id: string) {
		try {
			const response = await this.api.delete(`/admin/users/${id}`);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async createAdminUser(data: { name: string; email: string; password: string }) {
		try {
			const response = await this.api.post('/admin/users/admin', data);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async bulkUserActions(data: { action: string; userIds: string[] }) {
		try {
			const response = await this.api.post('/admin/users/bulk-actions', data);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async getSystemStats() {
		try {
			const response = await this.api.get('/admin/stats/system');
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	// Notice Management
	async getCurrentNotice() {
		try {
			const response = await this.api.get('/notice/admin/current');
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async createOrUpdateNotice(data: {
		title: string;
		content: string;
		image?: string;
		isActive?: boolean;
		priority?: 'low' | 'medium' | 'high' | 'urgent';
		expiresAt?: string;
	}) {
		try {
			const response = await this.api.post('/notice/admin', data);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async createOrUpdateNoticeWithImage(formData: FormData) {
		try {
			const response = await this.api.post('/notice/admin/with-image', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async updateNotice(data: {
		title?: string;
		content?: string;
		image?: string;
		isActive?: boolean;
		priority?: 'low' | 'medium' | 'high' | 'urgent';
		expiresAt?: string;
	}) {
		try {
			const response = await this.api.put('/notice/admin', data);
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async updateNoticeWithImage(formData: FormData) {
		try {
			const response = await this.api.put('/notice/admin/with-image', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async deleteNotice() {
		try {
			const response = await this.api.delete('/notice/admin');
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}

	async getNoticeStats() {
		try {
			const response = await this.api.get('/notice/admin/stats');
			return response.data;
		} catch (error: any) {
			const errorMessage = extractErrorMessage(error);
			showToast('error', errorMessage);
			throw error;
		}
	}
}

export const apiService = new ApiService();