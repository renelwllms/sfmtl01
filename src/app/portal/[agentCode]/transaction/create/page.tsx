'use client';

import { useState, useEffect, FormEvent } from 'react';
import { use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
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

      const response = await fetch(`/api/public/transactions/${transactionId}/documents`, {
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
      <h4 className="font-semibold text-gray-900 mb-3">📄 Source of Funds Document (Optional)</h4>
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

      const response = await fetch(`/api/public/transactions/${transactionId}/documents`, {
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
      <h4 className="font-semibold text-gray-900 mb-3">🏠 Proof of Address Document (Optional)</h4>
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

interface Agent {
  id: string;
  agentCode: string;
  name: string;
  location: string | null;
}

export default function AgentCreateTransactionPage({ params }: { params: Promise<{ agentCode: string }> }) {
  const resolvedParams = use(params);
  const { agentCode } = resolvedParams;
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');

  const [agent, setAgent] = useState<Agent | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(!!customerId);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Array<{field: string; message: string}>>([]);
  const [rates, setRates] = useState<any>(null);
  const [feeSettings, setFeeSettings] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionNumber, setTransactionNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [selectedProofDocs, setSelectedProofDocs] = useState<string[]>([]);
  const [sourceOfFundsFile, setSourceOfFundsFile] = useState<File | null>(null);
  const [proofOfAddressFile, setProofOfAddressFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    // Beneficiary
    beneficiaryName: '',
    beneficiaryVillage: '',
    beneficiaryPhone: '',
    bank: '',
    accountNumber: '',
    accountName: '',
    // Money
    amountNzd: '',
    feeNzd: '',
    rate: '',
    currency: 'WST' as 'WST' | 'AUD' | 'USD',
    // AML/KYC
    verifiedWithOriginalId: false,
    proofOfAddressType: '' as '' | 'BILL' | 'BANK_STATEMENT' | 'IRD_LETTER' | 'GOVT_LETTER' | 'POWER_BILL' | 'WATER_BILL' | 'COUNCIL_RATES' | 'OTHER',
    sourceOfFunds: '' as '' | 'SALARY_WAGES' | 'SAVINGS' | 'LOAN_FUNDS' | 'SALE_OF_PROPERTY' | 'SELF_EMPLOYED' | 'FAMILY_CONTRIBUTIONS' | 'FUNDRAISING_RAFFLE' | 'OTHER',
    sourceOfFundsDetails: '',
    purposeOfTransfer: '',
    reasonForRemittance: '',
    relationshipToBeneficiary: '',
    // Enhanced AML fields for >= NZ$1,000
    senderStreetAddress: '',
    senderSuburb: '',
    senderCity: '',
    senderPostcode: '',
    senderHomePhone: '',
    senderMobilePhone: '',
    occupation: '',
    employerName: '',
    employerAddress: '',
    employerPhone: '',
    bankAccountDetails: '',
    proofDocumentsProvided: ''
  });

  useEffect(() => {
    fetchAgent();
    fetchRates();
    fetchFeeSettings();
    if (customerId) {
      fetchCustomer(customerId);
    }
  }, [agentCode, customerId]);

  useEffect(() => {
    if (rates && rates.rates && formData.currency) {
      const rateKey = `NZD_${formData.currency}` as 'NZD_WST' | 'NZD_AUD' | 'NZD_USD';
      setFormData(prev => ({ ...prev, rate: rates.rates[rateKey].toString() }));
    }
  }, [formData.currency, rates]);

  useEffect(() => {
    // Calculate fee using the fee calculate API
    if (formData.amountNzd) {
      const amount = parseFloat(formData.amountNzd);
      if (!isNaN(amount) && amount > 0) {
        calculateFee(amount);
      }
    }
  }, [formData.amountNzd]);

  async function calculateFee(amountNzd: number) {
    try {
      const response = await fetch('/api/public/fees/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountNzd })
      });
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, feeNzd: data.feeNzd.toFixed(2) }));
      }
    } catch (error) {
      console.error('Failed to calculate fee:', error);
    }
  }

  // Scroll to error section when errors appear
  useEffect(() => {
    if (error || validationErrors.length > 0) {
      const errorSection = document.getElementById('error-section');
      if (errorSection) {
        errorSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [error, validationErrors]);

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

  const fetchCustomer = async (id: string) => {
    setLoadingCustomer(true);
    try {
      const response = await fetch(`/api/public/customers/${id}`);
      if (response.ok) {
        const data = await response.json();
        const cust = data.customer;
        setCustomer(cust);

        // Auto-populate Enhanced AML fields from customer record
        setFormData(prev => ({
          ...prev,
          senderStreetAddress: cust.streetAddress || '',
          senderSuburb: cust.suburb || '',
          senderCity: cust.city || '',
          senderPostcode: cust.postcode || '',
          senderHomePhone: cust.homePhone || '',
          senderMobilePhone: cust.mobilePhone || cust.phone || '',
          occupation: cust.occupation || '',
          employerName: cust.employerName || '',
          employerAddress: cust.employerAddress || '',
          employerPhone: cust.employerPhone || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoadingCustomer(false);
    }
  };

  async function fetchRates() {
    try {
      const response = await fetch('/api/public/exchange-rates');
      const data = await response.json();
      setRates(data);
    } catch (err) {
      console.error('Failed to fetch rates');
    }
  }

  async function fetchFeeSettings() {
    try {
      const response = await fetch('/api/public/fees/settings');
      const data = await response.json();
      setFeeSettings(data.settings);

      if (data.settings && data.settings.feeType === 'FIXED' && !formData.feeNzd) {
        setFormData(prev => ({
          ...prev,
          feeNzd: data.settings.defaultFeeNzd.toFixed(2)
        }));
      }
    } catch (err) {
      console.error('Failed to fetch fee settings');
    }
  }

  const calculateTotals = () => {
    const amount = parseFloat(formData.amountNzd) || 0;
    const fee = parseFloat(formData.feeNzd) || 0;
    const rate = parseFloat(formData.rate) || 0;
    const totalPaid = amount + fee;
    const foreignReceived = amount * rate;
    return { totalPaid, foreignReceived };
  };

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setValidationErrors([]);
    setLoading(true);

    try {
      if (!customer) {
        setError('Customer not found');
        setLoading(false);
        return;
      }

      const { totalPaid, foreignReceived } = calculateTotals();

      const payload = {
        customerId: customer.id,
        agentId: agent?.id,
        beneficiaryName: formData.beneficiaryName,
        beneficiaryVillage: formData.beneficiaryVillage || undefined,
        beneficiaryPhone: formData.beneficiaryPhone || undefined,
        bank: formData.bank || undefined,
        accountNumber: formData.accountNumber || undefined,
        accountName: formData.accountName || undefined,
        senderName: customer.fullName,
        senderAddress: customer.address || '',
        senderPhone: customer.phone,
        senderEmail: customer.email || '',
        senderStreetAddress: formData.senderStreetAddress || customer.streetAddress || undefined,
        senderSuburb: formData.senderSuburb || customer.suburb || undefined,
        senderCity: formData.senderCity || customer.city || undefined,
        senderPostcode: formData.senderPostcode || customer.postcode || undefined,
        senderHomePhone: formData.senderHomePhone || customer.homePhone || undefined,
        senderMobilePhone: formData.senderMobilePhone || customer.mobilePhone || customer.phone,
        occupation: formData.occupation || customer.occupation || undefined,
        employerName: formData.employerName || customer.employerName || undefined,
        employerAddress: formData.employerAddress || customer.employerAddress || undefined,
        employerPhone: formData.employerPhone || customer.employerPhone || undefined,
        purposeOfTransfer: formData.purposeOfTransfer || undefined,
        reasonForRemittance: formData.reasonForRemittance || undefined,
        relationshipToBeneficiary: formData.relationshipToBeneficiary || undefined,
        bankAccountDetails: formData.bankAccountDetails || undefined,
        amountNzdCents: Math.round(parseFloat(formData.amountNzd) * 100),
        feeNzdCents: Math.round(parseFloat(formData.feeNzd) * 100),
        rate: parseFloat(formData.rate),
        currency: formData.currency,
        totalPaidNzdCents: Math.round(totalPaid * 100),
        totalForeignReceived: foreignReceived,
        dob: customer.dob.split('T')[0],
        verifiedWithOriginalId: formData.verifiedWithOriginalId,
        proofOfAddressType: formData.proofOfAddressType || undefined,
        sourceOfFunds: formData.sourceOfFunds || undefined,
        sourceOfFundsDetails: formData.sourceOfFundsDetails || undefined,
        proofDocumentsProvided: formData.proofDocumentsProvided || undefined,
        id1CountryAndType: undefined,
        id1Number: undefined,
        id2CountryAndType: undefined,
        id2Number: undefined
      };

      console.log('═══════════════════════════════════════════════');
      console.log('📤 SUBMITTING TRANSACTION');
      console.log('═══════════════════════════════════════════════');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      console.log('Amount NZD Cents:', payload.amountNzdCents);
      console.log('Requires Enhanced AML:', payload.amountNzdCents >= 100000);

      if (payload.amountNzdCents >= 100000) {
        console.log('🔍 Enhanced AML Field Check:');
        console.log('  - senderStreetAddress:', payload.senderStreetAddress || '❌ MISSING');
        console.log('  - senderSuburb:', payload.senderSuburb || '❌ MISSING');
        console.log('  - senderCity:', payload.senderCity || '❌ MISSING');
        console.log('  - senderPostcode:', payload.senderPostcode || '❌ MISSING');
        console.log('  - senderHomePhone:', payload.senderHomePhone || '❌ MISSING');
        console.log('  - senderMobilePhone:', payload.senderMobilePhone || '❌ MISSING');
        console.log('  - occupation:', payload.occupation || '❌ MISSING');
        console.log('  - employerName:', payload.employerName || '❌ MISSING');
        console.log('  - employerAddress:', payload.employerAddress || '❌ MISSING');
        console.log('  - employerPhone:', payload.employerPhone || '❌ MISSING');
        console.log('  - reasonForRemittance:', payload.reasonForRemittance || '❌ MISSING');
        console.log('  - relationshipToBeneficiary:', payload.relationshipToBeneficiary || '❌ MISSING');
        console.log('  - sourceOfFunds:', payload.sourceOfFunds || '❌ MISSING');
        console.log('  - bankAccountDetails:', payload.bankAccountDetails || '❌ MISSING');
        console.log('  - proofOfAddressType:', payload.proofOfAddressType || '❌ MISSING');
        console.log('  - proofDocumentsProvided:', payload.proofDocumentsProvided || '❌ MISSING');
      }
      console.log('═══════════════════════════════════════════════');

      const response = await fetch('/api/public/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.log('═══════════════════════════════════════════════');
        console.log('🚨 TRANSACTION VALIDATION ERROR');
        console.log('═══════════════════════════════════════════════');
        console.log('Response Status:', response.status);
        console.log('Error Data:', data);
        console.log('Error Message:', data.error);
        console.log('Validation Details:', data.details);
        console.log('Full JSON:', JSON.stringify(data, null, 2));
        console.log('═══════════════════════════════════════════════');

        // Handle validation errors
        if (response.status === 400 && data.details && Array.isArray(data.details)) {
          const errors = data.details.map((err: any) => {
            const fieldPath = Array.isArray(err.path) ? err.path.join('.') : String(err.path || 'unknown');
            const fieldName = fieldPath
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str: string) => str.toUpperCase())
              .trim();
            return {
              field: fieldPath,
              message: `${fieldName}: ${err.message}`
            };
          });
          setValidationErrors(errors);
          if (errors.length > 0) {
            setError('Please fix the following validation errors:');
          } else {
            setError(data.error || 'Validation failed');
          }
          console.error('Validation errors:', errors);
          console.error('Raw validation details:', data.details);
        } else if (data.error) {
          // Show the actual error message from the API
          setError(data.error);
          // If there are details but not in array format, show them too
          if (data.details) {
            console.error('Non-array details:', data.details);
            if (typeof data.details === 'string') {
              setError(`${data.error}: ${data.details}`);
            }
          }
        } else {
          setError(`Failed to create transaction (Status: ${response.status}). Please check the console for details.`);
        }
        setLoading(false);
        return;
      }

      // Upload documents if provided
      const uploadPromises = [];

      if (sourceOfFundsFile) {
        const formData = new FormData();
        formData.append('file', sourceOfFundsFile);
        formData.append('documentType', 'SOURCE_OF_FUNDS');
        formData.append('description', 'Source of Funds Document');

        uploadPromises.push(
          fetch(`/api/public/transactions/${data.transaction.id}/documents`, {
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
          fetch(`/api/public/transactions/${data.transaction.id}/documents`, {
            method: 'POST',
            body: formData
          })
        );
      }

      // Wait for all uploads to complete
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      setSuccess(true);
      setTransactionNumber(data.transaction.txnNumber);
      setTransactionId(data.transaction.id);
    } catch (err) {
      console.error('Transaction submission error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 p-4">
        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-white rounded-xl shadow-xl p-8">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Transaction Successful!</h1>
              <p className="text-gray-600 mb-4">Transaction number:</p>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-2xl font-bold text-blue-600">{transactionNumber}</p>
              </div>
            </div>

            {/* Optional Document Uploads */}
            <div className="space-y-6 mb-8">
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Optional Supporting Documents</h2>
                <p className="text-sm text-gray-600 mb-4">
                  You can upload supporting documents now, or skip and return to the portal.
                </p>
              </div>

              {/* Source of Funds Upload */}
              <SourceOfFundsUpload transactionId={transactionId} />

              {/* Proof of Address Upload */}
              <ProofOfAddressUpload transactionId={transactionId} />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/portal/${agentCode}`)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Skip & Return to Portal
              </button>
              <button
                onClick={() => router.push(`/portal/${agentCode}/transaction/new`)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Another Transaction
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingCustomer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Not Found</h1>
          <p className="text-gray-600 mb-6">Please select a valid customer to continue.</p>
          <button
            onClick={() => router.push(`/portal/${agentCode}/transaction/new`)}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const { totalPaid, foreignReceived } = calculateTotals();
  const requiresEnhancedAML = parseFloat(formData.amountNzd || '0') >= 1000;

  // Get available ID types from customer's uploaded documents
  const availableIdTypes = customer?.ids?.map((doc: any) => doc.documentType) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/portal/${agentCode}/transaction/new`)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Search
          </button>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">New Transaction</h1>
            {agent && (
              <p className="text-gray-600">
                {agent.name} {agent.location && `• ${agent.location}`}
              </p>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="font-semibold">{customer.fullName}</p>
            </div>
            <div>
              <p className="text-gray-600">Customer ID</p>
              <p className="font-semibold text-blue-600">{customer.customerId}</p>
            </div>
            <div>
              <p className="text-gray-600">Phone</p>
              <p className="font-semibold">{customer.phone}</p>
            </div>
            {customer.email && (
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-semibold">{customer.email}</p>
              </div>
            )}
          </div>

          {/* ID Documents on File */}
          {customer.ids && customer.ids.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">ID Documents on File</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {customer.ids.map((idDoc: any) => (
                  <div key={idDoc.id} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {idDoc.documentType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Uploaded {new Date(idDoc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <a
                      href={`/api/public/customers/${customer.id}/ids/${idDoc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                💡 Copy these document types to the "ID & Proof Documents Provided" field below when filling out the transaction
              </p>
            </div>
          )}

          {customer.ids && customer.ids.length === 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-900">No ID documents on file</p>
                  <p className="text-xs text-yellow-700">You'll need to manually verify and list ID documents for this transaction</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Beneficiary Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Beneficiary Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beneficiary Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.beneficiaryName}
                  onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Village/Town
                </label>
                <input
                  type="text"
                  value={formData.beneficiaryVillage}
                  onChange={(e) => setFormData({ ...formData, beneficiaryVillage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.beneficiaryPhone}
                  onChange={(e) => setFormData({ ...formData, beneficiaryPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bank}
                  onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Transaction Amount */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Amount</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'WST' | 'AUD' | 'USD' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                >
                  <option value="WST">WST (Samoan Tala)</option>
                  <option value="AUD">AUD (Australian Dollar)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exchange Rate
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.rate}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (NZD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amountNzd}
                  onChange={(e) => setFormData({ ...formData, amountNzd: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fee (NZD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.feeNzd}
                  onChange={(e) => setFormData({ ...formData, feeNzd: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total to Pay (NZD)</p>
                    <p className="text-2xl font-bold text-gray-900">${totalPaid.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Recipient Receives ({formData.currency})</p>
                    <p className="text-2xl font-bold text-blue-600">{foreignReceived.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details (for transactions < NZ$1,000) */}
          {!requiresEnhancedAML && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose of Transfer
                  </label>
                  <input
                    type="text"
                    value={formData.purposeOfTransfer}
                    onChange={(e) => setFormData({ ...formData, purposeOfTransfer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship to Beneficiary
                  </label>
                  <input
                    type="text"
                    value={formData.relationshipToBeneficiary}
                    onChange={(e) => setFormData({ ...formData, relationshipToBeneficiary: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source of Funds <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.sourceOfFunds}
                    onChange={(e) => setFormData({ ...formData, sourceOfFunds: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    disabled={loading}
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

                  {/* Mobile-friendly upload section */}
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">📄 Upload Document (Optional)</span>
                      {sourceOfFundsFile && (
                        <button
                          type="button"
                          onClick={() => setSourceOfFundsFile(null)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {sourceOfFundsFile ? (
                      <div className="p-2 bg-green-50 border border-green-300 rounded">
                        <p className="text-sm text-green-700 font-medium">✓ {sourceOfFundsFile.name}</p>
                        <p className="text-xs text-green-600">{(sourceOfFundsFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex flex-col items-center justify-center px-3 py-3 bg-white border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                          <svg className="w-6 h-6 text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-xs font-medium text-blue-600">Take Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setSourceOfFundsFile(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                            disabled={loading}
                          />
                        </label>

                        <label className="flex flex-col items-center justify-center px-3 py-3 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <svg className="w-6 h-6 text-gray-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-xs font-medium text-gray-600">Choose File</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf,.doc,.docx"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setSourceOfFundsFile(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                            disabled={loading}
                          />
                        </label>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">PDF, Images, Word, Excel</p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proof of Address Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.proofOfAddressType}
                    onChange={(e) => setFormData({ ...formData, proofOfAddressType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    disabled={loading}
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

                  {/* Mobile-friendly upload section */}
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">🏠 Upload Document (Optional)</span>
                      {proofOfAddressFile && (
                        <button
                          type="button"
                          onClick={() => setProofOfAddressFile(null)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {proofOfAddressFile ? (
                      <div className="p-2 bg-green-100 border border-green-400 rounded">
                        <p className="text-sm text-green-700 font-medium">✓ {proofOfAddressFile.name}</p>
                        <p className="text-xs text-green-600">{(proofOfAddressFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex flex-col items-center justify-center px-3 py-3 bg-white border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:bg-green-50 transition-colors">
                          <svg className="w-6 h-6 text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-xs font-medium text-green-600">Take Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setProofOfAddressFile(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                            disabled={loading}
                          />
                        </label>

                        <label className="flex flex-col items-center justify-center px-3 py-3 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <svg className="w-6 h-6 text-gray-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-xs font-medium text-gray-600">Choose File</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf,.doc,.docx"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setProofOfAddressFile(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                            disabled={loading}
                          />
                        </label>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">PDF, Images, Word, Excel</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.verifiedWithOriginalId}
                    onChange={(e) => setFormData({ ...formData, verifiedWithOriginalId: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Verified with original ID document
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Verification Checkbox for Enhanced AML (moved here for consistency) */}
          {requiresEnhancedAML && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.verifiedWithOriginalId}
                  onChange={(e) => setFormData({ ...formData, verifiedWithOriginalId: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-sm font-medium text-gray-700">
                  Verified with original ID document
                </span>
              </label>
            </div>
          )}

          {/* Enhanced AML Fields for >= NZ$1,000 */}
          {requiresEnhancedAML && (
            <div className="bg-orange-50 p-6 rounded-xl border-2 border-orange-300 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h2 className="text-lg font-semibold text-orange-900">Enhanced AML Information Required (≥ NZ$1,000)</h2>
              </div>

              {/* Enhanced Sender Address */}
              <div className="bg-white p-4 rounded-lg mb-4">
                <h3 className="font-medium text-gray-900 mb-4">Detailed Sender Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={requiresEnhancedAML}
                      value={formData.senderStreetAddress}
                      onChange={(e) => setFormData({ ...formData, senderStreetAddress: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suburb <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={requiresEnhancedAML}
                      value={formData.senderSuburb}
                      onChange={(e) => setFormData({ ...formData, senderSuburb: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={requiresEnhancedAML}
                      value={formData.senderCity}
                      onChange={(e) => setFormData({ ...formData, senderCity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postcode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={requiresEnhancedAML}
                      value={formData.senderPostcode}
                      onChange={(e) => setFormData({ ...formData, senderPostcode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Home Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required={requiresEnhancedAML}
                      value={formData.senderHomePhone}
                      onChange={(e) => setFormData({ ...formData, senderHomePhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required={requiresEnhancedAML}
                      value={formData.senderMobilePhone}
                      onChange={(e) => setFormData({ ...formData, senderMobilePhone: e.target.value })}
                      placeholder={customer?.phone}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="bg-white p-4 rounded-lg mb-4">
                <h3 className="font-medium text-gray-900 mb-4">Employment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={requiresEnhancedAML}
                      value={formData.employerName}
                      onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employer Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required={requiresEnhancedAML}
                      value={formData.employerPhone}
                      onChange={(e) => setFormData({ ...formData, employerPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employer Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={requiresEnhancedAML}
                      value={formData.employerAddress}
                      onChange={(e) => setFormData({ ...formData, employerAddress: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Remittance & Personal Details */}
              <div className="bg-white p-4 rounded-lg mb-4">
                <h3 className="font-medium text-gray-900 mb-4">Remittance & Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Remittance <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={requiresEnhancedAML}
                      value={formData.reasonForRemittance}
                      onChange={(e) => setFormData({ ...formData, reasonForRemittance: e.target.value, purposeOfTransfer: e.target.value })}
                      placeholder="e.g., Family support, Education, Medical expenses"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship to Beneficiary <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={requiresEnhancedAML}
                      value={formData.relationshipToBeneficiary}
                      onChange={(e) => setFormData({ ...formData, relationshipToBeneficiary: e.target.value })}
                      placeholder="e.g., Parent, Sibling, Friend"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Occupation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={requiresEnhancedAML}
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      placeholder="e.g., Teacher, Builder, Self-employed"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Source of Funds */}
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Source of Funds</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source of Funds <span className="text-red-500">*</span>
                    </label>
                    <select
                      required={requiresEnhancedAML}
                      value={formData.sourceOfFunds}
                      onChange={(e) => setFormData({ ...formData, sourceOfFunds: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source of Funds Details
                    </label>
                    <input
                      type="text"
                      value={formData.sourceOfFundsDetails}
                      onChange={(e) => setFormData({ ...formData, sourceOfFundsDetails: e.target.value })}
                      placeholder="Additional details if needed"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Account Details <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={requiresEnhancedAML}
                      value={formData.bankAccountDetails}
                      onChange={(e) => setFormData({ ...formData, bankAccountDetails: e.target.value })}
                      placeholder="Account number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proof of Address Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required={requiresEnhancedAML}
                      value={formData.proofOfAddressType}
                      onChange={(e) => setFormData({ ...formData, proofOfAddressType: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      disabled={loading}
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
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Documents Provided <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3 p-4 bg-white rounded-lg border-2 border-gray-200">
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
                              disabled={!isAvailable || loading}
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

          {/* Error Message */}
          {(error || validationErrors.length > 0) && (
            <div className="bg-red-50 border-2 border-red-400 rounded-xl p-6 shadow-lg" id="error-section">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  {error && (
                    <p className="text-base font-bold text-red-900 mb-3">{error}</p>
                  )}
                  {validationErrors.length > 0 && (
                    <ul className="list-disc list-inside space-y-2 text-sm text-red-800">
                      {validationErrors.map((err, index) => (
                        <li key={index} className="leading-relaxed">{err.message}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-red-700 mt-3 italic">
                    💡 Check the browser console (F12) for more technical details
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
            >
              {loading ? 'Processing...' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
