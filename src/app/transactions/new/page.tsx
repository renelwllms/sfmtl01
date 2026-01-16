'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import FamilyContributionsTable from '@/components/FamilyContributionsTable';
import { useToast } from '@/contexts/ToastContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

// Simple inline upload component for Source of Funds
function SourceOfFundsUpload({ transactionId }: { transactionId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'SOURCE_OF_FUNDS');
      formData.append('description', 'Source of Funds Document');

      const response = await fetch(`/api/transactions/${transactionId}/documents`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Upload failed');
        setUploading(false);
        return;
      }

      setUploaded(true);
      setFile(null);
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (uploaded) {
    return (
      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-800">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">Source of Funds document uploaded successfully</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 mb-3">📄 Source of Funds Document</h4>
      <input
        type="file"
        accept="image/*,application/pdf,.doc,.docx"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
        disabled={uploading}
      />
      {file && (
        <p className="text-sm text-gray-600 mb-3">Selected: {file.name}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {uploading ? 'Uploading...' : 'Upload Source of Funds'}
      </button>
      <p className="text-xs text-gray-500 mt-2">
        Accepted: Bank statement, payslip, sale agreement, etc. (PDF, JPG, PNG, Word)
      </p>
    </div>
  );
}

// Simple inline upload component for Proof of Address
function ProofOfAddressUpload({ transactionId }: { transactionId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'PROOF_OF_ADDRESS');
      formData.append('description', 'Proof of Address Document');

      const response = await fetch(`/api/transactions/${transactionId}/documents`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Upload failed');
        setUploading(false);
        return;
      }

      setUploaded(true);
      setFile(null);
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (uploaded) {
    return (
      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-800">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">Proof of Address document uploaded successfully</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 mb-3">🏠 Proof of Address Document</h4>
      <input
        type="file"
        accept="image/*,application/pdf,.doc,.docx"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
        disabled={uploading}
      />
      {file && (
        <p className="text-sm text-gray-600 mb-3">Selected: {file.name}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {uploading ? 'Uploading...' : 'Upload Proof of Address'}
      </button>
      <p className="text-xs text-gray-500 mt-2">
        Accepted: Utility bill, bank statement, IRD letter, council rates, etc. (PDF, JPG, PNG, Word)
      </p>
    </div>
  );
}

function NewTransactionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');
  const agentCodeParam = searchParams.get('agentCode');
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(!!preselectedCustomerId);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [rates, setRates] = useState<any>(null);
  const [feeSettings, setFeeSettings] = useState<any>(null);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
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
  const [idFiles, setIdFiles] = useState<File[]>([]);
  const [idDocType, setIdDocType] = useState('DRIVERS_LICENSE');
  const [uploadingIds, setUploadingIds] = useState(false);
  const [selectedProofDocs, setSelectedProofDocs] = useState<string[]>([]);
  const [viewingDocUrl, setViewingDocUrl] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [agentContext, setAgentContext] = useState<{id: string; code: string; name: string; location?: string} | null>(null);
  const [transactionCreated, setTransactionCreated] = useState<{id: string; txnNumber: string} | null>(null);
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);
  const [sourceOfFundsFile, setSourceOfFundsFile] = useState<File | null>(null);
  const [proofOfAddressFile, setProofOfAddressFile] = useState<File | null>(null);
  const [familyContributions, setFamilyContributions] = useState<Array<{contributorName: string; amountNzdCents: number; relationship?: string}>>([]);

  const [formData, setFormData] = useState({
    customerId: '',
    // Beneficiary
    beneficiaryName: '',
    beneficiaryVillage: '',
    beneficiaryPhone: '',
    bank: '',
    accountNumber: '',
    accountName: '',
    // Sender (prefilled from customer)
    senderName: '',
    senderAddress: '',
    senderPhone: '',
    senderEmail: '',
    occupation: '',
    purposeOfTransfer: '',
    // Enhanced sender details for >= NZ$1,000
    senderStreetAddress: '',
    senderSuburb: '',
    senderCity: '',
    senderPostcode: '',
    senderHomePhone: '',
    senderMobilePhone: '',
    // Employment Details for >= NZ$1,000
    employerName: '',
    employerAddress: '',
    employerPhone: '',
    // Money
    amountNzd: '',
    feeNzd: '',
    rate: '',
    currency: 'WST' as 'WST' | 'AUD' | 'USD',
    // AML/KYC
    dob: '',
    verifiedWithOriginalId: false,
    proofOfAddressType: '' as '' | 'BILL' | 'BANK_STATEMENT' | 'IRD_LETTER' | 'GOVT_LETTER' | 'POWER_BILL' | 'WATER_BILL' | 'COUNCIL_RATES' | 'OTHER',
    sourceOfFunds: '' as '' | 'SALARY_WAGES' | 'SAVINGS' | 'LOAN_FUNDS' | 'SALE_OF_PROPERTY' | 'SELF_EMPLOYED' | 'FAMILY_CONTRIBUTIONS' | 'FUNDRAISING_RAFFLE' | 'OTHER',
    sourceOfFundsDetails: '',
    bankAccountDetails: '',
    proofDocumentsProvided: '',
    reasonForRemittance: '',
    relationshipToBeneficiary: '',
    id1CountryAndType: '',
    id1Number: '',
    id1IssueDate: '',
    id1ExpiryDate: '',
    id2CountryAndType: '',
    id2Number: '',
    id2IssueDate: '',
    id2ExpiryDate: ''
  });

  useEffect(() => {
    fetchRates();
    fetchFeeSettings();
    if (preselectedCustomerId) {
      fetchCustomer(preselectedCustomerId);
    }

    // Check if accessed via agent portal from URL parameter
    if (agentCodeParam) {
      fetchAgentByCode(agentCodeParam);
    } else {
      // Check sessionStorage as fallback
      const agentId = sessionStorage.getItem('agentId');
      const agentCode = sessionStorage.getItem('agentCode');
      const agentName = sessionStorage.getItem('agentName');
      const agentLocation = sessionStorage.getItem('agentLocation');
      if (agentId && agentCode && agentName) {
        setAgentContext({ id: agentId, code: agentCode, name: agentName, location: agentLocation || undefined });
      }
    }
  }, []);

  async function fetchAgentByCode(code: string) {
    try {
      const response = await fetch(`/api/agents/by-code/${code}`);
      if (response.ok) {
        const agent = await response.json();
        setAgentContext({
          id: agent.id,
          code: agent.agentCode,
          name: agent.name,
          location: agent.location || undefined
        });
      }
    } catch (err) {
      console.error('Failed to fetch agent by code');
    }
  }

  useEffect(() => {
    if (rates && rates.rates && formData.currency) {
      const rateKey = `NZD_${formData.currency}` as 'NZD_WST' | 'NZD_AUD' | 'NZD_USD';
      setFormData(prev => ({ ...prev, rate: rates.rates[rateKey].toString() }));
    }
  }, [formData.currency, rates]);

  // Auto-calculate fee when amount changes (for percentage-based and bracket-based fees)
  useEffect(() => {
    if (feeSettings && formData.amountNzd) {
      const amount = parseFloat(formData.amountNzd);
      if (!isNaN(amount) && amount > 0) {
        if (feeSettings.feeType === 'PERCENTAGE') {
          let calculatedFee = amount * (feeSettings.feePercentage / 100);

          // Apply minimum fee
          if (calculatedFee < feeSettings.minimumFeeNzd) {
            calculatedFee = feeSettings.minimumFeeNzd;
          }

          // Apply maximum fee if set
          if (feeSettings.maximumFeeNzd && calculatedFee > feeSettings.maximumFeeNzd) {
            calculatedFee = feeSettings.maximumFeeNzd;
          }

          setFormData(prev => ({
            ...prev,
            feeNzd: calculatedFee.toFixed(2)
          }));
        } else if (feeSettings.feeType === 'BRACKET') {
          // Calculate bracket-based fee
          calculateBracketFee(amount);
        }
      }
    }
  }, [formData.amountNzd, feeSettings]);

  async function fetchRates() {
    try {
      const response = await fetch('/api/exchange-rates');
      const data = await response.json();
      setRates(data);
    } catch (err) {
      console.error('Failed to fetch rates');
    }
  }

  async function fetchFeeSettings() {
    try {
      const response = await fetch('/api/fees/settings');
      const data = await response.json();
      setFeeSettings(data.settings);

      // Auto-populate fee if it's a fixed fee and fee field is empty
      if (data.settings && data.settings.feeType === 'FIXED' && !formData.feeNzd) {
        setFormData(prev => ({
          ...prev,
          feeNzd: data.settings.defaultFeeNzd.toFixed(2)
        }));
      } else if (data.settings && data.settings.feeType === 'BRACKET' && formData.amountNzd) {
        // Calculate fee based on bracket
        await calculateBracketFee(parseFloat(formData.amountNzd));
      }
    } catch (err) {
      console.error('Failed to fetch fee settings');
    }
  }

  async function calculateBracketFee(amountNzd: number) {
    try {
      console.log('Calculating bracket fee for amount:', amountNzd);
      const response = await fetch('/api/fees/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountNzd })
      });
      const data = await response.json();

      console.log('Fee calculation response:', data);

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          feeNzd: data.feeNzd.toFixed(2)
        }));
      } else {
        console.error('Fee calculation failed:', data);
      }
    } catch (err) {
      console.error('Failed to calculate bracket fee:', err);
    }
  }

  async function fetchCustomer(id: string) {
    setLoadingCustomer(true);
    try {
      const response = await fetch(`/api/customers/${id}`);
      if (response.ok) {
        const data = await response.json();
        const cust = data.customer;
        setCustomer(cust);
        setFormData(prev => ({
          ...prev,
          customerId: cust.id,
          senderName: cust.fullName,
          senderAddress: cust.address || '',
          senderPhone: cust.phone,
          senderEmail: cust.email || '',
          dob: cust.dob.split('T')[0],
          // Auto-populate enhanced AML fields from customer record
          senderStreetAddress: cust.streetAddress || '',
          senderSuburb: cust.suburb || '',
          senderCity: cust.city || '',
          senderPostcode: cust.postcode || '',
          senderHomePhone: cust.homePhone || '',
          senderMobilePhone: cust.mobilePhone || cust.phone,
          occupation: cust.occupation || '',
          employerName: cust.employerName || '',
          employerAddress: cust.employerAddress || '',
          employerPhone: cust.employerPhone || ''
        }));
      }
    } catch (err) {
      console.error('Failed to fetch customer');
    } finally {
      setLoadingCustomer(false);
    }
  }

  async function searchCustomers(term: string) {
    if (term.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      const response = await fetch(`/api/customers?search=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.customers || []);
        setShowResults(true);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  }

  async function selectCustomer(cust: any) {
    // If customer doesn't have IDs, fetch full customer details
    if (!cust.ids) {
      await fetchCustomer(cust.id);
    } else {
      setCustomer(cust);
      setFormData(prev => ({
        ...prev,
        customerId: cust.id,
        senderName: cust.fullName,
        senderAddress: cust.address || '',
        senderPhone: cust.phone,
        senderEmail: cust.email || '',
        dob: cust.dob.split('T')[0],
        // Auto-populate enhanced AML fields from customer record
        senderStreetAddress: cust.streetAddress || '',
        senderSuburb: cust.suburb || '',
        senderCity: cust.city || '',
        senderPostcode: cust.postcode || '',
        senderHomePhone: cust.homePhone || '',
        senderMobilePhone: cust.mobilePhone || cust.phone,
        occupation: cust.occupation || '',
        employerName: cust.employerName || '',
        employerAddress: cust.employerAddress || '',
        employerPhone: cust.employerPhone || ''
      }));
    }

    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    setError('');
  }

  async function searchCustomer(e: FormEvent) {
    e.preventDefault();
    if (!searchTerm || searchTerm.trim().length === 0) {
      setError('Please enter a search term');
      return;
    }

    // Clear any previous errors
    setError('');

    // If searchTerm is less than 2 characters, show error
    if (searchTerm.trim().length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    try {
      // Always use fuzzy search for better UX
      const response = await fetch(`/api/customers?search=${encodeURIComponent(searchTerm)}`);

      if (response.ok) {
        const data = await response.json();
        const customers = data.customers || [];

        if (customers.length === 0) {
          setError('No customers found');
          setCustomer(null);
          setSearchResults([]);
          setShowResults(false);
        } else if (customers.length === 1) {
          // If only one result, auto-select it
          selectCustomer(customers[0]);
        } else {
          // Show results dropdown if multiple matches
          setSearchResults(customers);
          setShowResults(true);
        }
      } else {
        setError('Customer not found');
        setCustomer(null);
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (err) {
      setError('Failed to search customer');
      setSearchResults([]);
      setShowResults(false);
    }
  }

  async function handleCreateCustomer(e: FormEvent) {
    e.preventDefault();
    setCreatingCustomer(true);
    setError('');

    // Validate that at least one ID file is uploaded
    if (idFiles.length === 0) {
      setError('Please upload at least one ID document');
      setCreatingCustomer(false);
      return;
    }

    try {
      // First, create the customer
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create customer');
        setCreatingCustomer(false);
        return;
      }

      const createdCustomer = data.customer;

      // Upload ID documents if any
      if (idFiles.length > 0) {
        setUploadingIds(true);
        for (const file of idFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('documentType', idDocType);

          await fetch(`/api/customers/${createdCustomer.id}/ids`, {
            method: 'POST',
            body: formData
          });
        }
        setUploadingIds(false);
      }

      toast.success(`Customer created successfully! ID: ${createdCustomer.customerId}`);

      // Fetch the customer with IDs included
      const custResponse = await fetch(`/api/customers/${createdCustomer.id}`);
      if (custResponse.ok) {
        const custData = await custResponse.json();
        selectCustomer(custData.customer);
      } else {
        selectCustomer(createdCustomer);
      }

      // Close modal and reset form
      setShowCreateCustomer(false);
      setNewCustomer({
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
      setIdFiles([]);
      setIdDocType('DRIVERS_LICENSE');
    } catch (err) {
      setError('An error occurred while creating customer');
    } finally {
      setCreatingCustomer(false);
      setUploadingIds(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setIdFiles(Array.from(e.target.files));
    }
  }

  function removeFile(index: number) {
    setIdFiles(files => files.filter((_, i) => i !== index));
  }

  function handleProofDocToggle(docType: string) {
    setSelectedProofDocs(prev => {
      const updated = prev.includes(docType)
        ? prev.filter(d => d !== docType)
        : [...prev, docType];

      // Update formData.proofDocumentsProvided with comma-separated list
      const proofDocsText = updated.map(type => type.replace(/_/g, ' ')).join(', ');
      setFormData(prevForm => ({ ...prevForm, proofDocumentsProvided: proofDocsText }));

      return updated;
    });
  }

  // Get available ID types from customer's uploaded documents
  const availableIdTypes = customer?.ids?.map((doc: any) => doc.documentType) || [];

  const totalPaidNzd = (parseFloat(formData.amountNzd || '0') + parseFloat(formData.feeNzd || '0')).toFixed(2);
  const totalForeign = (parseFloat(formData.amountNzd || '0') * parseFloat(formData.rate || '0')).toFixed(2);
  const requiresEnhancedAML = parseFloat(formData.amountNzd || '0') >= 1000;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        amountNzdCents: Math.round(parseFloat(formData.amountNzd) * 100),
        feeNzdCents: Math.round(parseFloat(formData.feeNzd) * 100),
        rate: parseFloat(formData.rate),
        totalPaidNzdCents: Math.round(parseFloat(totalPaidNzd) * 100),
        totalForeignReceived: parseFloat(totalForeign),
        // Convert empty strings to undefined for optional fields
        proofOfAddressType: formData.proofOfAddressType || undefined,
        sourceOfFunds: formData.sourceOfFunds || undefined,
        sourceOfFundsDetails: formData.sourceOfFundsDetails || undefined,
        bankAccountDetails: formData.bankAccountDetails || undefined,
        proofDocumentsProvided: formData.proofDocumentsProvided || undefined,
        reasonForRemittance: formData.reasonForRemittance || undefined,
        relationshipToBeneficiary: formData.relationshipToBeneficiary || undefined,
        senderStreetAddress: formData.senderStreetAddress || undefined,
        senderSuburb: formData.senderSuburb || undefined,
        senderCity: formData.senderCity || undefined,
        senderPostcode: formData.senderPostcode || undefined,
        senderHomePhone: formData.senderHomePhone || undefined,
        senderMobilePhone: formData.senderMobilePhone || undefined,
        employerName: formData.employerName || undefined,
        employerAddress: formData.employerAddress || undefined,
        employerPhone: formData.employerPhone || undefined,
        id1IssueDate: formData.id1IssueDate || undefined,
        id1ExpiryDate: formData.id1ExpiryDate || undefined,
        id2IssueDate: formData.id2IssueDate || undefined,
        id2ExpiryDate: formData.id2ExpiryDate || undefined
      };

      // Include agentId if this transaction is being created via agent portal
      const agentId = typeof window !== 'undefined' ? sessionStorage.getItem('agentId') : null;
      if (agentId) {
        (payload as any).agentId = agentId;
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setError(data.details.map((d: any) => d.message).join(', '));
        } else {
          setError(data.error || 'Failed to create transaction');
        }
        setLoading(false);
        return;
      }

      toast.success(`Transaction created successfully! TXN: ${data.transaction.txnNumber}`);

      const transactionId = data.transaction.id;
      const txnNumber = data.transaction.txnNumber;

      // Upload files and save family contributions if they were provided
      const uploadPromises = [];

      if (sourceOfFundsFile) {
        const formData = new FormData();
        formData.append('file', sourceOfFundsFile);
        formData.append('documentType', 'SOURCE_OF_FUNDS');
        formData.append('description', 'Source of Funds Document');

        uploadPromises.push(
          fetch(`/api/transactions/${transactionId}/documents`, {
            method: 'POST',
            body: formData
          })
        );
      }

      if (proofOfAddressFile) {
        const formData = new FormData();
        formData.append('file', proofOfAddressFile);
        formData.append('documentType', 'PROOF_OF_ADDRESS');
        formData.append('description', 'Proof of Address Document');

        uploadPromises.push(
          fetch(`/api/transactions/${transactionId}/documents`, {
            method: 'POST',
            body: formData
          })
        );
      }

      // Save family contributions if source of funds is FAMILY_CONTRIBUTIONS
      if (formData.sourceOfFunds === 'FAMILY_CONTRIBUTIONS' && familyContributions.length > 0) {
        for (const contribution of familyContributions) {
          uploadPromises.push(
            fetch(`/api/transactions/${transactionId}/family-contributions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(contribution)
            })
          );
        }
      }

      // Wait for all uploads to complete
      if (uploadPromises.length > 0) {
        try {
          await Promise.all(uploadPromises);
          toast.success('Documents uploaded successfully!');
        } catch (uploadErr) {
          console.error('Error uploading documents:', uploadErr);
          toast.error('Transaction created but some documents failed to upload');
        }
      }

      // Redirect to transactions list after successful creation
      setLoading(false);
      router.push('/transactions/list');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  // Show upload prompt after transaction creation
  if (showUploadPrompt && transactionCreated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
        <Navigation />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-xl p-8">
            {/* Success Message */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Transaction Created Successfully!</h1>
              <p className="text-lg text-gray-600 mb-1">Transaction Number:</p>
              <div className="bg-blue-50 p-3 rounded-lg inline-block mb-4">
                <p className="text-2xl font-bold text-blue-600">{transactionCreated.txnNumber}</p>
              </div>
            </div>

            {/* Upload Documents Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Upload Supporting Documents (Optional)
                    </h3>
                    <p className="text-sm text-blue-800 mb-3">
                      You can upload supporting documents for this transaction:
                    </p>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li><strong>Source of Funds</strong> - Bank statement, payslip, sale agreement, etc.</li>
                      <li><strong>Proof of Address</strong> - Utility bill, bank statement, IRD letter, council rates, etc.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* File Upload Inputs */}
              <div className="space-y-6">
                {/* Source of Funds Upload */}
                <SourceOfFundsUpload transactionId={transactionCreated.id} />

                {/* Proof of Address Upload */}
                <ProofOfAddressUpload transactionId={transactionCreated.id} />
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-3">
                <div className="flex gap-4">
                  <button
                    onClick={() => router.push('/transactions/list')}
                    className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
                  >
                    Skip - No Documents
                  </button>
                  <button
                    onClick={() => {
                      setShowUploadPrompt(false);
                      setTransactionCreated(null);
                      // Reset form to create another transaction
                      window.location.reload();
                    }}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Create Another Transaction
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  You can upload or manage documents later from the transaction details page
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Agent Context Banner */}
        {agentContext && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-blue-100">Agent Portal</div>
                  <div className="font-bold text-lg">{agentContext.name}</div>
                  <div className="text-xs text-blue-200">Code: {agentContext.code}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-100">All transactions will be</div>
                <div className="text-sm font-semibold">tracked to this agent</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">New Transaction</h1>

          {/* Loading Customer */}
          {loadingCustomer && !customer && (
            <div className="mb-6 pb-6 border-b">
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                  <p className="text-gray-600">Loading customer...</p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Search */}
          {!customer && !loadingCustomer && (
            <div className="mb-6 pb-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Select Customer</h2>
                <button
                  type="button"
                  onClick={() => setShowCreateCustomer(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                >
                  + Create New Customer
                </button>
              </div>
              <div className="relative">
                <form onSubmit={searchCustomer} className="flex gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        searchCustomers(e.target.value);
                      }}
                      placeholder="Search by name, phone, or customer ID..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {showResults && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((cust) => (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => selectCustomer(cust)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-semibold text-gray-900">{cust.fullName}</div>
                            <div className="text-sm text-gray-600">{cust.phone}</div>
                            <div className="text-xs text-gray-500">{cust.customerId}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Search
                  </button>
                </form>
                <p className="text-sm text-gray-500 mt-2">
                  Type to search by name, phone, or any part of customer ID. Press Enter or Search button if no results appear.
                </p>
              </div>
            </div>
          )}

          {customer && (
            <div className="mb-6 pb-6 border-b bg-blue-50 p-4 rounded-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.fullName}</h3>
                  <p className="text-sm text-gray-600">ID: {customer.customerId}</p>
                  <p className="text-sm text-gray-600">Phone: {customer.phone}</p>
                  {customer.email && <p className="text-sm text-gray-600">Email: {customer.email}</p>}
                </div>
                <button
                  onClick={() => { setCustomer(null); setFormData(prev => ({ ...prev, customerId: '' })); }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Change Customer
                </button>
              </div>

              {/* ID Documents */}
              {customer.ids && customer.ids.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Attached ID Documents ({customer.ids.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {customer.ids.map((doc: any) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setViewingDocUrl(`/api/customers/${customer.id}/ids/${doc.id}`)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 rounded-md hover:bg-blue-100 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-700">{doc.documentType.replace(/_/g, ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {customer && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Beneficiary Details */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Beneficiary Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Beneficiary Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.beneficiaryName}
                      onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Village</label>
                    <input
                      type="text"
                      value={formData.beneficiaryVillage}
                      onChange={(e) => setFormData({ ...formData, beneficiaryVillage: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={formData.beneficiaryPhone}
                      onChange={(e) => setFormData({ ...formData, beneficiaryPhone: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bank</label>
                    <input
                      type="text"
                      value={formData.bank}
                      onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Number</label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Account Name</label>
                    <input
                      type="text"
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Money */}
              <div className="space-y-4 bg-blue-50 p-4 rounded-md border-2 border-blue-200">
                <h2 className="text-lg font-semibold">Transaction Details</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="WST">WST (Samoa Tala)</option>
                      <option value="AUD">AUD (Australian Dollar)</option>
                      <option value="USD">USD (US Dollar)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Amount NZD <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amountNzd}
                      onChange={(e) => setFormData({ ...formData, amountNzd: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fee NZD <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.feeNzd}
                      onChange={(e) => setFormData({ ...formData, feeNzd: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Exchange Rate</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Paid NZD</label>
                    <input
                      type="text"
                      readOnly
                      value={`$${totalPaidNzd}`}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Foreign Received</label>
                    <input
                      type="text"
                      readOnly
                      value={`${totalForeign} ${formData.currency}`}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced AML Fields for >= NZ$1,000 */}
              {requiresEnhancedAML && (
                <div className="bg-orange-50 p-4 rounded-md border-2 border-orange-300">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-lg font-semibold text-orange-900">Enhanced AML Information Required (≥ NZ$1,000)</h2>
                  </div>

                  {/* Enhanced Sender Address */}
                  <div className="space-y-4 mb-4">
                    <h3 className="font-medium text-gray-900">Detailed Sender Address</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Street Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={requiresEnhancedAML}
                          value={formData.senderStreetAddress}
                          onChange={(e) => setFormData({ ...formData, senderStreetAddress: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Suburb <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={requiresEnhancedAML}
                          value={formData.senderSuburb}
                          onChange={(e) => setFormData({ ...formData, senderSuburb: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={requiresEnhancedAML}
                          value={formData.senderCity}
                          onChange={(e) => setFormData({ ...formData, senderCity: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Postcode <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={requiresEnhancedAML}
                          value={formData.senderPostcode}
                          onChange={(e) => setFormData({ ...formData, senderPostcode: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Home Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required={requiresEnhancedAML}
                          value={formData.senderHomePhone}
                          onChange={(e) => setFormData({ ...formData, senderHomePhone: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Mobile Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required={requiresEnhancedAML}
                          value={formData.senderMobilePhone}
                          onChange={(e) => setFormData({ ...formData, senderMobilePhone: e.target.value })}
                          placeholder={formData.senderPhone}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Employment Details */}
                  <div className="space-y-4 mb-4">
                    <h3 className="font-medium text-gray-900">Employment Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Employer Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={requiresEnhancedAML}
                          value={formData.employerName}
                          onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Employer Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required={requiresEnhancedAML}
                          value={formData.employerPhone}
                          onChange={(e) => setFormData({ ...formData, employerPhone: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Employer Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={requiresEnhancedAML}
                          value={formData.employerAddress}
                          onChange={(e) => setFormData({ ...formData, employerAddress: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Remittance Details */}
                  <div className="space-y-4 mb-4">
                    <h3 className="font-medium text-gray-900">Remittance & Personal Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Purpose of Transfer / Reason for Remittance <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={requiresEnhancedAML}
                          value={formData.reasonForRemittance || formData.purposeOfTransfer}
                          onChange={(e) => setFormData({ ...formData, reasonForRemittance: e.target.value, purposeOfTransfer: e.target.value })}
                          placeholder="e.g., Family support, Education, Medical expenses"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Relationship to Beneficiary <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={requiresEnhancedAML}
                          value={formData.relationshipToBeneficiary}
                          onChange={(e) => setFormData({ ...formData, relationshipToBeneficiary: e.target.value })}
                          placeholder="e.g., Parent, Sibling, Friend"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Occupation <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={requiresEnhancedAML}
                          value={formData.occupation}
                          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                          placeholder="e.g., Teacher, Builder, Self-employed"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Source of Funds */}
                  <div className="space-y-4 mb-4">
                    <h3 className="font-medium text-gray-900">Source of Funds</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Source of Funds <span className="text-red-500">*</span>
                        </label>
                        <select
                          required={requiresEnhancedAML}
                          value={formData.sourceOfFunds}
                          onChange={(e) => setFormData({ ...formData, sourceOfFunds: e.target.value as any })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Select...</option>
                          <option value="SALARY_WAGES">Salary/Wages</option>
                          <option value="SAVINGS">Savings</option>
                          <option value="LOAN_FUNDS">Loan Funds</option>
                          <option value="SALE_OF_PROPERTY">Sale of Property</option>
                          <option value="SELF_EMPLOYED">Self-Employed Income</option>
                          <option value="FAMILY_CONTRIBUTIONS">Family Contributions</option>
                          <option value="FUNDRAISING_RAFFLE">Fundraising/Raffle</option>
                          <option value="OTHER">Other</option>
                        </select>

                        {/* Source of Funds File Upload - Shows when option selected */}
                        {formData.sourceOfFunds && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              📄 Upload Source of Funds Document {requiresEnhancedAML ? <span className="text-red-500">*</span> : '(Optional)'}
                            </label>
                            <input
                              type="file"
                              required={requiresEnhancedAML}
                              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setSourceOfFundsFile(e.target.files[0]);
                                }
                              }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                            />
                            {sourceOfFundsFile && (
                              <p className="mt-1 text-xs text-green-600">✓ Selected: {sourceOfFundsFile.name}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              Accepted: PDF, Images (JPG, PNG), Word, Excel
                            </p>
                          </div>
                        )}

                        {/* Family Contributions Table - Shows when FAMILY_CONTRIBUTIONS is selected */}
                        {formData.sourceOfFunds === 'FAMILY_CONTRIBUTIONS' && (
                          <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">👨‍👩‍👧‍👦 Family Member Contributions</h4>
                            <p className="text-xs text-gray-600 mb-3">
                              Please list all family members who have contributed funds for this transaction.
                            </p>
                            <FamilyContributionsTable
                              contributions={familyContributions}
                              onContributionsChange={setFamilyContributions}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Source of Funds Details
                        </label>
                        <input
                          type="text"
                          value={formData.sourceOfFundsDetails}
                          onChange={(e) => setFormData({ ...formData, sourceOfFundsDetails: e.target.value })}
                          placeholder="Additional details if needed"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Bank Account Details
                        </label>
                        <input
                          type="text"
                          value={formData.bankAccountDetails}
                          onChange={(e) => setFormData({ ...formData, bankAccountDetails: e.target.value })}
                          placeholder="Account number"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Proof of Address Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          required={requiresEnhancedAML}
                          value={formData.proofOfAddressType}
                          onChange={(e) => setFormData({ ...formData, proofOfAddressType: e.target.value as any })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Select...</option>
                          <option value="POWER_BILL">Power Bill</option>
                          <option value="WATER_BILL">Water Bill</option>
                          <option value="COUNCIL_RATES">Council Rates</option>
                          <option value="BANK_STATEMENT">Bank Statement</option>
                          <option value="IRD_LETTER">IRD Letter</option>
                          <option value="GOVT_LETTER">Government Letter</option>
                          <option value="BILL">Utility Bill</option>
                          <option value="OTHER">Other</option>
                        </select>

                        {/* Proof of Address File Upload - Shows when option selected */}
                        {formData.proofOfAddressType && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              🏠 Upload Proof of Address Document {requiresEnhancedAML ? <span className="text-red-500">*</span> : '(Optional)'}
                            </label>
                            <input
                              type="file"
                              required={requiresEnhancedAML}
                              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setProofOfAddressFile(e.target.files[0]);
                                }
                              }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                            />
                            {proofOfAddressFile && (
                              <p className="mt-1 text-xs text-green-600">✓ Selected: {proofOfAddressFile.name}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              Accepted: PDF, Images (JPG, PNG), Word, Excel
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ID Documents Provided <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-md border border-gray-200">
                          {['DRIVERS_LICENSE', 'PASSPORT', 'NATIONAL_ID', 'BANK_CARD', 'BIRTH_CERTIFICATE', 'OTHER'].map((idType) => {
                            const isAvailable = availableIdTypes.includes(idType);
                            const isChecked = selectedProofDocs.includes(idType);
                            const label = idType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

                            return (
                              <div key={idType} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`proof-${idType}`}
                                  checked={isChecked}
                                  disabled={!isAvailable}
                                  onChange={() => handleProofDocToggle(idType)}
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                />
                                <label
                                  htmlFor={`proof-${idType}`}
                                  className={`ml-2 text-sm ${isAvailable ? 'text-gray-900 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
                                >
                                  {label}
                                  {isAvailable && <span className="ml-1 text-green-600">✓</span>}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                        <input
                          type="hidden"
                          required={requiresEnhancedAML}
                          value={formData.proofDocumentsProvided}
                        />
                        {requiresEnhancedAML && selectedProofDocs.length === 0 && (
                          <p className="mt-1 text-sm text-red-600">Please select at least one ID document</p>
                        )}
                        {availableIdTypes.length === 0 && (
                          <p className="mt-2 text-sm text-amber-600">⚠️ No ID documents uploaded for this customer</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Standard Additional Details (only shown for < NZ$1,000) */}
              {!requiresEnhancedAML && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Additional Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Occupation</label>
                      <input
                        type="text"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Purpose of Transfer</label>
                      <input
                        type="text"
                        value={formData.purposeOfTransfer}
                        onChange={(e) => setFormData({ ...formData, purposeOfTransfer: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Source of Funds</label>
                      <select
                        value={formData.sourceOfFunds}
                        onChange={(e) => setFormData({ ...formData, sourceOfFunds: e.target.value as any })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select...</option>
                        <option value="SALARY_WAGES">Salary/Wages</option>
                        <option value="SAVINGS">Savings</option>
                        <option value="LOAN_FUNDS">Loan Funds</option>
                        <option value="SALE_OF_PROPERTY">Sale of Property</option>
                        <option value="SELF_EMPLOYED">Self-Employed Income</option>
                        <option value="FAMILY_CONTRIBUTIONS">Family Contributions</option>
                        <option value="FUNDRAISING_RAFFLE">Fundraising/Raffle</option>
                        <option value="OTHER">Other</option>
                      </select>

                      {/* Source of Funds File Upload - Shows when option selected */}
                      {formData.sourceOfFunds && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            📄 Upload Source of Funds Document {requiresEnhancedAML ? <span className="text-red-500">*</span> : '(Optional)'}
                          </label>
                          <input
                            type="file"
                            required={requiresEnhancedAML}
                            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setSourceOfFundsFile(e.target.files[0]);
                              }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                          />
                          {sourceOfFundsFile && (
                            <p className="mt-1 text-xs text-green-600">✓ Selected: {sourceOfFundsFile.name}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Accepted: PDF, Images (JPG, PNG), Word, Excel
                          </p>
                        </div>
                      )}

                      {/* Family Contributions Table - Shows when FAMILY_CONTRIBUTIONS is selected */}
                      {formData.sourceOfFunds === 'FAMILY_CONTRIBUTIONS' && (
                        <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">👨‍👩‍👧‍👦 Family Member Contributions</h4>
                          <p className="text-xs text-gray-600 mb-3">
                            Please list all family members who have contributed funds for this transaction.
                          </p>
                          <FamilyContributionsTable
                            contributions={familyContributions}
                            onContributionsChange={setFamilyContributions}
                          />
                        </div>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Proof of Address</label>
                      <select
                        value={formData.proofOfAddressType}
                        onChange={(e) => setFormData({ ...formData, proofOfAddressType: e.target.value as any })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select...</option>
                        <option value="POWER_BILL">Power Bill</option>
                        <option value="WATER_BILL">Water Bill</option>
                        <option value="COUNCIL_RATES">Council Rates</option>
                        <option value="BANK_STATEMENT">Bank Statement</option>
                        <option value="IRD_LETTER">IRD Letter</option>
                        <option value="GOVT_LETTER">Government Letter</option>
                        <option value="BILL">Utility Bill</option>
                        <option value="OTHER">Other</option>
                      </select>

                      {/* Proof of Address File Upload - Shows when option selected */}
                      {formData.proofOfAddressType && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            🏠 Upload Proof of Address Document {requiresEnhancedAML ? <span className="text-red-500">*</span> : '(Optional)'}
                          </label>
                          <input
                            type="file"
                            required={requiresEnhancedAML}
                            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setProofOfAddressFile(e.target.files[0]);
                              }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                          />
                          {proofOfAddressFile && (
                            <p className="mt-1 text-xs text-green-600">✓ Selected: {proofOfAddressFile.name}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Accepted: PDF, Images (JPG, PNG), Word, Excel
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Verification */}
              <div className="flex items-center">
                <input
                  id="verified"
                  type="checkbox"
                  checked={formData.verifiedWithOriginalId}
                  onChange={(e) => setFormData({ ...formData, verifiedWithOriginalId: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="verified" className="ml-2 text-sm text-gray-700">
                  Verified with original ID
                </label>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating Transaction...' : 'Create Transaction'}
                </button>
                <a
                  href="/"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </a>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Create Customer Modal */}
      {showCreateCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center py-8">
          <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Customer</h3>
              <button
                onClick={() => {
                  setShowCreateCustomer(false);
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={selectedDate}
                    onChange={(newValue) => {
                      setSelectedDate(newValue);
                      if (newValue) {
                        setNewCustomer({ ...newCustomer, dob: newValue.format('YYYY-MM-DD') });
                      }
                    }}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        required: true,
                        fullWidth: true,
                        size: 'small',
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                          }
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Phone & Address Details */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Phone & Address Details</h4>
                <p className="text-xs text-gray-600 mb-4">These fields will be auto-filled for transactions</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Home Phone
                    </label>
                    <input
                      type="tel"
                      value={newCustomer.homePhone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, homePhone: e.target.value })}
                      placeholder="+64212345678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={newCustomer.mobilePhone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, mobilePhone: e.target.value })}
                      placeholder="+64212345678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={newCustomer.streetAddress}
                      onChange={(e) => setNewCustomer({ ...newCustomer, streetAddress: e.target.value, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Suburb
                    </label>
                    <input
                      type="text"
                      value={newCustomer.suburb}
                      onChange={(e) => setNewCustomer({ ...newCustomer, suburb: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={newCustomer.city}
                      onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postcode
                    </label>
                    <input
                      type="text"
                      value={newCustomer.postcode}
                      onChange={(e) => setNewCustomer({ ...newCustomer, postcode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Employment Details (Optional)</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={newCustomer.occupation}
                      onChange={(e) => setNewCustomer({ ...newCustomer, occupation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employer Name
                    </label>
                    <input
                      type="text"
                      value={newCustomer.employerName}
                      onChange={(e) => setNewCustomer({ ...newCustomer, employerName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employer Address
                    </label>
                    <input
                      type="text"
                      value={newCustomer.employerAddress}
                      onChange={(e) => setNewCustomer({ ...newCustomer, employerAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employer Phone
                    </label>
                    <input
                      type="tel"
                      value={newCustomer.employerPhone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, employerPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* ID Document Upload */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Document <span className="text-red-500">*</span>
                </label>

                <div className="mb-3">
                  <select
                    value={idDocType}
                    onChange={(e) => setIdDocType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="NATIONAL_ID">National ID</option>
                    <option value="BANK_CARD">Bank Card</option>
                    <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  {/* Camera Capture Button (Mobile) */}
                  <label className="flex-1 cursor-pointer">
                    <div className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center text-sm font-medium">
                      📷 Take Photo
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                      multiple
                    />
                  </label>

                  {/* File Upload Button */}
                  <label className="flex-1 cursor-pointer">
                    <div className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-center text-sm font-medium">
                      📁 Choose File
                    </div>
                    <input
                      type="file"
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                      multiple
                    />
                  </label>
                </div>

                {/* Selected Files Preview */}
                {idFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {idFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  📱 On mobile: Use "Take Photo" to capture ID with camera
                </p>

                {idFiles.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">⚠️ At least one ID document is required</p>
                )}
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-808">{error}</p>
                </div>
              )}

              {uploadingIds && (
                <div className="rounded-md bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">Uploading ID documents...</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creatingCustomer}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {creatingCustomer ? 'Creating...' : 'Create Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateCustomer(false);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDocUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
          onClick={() => setViewingDocUrl(null)}
        >
          <div
            className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">ID Document</h3>
              <button
                onClick={() => setViewingDocUrl(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Image Content */}
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)] flex items-center justify-center bg-gray-100">
              <img
                src={viewingDocUrl}
                alt="ID Document"
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-gray-600">Loading...</div></div>}>
      <NewTransactionPageContent />
    </Suspense>
  );
}
