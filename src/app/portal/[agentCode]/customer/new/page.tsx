'use client';

import { useState, useEffect, FormEvent } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Agent {
  id: string;
  agentCode: string;
  name: string;
  location: string | null;
}

interface DocumentType {
  id: string;
  name: string;
  label: string;
  isDefault: boolean;
  isActive: boolean;
  order: number;
}

export default function AgentNewCustomerPage({ params }: { params: Promise<{ agentCode: string }> }) {
  const resolvedParams = use(params);
  const { agentCode } = resolvedParams;
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string>('DRIVERS_LICENSE');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [idFiles, setIdFiles] = useState<Array<{ file: File; documentType: string }>>([]);
  const [uploadingIds, setUploadingIds] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    address: '',
    streetAddress: '',
    suburb: '',
    city: '',
    postcode: '',
    homePhone: '',
    mobilePhone: '',
    occupation: '',
    employerName: '',
    employerAddress: '',
    employerPhone: ''
  });

  useEffect(() => {
    fetchAgent();
    fetchDocumentTypes();
  }, [agentCode]);

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/by-code/${agentCode}`);
      if (response.ok) {
        const data = await response.json();
        setAgent(data);
      }
    } catch (error) {
      console.error('Error fetching agent:', error);
    }
  };

  async function fetchDocumentTypes() {
    try {
      const response = await fetch('/api/public/document-types');
      if (response.ok) {
        const data = await response.json();
        setDocumentTypes(data.documentTypes);
        if (data.documentTypes.length > 0) {
          setSelectedDocType(data.documentTypes[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch document types:', error);
    }
  }

  function handleDateChange(date: Date | null) {
    setSelectedDate(date);
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setFormData({ ...formData, dob: `${year}-${month}-${day}` });
    } else {
      setFormData({ ...formData, dob: '' });
    }
  }

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setIdFiles([...idFiles, { file, documentType: selectedDocType }]);
    }
    e.target.value = '';
  }

  function handleFileRemove(index: number) {
    setIdFiles(idFiles.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setValidationErrors([]);

    if (idFiles.length === 0) {
      setError('Please upload at least one ID document');
      return;
    }

    setLoading(true);

    try {
      // Create customer first
      const response = await fetch('/api/public/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          agentId: agent?.id // Associate customer with this agent
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError(`Customer with this phone number already exists. Customer ID: ${data.customer?.customerId}`);
        } else if (response.status === 400 && data.details) {
          const errors = data.details.map((err: any) => {
            const fieldName = err.path.join('.') || 'Unknown field';
            const friendlyFieldName = fieldName
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str: string) => str.toUpperCase())
              .trim();
            return `${friendlyFieldName}: ${err.message}`;
          });
          setValidationErrors(errors);
          setError('Please fix the following errors:');
        } else if (data.message) {
          setError(data.message);
        } else {
          setError(data.error || 'Failed to create customer');
        }
        setLoading(false);
        return;
      }

      const customerId = data.customer.id;

      // Upload ID documents
      if (idFiles.length > 0) {
        setUploadingIds(true);
        for (const { file, documentType } of idFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('documentType', documentType);

          await fetch(`/api/public/customers/${customerId}/ids`, {
            method: 'POST',
            body: formData
          });
        }
        setUploadingIds(false);
      }

      // Redirect to agent's public transaction creation with this customer pre-selected
      router.push(`/portal/${agentCode}/transaction/create?customerId=${customerId}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/portal/${agentCode}`)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Portal
          </button>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">New Customer Registration</h1>
            {agent && (
              <p className="text-gray-600">
                {agent.name} {agent.location && `• ${agent.location}`}
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Must be 18 or older)</span>
                </label>
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  dateFormat="dd/MM/yyyy"
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  yearDropdownItemNumber={100}
                  scrollableYearDropdown
                  maxDate={new Date()}
                  placeholderText="Select date of birth"
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  wrapperClassName="w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Phone & Address Details (AML Compliant) */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Phone & Address Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Home Phone
                </label>
                <input
                  type="tel"
                  value={formData.homePhone}
                  onChange={(e) => setFormData({ ...formData, homePhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                  placeholder="+6495551234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Phone <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(E.164 format)</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.mobilePhone}
                  onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                  placeholder="+6421234567"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value, address: `${e.target.value}, ${formData.suburb}, ${formData.city} ${formData.postcode}`.trim() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                  placeholder="123 Main Street"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suburb
                </label>
                <input
                  type="text"
                  value={formData.suburb}
                  onChange={(e) => setFormData({ ...formData, suburb: e.target.value, address: `${formData.streetAddress}, ${e.target.value}, ${formData.city} ${formData.postcode}`.trim() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                  placeholder="Mt Eden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value, address: `${formData.streetAddress}, ${formData.suburb}, ${e.target.value} ${formData.postcode}`.trim() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                  placeholder="Auckland"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode
                </label>
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value, address: `${formData.streetAddress}, ${formData.suburb}, ${formData.city} ${e.target.value}`.trim() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                  placeholder="1024"
                />
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occupation
                </label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                  placeholder="e.g., Teacher, Builder, Self-employed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employer Name
                </label>
                <input
                  type="text"
                  value={formData.employerName}
                  onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                  placeholder="Company name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employer Address
                </label>
                <input
                  type="text"
                  value={formData.employerAddress}
                  onChange={(e) => setFormData({ ...formData, employerAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                  placeholder="Employer's full address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employer Phone
                </label>
                <input
                  type="tel"
                  value={formData.employerPhone}
                  onChange={(e) => setFormData({ ...formData, employerPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                  placeholder="+6495551234"
                />
              </div>
            </div>
          </div>

          {/* ID Document Upload */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                ID Documents <span className="text-red-500">*</span>
              </h2>
              {idFiles.length === 0 && (
                <span className="text-sm text-red-600 font-medium">⚠ At least one ID required</span>
              )}
            </div>

            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  >
                    {documentTypes.length === 0 ? (
                      <>
                        <option value="DRIVERS_LICENSE">Driver's License</option>
                        <option value="PASSPORT">Passport</option>
                        <option value="NATIONAL_ID">National ID</option>
                        <option value="BANK_CARD">Bank Card</option>
                        <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
                        <option value="OTHER">Other</option>
                      </>
                    ) : (
                      documentTypes.map((docType) => (
                        <option key={docType.id} value={docType.name}>
                          {docType.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileAdd}
                    disabled={loading}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      file:cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {idFiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Uploaded Documents</h3>
                {idFiles.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-1">
                        {item.documentType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <p className="text-sm font-medium text-gray-900">{item.file.name}</p>
                      <p className="text-xs text-gray-500">{(item.file.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFileRemove(index)}
                      disabled={loading}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Messages */}
          {(error || validationErrors.length > 0) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">{error}</h3>
              {validationErrors.length > 0 && (
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  {validationErrors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <button
              type="submit"
              disabled={loading || uploadingIds}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
            >
              {uploadingIds ? 'Uploading Documents...' : loading ? 'Creating Customer...' : 'Create Customer & Continue to Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
