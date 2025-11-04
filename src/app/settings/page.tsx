'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navigation from '@/components/Navigation';
import { useUI } from '@/contexts/UIContext';
import { QRCodeSVG } from 'qrcode.react';
import AgentsTab from '@/components/AgentsTab';

interface ActivityLog {
  id: string;
  type: string;
  userId: string | null;
  userEmail: string | null;
  description: string;
  entityType: string | null;
  entityId: string | null;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface LogsPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface DocumentType {
  id: string;
  name: string;
  label: string;
  isDefault: boolean;
  isActive: boolean;
  order: number;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { settings: uiSettings, updateSettings } = useUI();
  const [activeTab, setActiveTab] = useState<'rates' | 'users' | 'ui' | 'logs' | 'doctypes' | 'email' | 'agents'>('rates');

  // Exchange Rates State
  const [rateDate, setRateDate] = useState('');
  const [rates, setRates] = useState({
    NZD_WST: '',
    NZD_AUD: '',
    NZD_USD: ''
  });
  const [rateMessage, setRateMessage] = useState('');
  const [rateError, setRateError] = useState('');
  const [savingRates, setSavingRates] = useState(false);

  // User Management State
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    roles: ['STAFF'] as string[] // Array of selected roles
  });
  const [userMessage, setUserMessage] = useState('');
  const [userError, setUserError] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  // Activity Logs State
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsPagination, setLogsPagination] = useState<LogsPagination>({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0
  });
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState({
    type: '',
    search: ''
  });

  // Document Types State
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loadingDocTypes, setLoadingDocTypes] = useState(false);
  const [newDocType, setNewDocType] = useState({ label: '' });
  const [docTypeMessage, setDocTypeMessage] = useState('');
  const [docTypeError, setDocTypeError] = useState('');

  // Email Settings State
  const [emailSettings, setEmailSettings] = useState({
    enabled: false,
    clientId: '',
    clientSecret: '',
    tenantId: '',
    senderEmail: '',
    senderName: ''
  });
  const [loadingEmailSettings, setLoadingEmailSettings] = useState(false);
  const [savingEmailSettings, setSavingEmailSettings] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);

  // Agents State
  const [agents, setAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    isHeadOffice: false
  });
  const [agentMessage, setAgentMessage] = useState('');
  const [agentError, setAgentError] = useState('');
  const [creatingAgent, setCreatingAgent] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setRateDate(today);
    fetchRates(today);
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, logsPagination.page, logFilter]);

  useEffect(() => {
    if (activeTab === 'doctypes') {
      fetchDocumentTypes();
    } else if (activeTab === 'email') {
      fetchEmailSettings();
    } else if (activeTab === 'agents') {
      fetchAgents();
    }
  }, [activeTab]);

  async function fetchRates(date: string) {
    try {
      const response = await fetch(`/api/exchange-rates?date=${date}`);
      const data = await response.json();
      if (data.rates) {
        setRates({
          NZD_WST: data.rates.NZD_WST.toString(),
          NZD_AUD: data.rates.NZD_AUD.toString(),
          NZD_USD: data.rates.NZD_USD.toString()
        });
      }
    } catch (err) {
      console.error('Failed to fetch rates');
    }
  }

  async function saveRates() {
    setRateError('');
    setRateMessage('');
    setSavingRates(true);

    try {
      const response = await fetch('/api/exchange-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateKey: rateDate,
          NZD_WST: parseFloat(rates.NZD_WST),
          NZD_AUD: parseFloat(rates.NZD_AUD),
          NZD_USD: parseFloat(rates.NZD_USD)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setRateError(data.error || 'Failed to save rates');
      } else {
        setRateMessage('Exchange rates saved successfully!');
        setTimeout(() => setRateMessage(''), 3000);
      }
    } catch (err) {
      setRateError('An error occurred while saving rates');
    } finally {
      setSavingRates(false);
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setUserError('');
    setUserMessage('');
    setCreatingUser(true);

    try {
      if (newUser.roles.length === 0) {
        setUserError('Please select at least one role');
        setCreatingUser(false);
        return;
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          roles: newUser.roles
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setUserError(data.error || 'Failed to create user');
        return;
      }

      setUserMessage(`User ${newUser.email} created successfully with roles: ${newUser.roles.join(', ')}`);
      setNewUser({ email: '', password: '', roles: ['STAFF'] });
      setTimeout(() => setUserMessage(''), 5000);
    } catch (err) {
      setUserError('Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  }

  async function fetchLogs() {
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams({
        page: logsPagination.page.toString(),
        limit: logsPagination.limit.toString(),
        ...(logFilter.type && { type: logFilter.type }),
        ...(logFilter.search && { search: logFilter.search })
      });

      const response = await fetch(`/api/activity-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setLogsPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function getActivityTypeLabel(type: string) {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  function getActivityTypeColor(type: string) {
    const colors: Record<string, string> = {
      USER_LOGIN: 'bg-blue-100 text-blue-800',
      USER_LOGOUT: 'bg-gray-100 text-gray-800',
      CUSTOMER_CREATED: 'bg-green-100 text-green-800',
      CUSTOMER_UPDATED: 'bg-yellow-100 text-yellow-800',
      CUSTOMER_VIEWED: 'bg-purple-100 text-purple-800',
      CUSTOMER_ID_UPLOADED: 'bg-indigo-100 text-indigo-800',
      CUSTOMER_ID_VIEWED: 'bg-purple-100 text-purple-800',
      TRANSACTION_CREATED: 'bg-blue-100 text-blue-800',
      TRANSACTION_VIEWED: 'bg-indigo-100 text-indigo-800',
      EXCHANGE_RATE_UPDATED: 'bg-orange-100 text-orange-800',
      SETTINGS_CHANGED: 'bg-pink-100 text-pink-800',
      REPORT_GENERATED: 'bg-cyan-100 text-cyan-800',
      SEARCH_PERFORMED: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  async function fetchDocumentTypes() {
    setLoadingDocTypes(true);
    try {
      const response = await fetch('/api/document-types');
      if (response.ok) {
        const data = await response.json();
        setDocumentTypes(data.documentTypes);
      }
    } catch (error) {
      console.error('Failed to fetch document types:', error);
    } finally {
      setLoadingDocTypes(false);
    }
  }

  async function handleAddDocumentType(e: React.FormEvent) {
    e.preventDefault();
    setDocTypeError('');
    setDocTypeMessage('');

    if (!newDocType.label.trim()) {
      setDocTypeError('Label is required');
      return;
    }

    try {
      const response = await fetch('/api/document-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDocType.label, label: newDocType.label })
      });

      const data = await response.json();

      if (!response.ok) {
        setDocTypeError(data.error || 'Failed to add document type');
        return;
      }

      setDocTypeMessage('Document type added successfully!');
      setNewDocType({ label: '' });
      fetchDocumentTypes();
      setTimeout(() => setDocTypeMessage(''), 3000);
    } catch (err) {
      setDocTypeError('An error occurred');
    }
  }

  async function handleDeleteDocumentType(id: string) {
    if (!confirm('Are you sure you want to remove this document type?')) {
      return;
    }

    try {
      const response = await fetch(`/api/document-types/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDocTypeMessage('Document type removed successfully!');
        fetchDocumentTypes();
        setTimeout(() => setDocTypeMessage(''), 3000);
      }
    } catch (error) {
      setDocTypeError('Failed to delete document type');
    }
  }

  async function fetchEmailSettings() {
    setLoadingEmailSettings(true);
    try {
      const response = await fetch('/api/settings/email');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setEmailSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Failed to fetch email settings:', error);
    } finally {
      setLoadingEmailSettings(false);
    }
  }

  async function handleSaveEmailSettings(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    setEmailMessage('');
    setSavingEmailSettings(true);

    try {
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings)
      });

      const data = await response.json();

      if (!response.ok) {
        setEmailError(data.error || 'Failed to save email settings');
        return;
      }

      setEmailMessage('Email settings saved successfully!');
      setTimeout(() => setEmailMessage(''), 3000);
    } catch (err) {
      setEmailError('An error occurred while saving email settings');
    } finally {
      setSavingEmailSettings(false);
    }
  }

  async function handleTestEmail() {
    setEmailError('');
    setEmailMessage('');
    setTestingEmail(true);

    try {
      const response = await fetch('/api/settings/email/test', {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        setEmailError(data.error || 'Failed to send test email');
        return;
      }

      setEmailMessage('Test email sent successfully! Check your inbox.');
      setTimeout(() => setEmailMessage(''), 5000);
    } catch (err) {
      setEmailError('An error occurred while sending test email');
    } finally {
      setTestingEmail(false);
    }
  }

  async function fetchAgents() {
    setLoadingAgents(true);
    try {
      const response = await fetch('/api/agents?includeStats=true');
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoadingAgents(false);
    }
  }

  async function handleCreateAgent(e: React.FormEvent) {
    e.preventDefault();
    setAgentError('');
    setAgentMessage('');
    setCreatingAgent(true);

    try {
      if (!newAgent.name.trim()) {
        setAgentError('Agent name is required');
        setCreatingAgent(false);
        return;
      }

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent)
      });

      const data = await response.json();

      if (!response.ok) {
        setAgentError(data.error || 'Failed to create agent');
        return;
      }

      setAgentMessage(`Agent ${data.name} (${data.agentCode}) created successfully!`);
      setNewAgent({
        name: '',
        location: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        isHeadOffice: false
      });
      fetchAgents();
      setTimeout(() => setAgentMessage(''), 5000);
    } catch (err) {
      setAgentError('Failed to create agent');
    } finally {
      setCreatingAgent(false);
    }
  }

  async function handleUpdateAgentStatus(agentId: string, status: string) {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setAgentMessage('Agent status updated successfully!');
        fetchAgents();
        setTimeout(() => setAgentMessage(''), 3000);
      }
    } catch (error) {
      setAgentError('Failed to update agent status');
    }
  }

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const userRoles = (session?.user as any)?.roles || '';
  const isAdmin = userRoles.split(',').map((r: string) => r.trim()).includes('ADMIN');

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <a href="/" className="text-blue-600 hover:text-blue-700">← Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('rates')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'rates'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Exchange Rates
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'users'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveTab('ui')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'ui'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                UI Customization
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'logs'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Activity Logs
              </button>
              <button
                onClick={() => setActiveTab('doctypes')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'doctypes'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Document Types
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'email'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Email (Office 365)
              </button>
              <button
                onClick={() => setActiveTab('agents')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'agents'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Agents & QR Codes
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Exchange Rates Tab */}
            {activeTab === 'rates' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Set Exchange Rates</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Set the exchange rates for a specific date. These rates will be used when creating new transactions.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={rateDate}
                    onChange={(e) => {
                      setRateDate(e.target.value);
                      fetchRates(e.target.value);
                    }}
                    className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NZD → WST (Samoa Tala)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={rates.NZD_WST}
                      onChange={(e) => setRates({ ...rates, NZD_WST: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="2.1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NZD → AUD (Australian Dollar)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={rates.NZD_AUD}
                      onChange={(e) => setRates({ ...rates, NZD_AUD: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0.9300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NZD → USD (US Dollar)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={rates.NZD_USD}
                      onChange={(e) => setRates({ ...rates, NZD_USD: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0.6100"
                    />
                  </div>
                </div>

                {rateMessage && (
                  <div className="rounded-md bg-green-50 p-4">
                    <p className="text-sm text-green-800">{rateMessage}</p>
                  </div>
                )}

                {rateError && (
                  <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{rateError}</p>
                  </div>
                )}

                <button
                  onClick={saveRates}
                  disabled={savingRates}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingRates ? 'Saving...' : 'Save Exchange Rates'}
                </button>
              </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Create new users and manage roles.
                  </p>
                </div>

                <form onSubmit={createUser} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                      type="password"
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Minimum 8 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newUser.roles.includes('STAFF')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser({ ...newUser, roles: [...newUser.roles, 'STAFF'] });
                            } else {
                              setNewUser({ ...newUser, roles: newUser.roles.filter(r => r !== 'STAFF') });
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Staff</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newUser.roles.includes('ADMIN')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser({ ...newUser, roles: [...newUser.roles, 'ADMIN'] });
                            } else {
                              setNewUser({ ...newUser, roles: newUser.roles.filter(r => r !== 'ADMIN') });
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Admin</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newUser.roles.includes('AML')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser({ ...newUser, roles: [...newUser.roles, 'AML'] });
                            } else {
                              setNewUser({ ...newUser, roles: newUser.roles.filter(r => r !== 'AML') });
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">AML (Anti-Money Laundering)</span>
                      </label>
                    </div>
                  </div>

                  {userMessage && (
                    <div className="rounded-md bg-blue-50 p-4">
                      <p className="text-sm text-blue-800">{userMessage}</p>
                    </div>
                  )}

                  {userError && (
                    <div className="rounded-md bg-red-50 p-4">
                      <p className="text-sm text-red-800">{userError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creatingUser ? 'Creating...' : 'Create User'}
                  </button>
                </form>

                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Current Users</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">admin@samoafinance.local</p>
                          <p className="text-xs text-gray-500">Role: Admin</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div>
                          <p className="font-medium">staff@samoafinance.local</p>
                          <p className="text-xs text-gray-500">Role: Staff</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Note: To manage users directly, use Prisma Studio: <code className="bg-gray-100 px-2 py-1 rounded">npx prisma studio</code>
                  </p>
                </div>
              </div>
            )}

            {/* UI Customization Tab */}
            {activeTab === 'ui' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">UI Customization</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Customize the appearance and layout of your application.
                  </p>
                </div>

                {/* Navigation Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Navigation Position
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => updateSettings({ navPosition: 'top' })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        uiSettings.navPosition === 'top'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">⬆️</div>
                        <div className="font-medium">Top</div>
                        <div className="text-xs text-gray-500">Horizontal navigation bar</div>
                      </div>
                    </button>

                    <button
                      onClick={() => updateSettings({ navPosition: 'left' })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        uiSettings.navPosition === 'left'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">⬅️</div>
                        <div className="font-medium">Left</div>
                        <div className="text-xs text-gray-500">Sidebar on left</div>
                      </div>
                    </button>

                    <button
                      onClick={() => updateSettings({ navPosition: 'right' })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        uiSettings.navPosition === 'right'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">➡️</div>
                        <div className="font-medium">Right</div>
                        <div className="text-xs text-gray-500">Sidebar on right</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Navigation Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Navigation Style
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => updateSettings({ navStyle: 'gradient' })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        uiSettings.navStyle === 'gradient'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded mb-2"></div>
                      <div className="font-medium">Gradient</div>
                      <div className="text-xs text-gray-500">Blue to indigo gradient</div>
                    </button>

                    <button
                      onClick={() => updateSettings({ navStyle: 'solid' })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        uiSettings.navStyle === 'solid'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="h-8 bg-blue-600 rounded mb-2"></div>
                      <div className="font-medium">Solid</div>
                      <div className="text-xs text-gray-500">Solid blue color</div>
                    </button>

                    <button
                      onClick={() => updateSettings({ navStyle: 'glass' })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        uiSettings.navStyle === 'glass'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="h-8 bg-blue-600/90 backdrop-blur rounded mb-2"></div>
                      <div className="font-medium">Glass</div>
                      <div className="text-xs text-gray-500">Translucent with blur</div>
                    </button>

                    <button
                      onClick={() => updateSettings({ navStyle: 'minimal' })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        uiSettings.navStyle === 'minimal'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="h-8 bg-white border-b-2 border-gray-200 rounded mb-2"></div>
                      <div className="font-medium">Minimal</div>
                      <div className="text-xs text-gray-500">Clean white background</div>
                    </button>
                  </div>
                </div>

                <div className="rounded-md bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    💡 Tip: Changes are applied instantly and saved automatically. Refresh the page to see the full effect.
                  </p>
                </div>
              </div>
            )}

            {/* Activity Logs Tab */}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Logs</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Complete audit trail of all system activities (Admin only)
                  </p>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="activityType" className="block text-sm font-medium text-gray-700 mb-1">
                      Activity Type
                    </label>
                    <select
                      id="activityType"
                      value={logFilter.type}
                      onChange={(e) => setLogFilter({ ...logFilter, type: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Activities</option>
                      <option value="USER_LOGIN">User Login</option>
                      <option value="USER_LOGOUT">User Logout</option>
                      <option value="CUSTOMER_CREATED">Customer Created</option>
                      <option value="CUSTOMER_UPDATED">Customer Updated</option>
                      <option value="CUSTOMER_VIEWED">Customer Viewed</option>
                      <option value="CUSTOMER_ID_UPLOADED">ID Document Uploaded</option>
                      <option value="CUSTOMER_ID_VIEWED">ID Document Viewed</option>
                      <option value="TRANSACTION_CREATED">Transaction Created</option>
                      <option value="TRANSACTION_VIEWED">Transaction Viewed</option>
                      <option value="EXCHANGE_RATE_UPDATED">Exchange Rate Updated</option>
                      <option value="SETTINGS_CHANGED">Settings Changed</option>
                      <option value="REPORT_GENERATED">Report Generated</option>
                      <option value="SEARCH_PERFORMED">Search Performed</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="logSearch" className="block text-sm font-medium text-gray-700 mb-1">
                      Search
                    </label>
                    <input
                      id="logSearch"
                      type="text"
                      value={logFilter.search}
                      onChange={(e) => setLogFilter({ ...logFilter, search: e.target.value })}
                      placeholder="Search description, user email, or entity ID..."
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {loadingLogs ? (
                    <div className="p-8 text-center text-gray-600">Loading activity logs...</div>
                  ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-600">No activity logs found</div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Time
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                IP Address
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {logs.map((log) => (
                              <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatDate(log.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityTypeColor(log.type)}`}>
                                    {getActivityTypeLabel(log.type)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {log.userEmail || 'System'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {log.description}
                                  {log.entityType && log.entityId && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {log.entityType}: {log.entityId}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {log.ipAddress || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(logsPagination.page - 1) * logsPagination.limit + 1}</span> to{' '}
                            <span className="font-medium">
                              {Math.min(logsPagination.page * logsPagination.limit, logsPagination.totalCount)}
                            </span>{' '}
                            of <span className="font-medium">{logsPagination.totalCount}</span> results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                              onClick={() => setLogsPagination({ ...logsPagination, page: logsPagination.page - 1 })}
                              disabled={logsPagination.page === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ←
                            </button>
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              Page {logsPagination.page} of {logsPagination.totalPages}
                            </span>
                            <button
                              onClick={() => setLogsPagination({ ...logsPagination, page: logsPagination.page + 1 })}
                              disabled={logsPagination.page === logsPagination.totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              →
                            </button>
                          </nav>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="rounded-md bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    🔒 Security: Activity logs are only accessible to administrators and provide a complete audit trail of all system activities for compliance and security purposes.
                  </p>
                </div>
              </div>
            )}

            {/* Document Types Tab */}
            {activeTab === 'doctypes' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Types Management</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Add or remove ID document types that can be uploaded for customer verification
                  </p>
                </div>

                {/* Add New Document Type */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Add New Document Type</h3>
                  <form onSubmit={handleAddDocumentType} className="flex gap-3">
                    <input
                      type="text"
                      value={newDocType.label}
                      onChange={(e) => setNewDocType({ label: e.target.value })}
                      placeholder="e.g., Police Clearance, Utility Bill"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Add Type
                    </button>
                  </form>
                </div>

                {/* Messages */}
                {docTypeMessage && (
                  <div className="rounded-md bg-green-50 p-4">
                    <p className="text-sm text-green-800">{docTypeMessage}</p>
                  </div>
                )}
                {docTypeError && (
                  <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{docTypeError}</p>
                  </div>
                )}

                {/* Document Types List */}
                <div className="bg-white rounded-lg border border-gray-200">
                  {loadingDocTypes ? (
                    <div className="p-8 text-center text-gray-600">Loading document types...</div>
                  ) : documentTypes.length === 0 ? (
                    <div className="p-8 text-center text-gray-600">No document types found</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {documentTypes.map((docType) => (
                        <div key={docType.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-xl">📄</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{docType.label}</p>
                              <p className="text-xs text-gray-500">{docType.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {docType.isDefault && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Default
                              </span>
                            )}
                            {!docType.isDefault && (
                              <button
                                onClick={() => handleDeleteDocumentType(docType.id)}
                                className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-md bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    💡 Note: Default document types (Driver's License, Passport, etc.) cannot be deleted but can be deactivated. Custom document types can be removed completely.
                  </p>
                </div>
              </div>
            )}

            {/* Email Settings Tab */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Office 365 Email Integration</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure Office 365 (Microsoft 365) email settings to send automated emails for transaction confirmations, receipts, and notifications.
                  </p>
                </div>

                {loadingEmailSettings ? (
                  <div className="text-center py-12 text-gray-600">Loading email settings...</div>
                ) : (
                  <form onSubmit={handleSaveEmailSettings} className="space-y-6">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Enable Email Integration</h3>
                        <p className="text-xs text-gray-600 mt-1">Turn on to use Office 365 for sending emails</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailSettings.enabled}
                          onChange={(e) => setEmailSettings({ ...emailSettings, enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Azure AD App Registration Details */}
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">📋 Setup Instructions</h4>
                        <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                          <li>Go to Azure Portal → Azure Active Directory → App registrations</li>
                          <li>Create a new app registration or use an existing one</li>
                          <li>Add API permissions: Mail.Send (Application permission)</li>
                          <li>Create a client secret under "Certificates & secrets"</li>
                          <li>Copy the Application (client) ID, Directory (tenant) ID, and client secret value</li>
                          <li>Grant admin consent for the Mail.Send permission</li>
                        </ol>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tenant ID (Directory ID)
                        </label>
                        <input
                          type="text"
                          value={emailSettings.tenantId}
                          onChange={(e) => setEmailSettings({ ...emailSettings, tenantId: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 12345678-1234-1234-1234-123456789012"
                        />
                        <p className="mt-1 text-xs text-gray-500">Found in Azure AD → Overview</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Client ID (Application ID)
                        </label>
                        <input
                          type="text"
                          value={emailSettings.clientId}
                          onChange={(e) => setEmailSettings({ ...emailSettings, clientId: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 87654321-4321-4321-4321-210987654321"
                        />
                        <p className="mt-1 text-xs text-gray-500">Found in App registration → Overview</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Client Secret
                        </label>
                        <input
                          type="password"
                          value={emailSettings.clientSecret}
                          onChange={(e) => setEmailSettings({ ...emailSettings, clientSecret: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter client secret value"
                        />
                        <p className="mt-1 text-xs text-gray-500">Found in App registration → Certificates & secrets</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sender Email Address
                        </label>
                        <input
                          type="email"
                          value={emailSettings.senderEmail}
                          onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="noreply@yourdomain.com"
                        />
                        <p className="mt-1 text-xs text-gray-500">The email address that will send the emails</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sender Name
                        </label>
                        <input
                          type="text"
                          value={emailSettings.senderName}
                          onChange={(e) => setEmailSettings({ ...emailSettings, senderName: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="SFMTL Notifications"
                        />
                        <p className="mt-1 text-xs text-gray-500">The display name for outgoing emails</p>
                      </div>
                    </div>

                    {/* Messages */}
                    {emailMessage && (
                      <div className="rounded-md bg-green-50 p-4">
                        <p className="text-sm text-green-800">{emailMessage}</p>
                      </div>
                    )}

                    {emailError && (
                      <div className="rounded-md bg-red-50 p-4">
                        <p className="text-sm text-red-800">{emailError}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <button
                        type="submit"
                        disabled={savingEmailSettings}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {savingEmailSettings ? 'Saving...' : 'Save Settings'}
                      </button>
                      <button
                        type="button"
                        onClick={handleTestEmail}
                        disabled={testingEmail || !emailSettings.enabled || !emailSettings.senderEmail}
                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {testingEmail ? 'Sending...' : 'Send Test Email'}
                      </button>
                    </div>

                    {/* Security Note */}
                    <div className="rounded-md bg-yellow-50 p-4">
                      <p className="text-sm text-yellow-800">
                        🔒 Security: Client secrets are stored encrypted in the database. Only administrators can view and modify these settings.
                      </p>
                    </div>

                    {/* Use Cases */}
                    <div className="rounded-md bg-blue-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">📧 Email Use Cases</h4>
                      <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                        <li>Transaction receipts sent to customers</li>
                        <li>Transaction confirmations with details</li>
                        <li>Daily transaction summaries for staff</li>
                        <li>AML/PTR alerts and notifications</li>
                        <li>Customer welcome emails</li>
                        <li>Password reset emails</li>
                      </ul>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Agents & QR Codes Tab */}
            {activeTab === 'agents' && (
              <AgentsTab
                agents={agents}
                loadingAgents={loadingAgents}
                newAgent={newAgent}
                setNewAgent={setNewAgent}
                agentMessage={agentMessage}
                agentError={agentError}
                creatingAgent={creatingAgent}
                handleCreateAgent={handleCreateAgent}
                handleUpdateAgentStatus={handleUpdateAgentStatus}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
