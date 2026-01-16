'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DocumentType {
  id: string;
  name: string;
  label: string;
  isDefault: boolean;
  isActive: boolean;
  order: number;
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    address: '',
    // Enhanced AML fields
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [idFiles, setIdFiles] = useState<Array<{ file: File; documentType: string }>>([]);
  const [uploadingIds, setUploadingIds] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string>('DRIVERS_LICENSE');

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  async function fetchDocumentTypes() {
    try {
      const response = await fetch('/api/document-types');
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setValidationErrors([]);

    // Validate that at least one ID document is uploaded
    if (idFiles.length === 0) {
      setError('Please upload at least one ID document');
      return;
    }

    setLoading(true);

    try {
      // Create customer first
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError(`Customer with this phone number already exists. Customer ID: ${data.customer?.customerId}`);
        } else if (response.status === 400 && data.details) {
          // Validation errors - show them in a list format
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

      // Upload ID documents if any
      if (idFiles.length > 0) {
        setUploadingIds(true);
        for (const { file, documentType } of idFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('documentType', documentType);

          await fetch(`/api/customers/${customerId}/ids`, {
            method: 'POST',
            body: formData
          });
        }
        setUploadingIds(false);
      }

      // Redirect to customer detail page
      router.push(`/customers/${customerId}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
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

  function handleDocumentTypeChange(index: number, documentType: string) {
    const updated = [...idFiles];
    updated[index].documentType = documentType;
    setIdFiles(updated);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">New Customer Registration</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  wrapperClassName="w-full"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Phone & Address Information */}
            <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Phone & Address Information</h2>
                <p className="text-sm text-gray-600 mt-1">These details will auto-populate in the AML form for transactions</p>
              </div>

              {/* Phone Numbers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="homePhone" className="block text-sm font-medium text-gray-700">
                    Home Phone
                  </label>
                  <input
                    id="homePhone"
                    type="tel"
                    placeholder="+6421234567"
                    value={formData.homePhone}
                    onChange={(e) => setFormData({ ...formData, homePhone: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="mobilePhone" className="block text-sm font-medium text-gray-700">
                    Mobile Phone <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">(E.164 format, e.g., +6421234567)</span>
                  </label>
                  <input
                    id="mobilePhone"
                    type="tel"
                    required
                    placeholder="+6421234567"
                    value={formData.mobilePhone}
                    onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Address Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700">
                    Street Address
                  </label>
                  <input
                    id="streetAddress"
                    type="text"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value, address: `${e.target.value}, ${formData.suburb}, ${formData.city} ${formData.postcode}`.trim() })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="suburb" className="block text-sm font-medium text-gray-700">
                    Suburb
                  </label>
                  <input
                    id="suburb"
                    type="text"
                    value={formData.suburb}
                    onChange={(e) => setFormData({ ...formData, suburb: e.target.value, address: `${formData.streetAddress}, ${e.target.value}, ${formData.city} ${formData.postcode}`.trim() })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value, address: `${formData.streetAddress}, ${formData.suburb}, ${e.target.value} ${formData.postcode}`.trim() })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="postcode" className="block text-sm font-medium text-gray-700">
                    Postcode
                  </label>
                  <input
                    id="postcode"
                    type="text"
                    value={formData.postcode}
                    onChange={(e) => setFormData({ ...formData, postcode: e.target.value, address: `${formData.streetAddress}, ${formData.suburb}, ${formData.city} ${e.target.value}`.trim() })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Employment Details */}
              <div className="border-t border-blue-300 pt-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Employment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">
                      Occupation
                    </label>
                    <input
                      id="occupation"
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="employerName" className="block text-sm font-medium text-gray-700">
                      Employer Name
                    </label>
                    <input
                      id="employerName"
                      type="text"
                      value={formData.employerName}
                      onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="employerAddress" className="block text-sm font-medium text-gray-700">
                      Employer Address
                    </label>
                    <input
                      id="employerAddress"
                      type="text"
                      value={formData.employerAddress}
                      onChange={(e) => setFormData({ ...formData, employerAddress: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="employerPhone" className="block text-sm font-medium text-gray-700">
                      Employer Phone
                    </label>
                    <input
                      id="employerPhone"
                      type="tel"
                      value={formData.employerPhone}
                      onChange={(e) => setFormData({ ...formData, employerPhone: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ID Document Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  ID Documents <span className="text-red-500">*</span>
                </h2>
                {idFiles.length === 0 && (
                  <span className="text-sm text-red-600 font-medium">⚠ At least one ID document required</span>
                )}
              </div>
              <p className="text-sm text-gray-600">Select document type and upload the corresponding file</p>

              {/* Document Type Selection and File Upload */}
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Document Type Selector */}
                  <div>
                    <label htmlFor="docType" className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="docType"
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                      disabled={loading}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload File <span className="text-red-500">*</span>
                    </label>
                    <label className="block cursor-pointer">
                      <span className="sr-only">Choose file</span>
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
                          file:cursor-pointer
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Accepts images and PDF files</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Files List */}
              {idFiles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Uploaded Documents</h3>
                  {idFiles.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">📄</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.documentType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">{item.file.name}</p>
                        <p className="text-xs text-gray-500">{(item.file.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileRemove(index)}
                        disabled={loading}
                        className="flex-shrink-0 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(error || validationErrors.length > 0) && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    {validationErrors.length > 0 && (
                      <div className="mt-2 text-sm text-red-700">
                        <ul className="list-disc list-inside space-y-1">
                          {validationErrors.map((err, index) => (
                            <li key={index}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || uploadingIds}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploadingIds ? 'Uploading Documents...' : loading ? 'Creating Customer...' : 'Create Customer'}
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
