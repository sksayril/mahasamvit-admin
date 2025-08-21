import React, { useEffect, useState } from 'react';
import {
  Mail,
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Check,
  Reply,
  AlertTriangle,
  Trash2,
  Eye,
} from 'lucide-react';
import { apiService, showToast } from '../services/api';
import { Contact } from '../types';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Menu } from '@headlessui/react';

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchContacts();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const response = await apiService.getContacts(params);
      if (response.success) {
        setContacts(response.data.contacts);
        setTotalPages(response.data.pagination.totalPages);
      }
          } catch (error) {
        console.error('Failed to fetch contacts:', error);
        showToast('error', 'Failed to load contacts');
      } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (contactId: string, action: string) => {
    try {
      let response;
      switch (action) {
        case 'read':
          response = await apiService.markContactAsRead(contactId);
          break;
        case 'replied':
          response = await apiService.markContactAsReplied(contactId);
          break;
        case 'spam':
          response = await apiService.markContactAsSpam(contactId);
          break;
        default:
          return;
      }

              if (response.success) {
          showToast('success', `Contact marked as ${action}`);
          fetchContacts();
        }
      } catch (error) {
        showToast('error', 'Failed to update contact');
      }
    };

    const handleDelete = async (contactId: string) => {
      if (window.confirm('Are you sure you want to delete this contact?')) {
        try {
          const response = await apiService.deleteContact(contactId);
          if (response.success) {
            showToast('success', 'Contact deleted successfully');
            fetchContacts();
          }
        } catch (error) {
          showToast('error', 'Failed to delete contact');
        }
      }
    };

    const handleBulkAction = async (action: string) => {
      if (selectedContacts.length === 0) {
        showToast('error', 'Please select contacts first');
        return;
      }

      try {
        const response = await apiService.bulkContactActions({
          action,
          contactIds: selectedContacts,
        });

        if (response.success) {
          showToast('success', `${selectedContacts.length} contacts updated`);
          setSelectedContacts([]);
          fetchContacts();
        }
      } catch (error) {
        showToast('error', 'Failed to update contacts');
      }
    };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedContacts(
      selectedContacts.length === contacts.length
        ? []
        : contacts.map(contact => contact._id)
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      read: 'bg-blue-100 text-blue-800',
      replied: 'bg-emerald-100 text-emerald-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  if (isLoading && contacts.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and respond to contact submissions
          </p>
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
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedContacts.length > 0 && (
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {selectedContacts.length} selected
            </span>
            <button
              onClick={() => handleBulkAction('mark-read')}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
            >
              Mark as Read
            </button>
            <button
              onClick={() => handleBulkAction('mark-replied')}
              className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-md text-sm hover:bg-emerald-200 transition-colors"
            >
              Mark as Replied
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedContacts.length === contacts.length && contacts.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Select All</span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {contacts.map((contact) => (
            <div key={contact._id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={selectedContacts.includes(contact._id)}
                  onChange={() => toggleContactSelection(contact._id)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {contact.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>
                      {contact.isSpam && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Spam
                        </span>
                      )}
                    </div>
                    
                    <Menu as="div" className="relative">
                      <Menu.Button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                      </Menu.Button>
                      <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => handleStatusUpdate(contact._id, 'read')}
                              className={`${active ? 'bg-gray-50' : ''} flex items-center space-x-2 w-full px-4 py-2 text-left text-sm`}
                            >
                              <Check className="h-4 w-4 text-blue-600" />
                              <span>Mark as Read</span>
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => handleStatusUpdate(contact._id, 'replied')}
                              className={`${active ? 'bg-gray-50' : ''} flex items-center space-x-2 w-full px-4 py-2 text-left text-sm`}
                            >
                              <Reply className="h-4 w-4 text-emerald-600" />
                              <span>Mark as Replied</span>
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => handleStatusUpdate(contact._id, 'spam')}
                              className={`${active ? 'bg-gray-50' : ''} flex items-center space-x-2 w-full px-4 py-2 text-left text-sm`}
                            >
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <span>Mark as Spam</span>
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => handleDelete(contact._id)}
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
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <span>{contact.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(contact.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {contact.subject}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {contact.message}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {contacts.length === 0 && !isLoading && (
          <div className="p-12 text-center">
            <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No contacts found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Contacts;