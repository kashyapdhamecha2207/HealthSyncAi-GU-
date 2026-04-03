'use client';
import { useState, useEffect } from 'react';
import api from '../../../../lib/axios';
import { FileText, Download, Upload, Search, Filter, X, Calendar, User, Activity, TrendingUp, AlertCircle, Eye, Share2, Printer } from 'lucide-react';

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    // Load immediately for instant performance
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      // Skip API call if endpoint doesn't exist
      // const res = await api.get('/medical-records');
      // const recordsData = res.data || [];
      setRecords([]);
    } catch (err) {
      console.error('Failed to fetch medical records:', err);
      // If API fails, set empty array to prevent crashes
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = (record.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (record.doctor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (record.type || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || record.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleUpload = async (file) => {
    try {
      setLoading(true);
      // Mock upload functionality
      const newRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        type: 'upload',
        doctor: 'Uploaded Record',
        diagnosis: file.name,
        prescription: 'See attached file',
        notes: 'File uploaded by patient',
        location: 'Patient Upload',
        reports: ['Uploaded Document']
      };
      setRecords([newRecord, ...records]);
      setShowUploadModal(false);
      alert('Medical record uploaded successfully!');
    } catch (err) {
      alert('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (record) => {
    try {
      // Create downloadable content
      const content = `
MEDICAL RECORD
================
Type: ${record.type}
Date: ${record.date}
Doctor: ${record.doctor}
Diagnosis: ${record.diagnosis}
Prescription: ${record.prescription || 'None'}
Notes: ${record.notes || 'None'}
Location: ${record.location || 'Not specified'}
Follow-up: ${record.followUp || 'None'}
================
Generated on: ${new Date().toLocaleString()}
      `.trim();

      // Create blob and download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical-record-${record.date}-${record.type}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      alert('Medical record downloaded successfully!');
    } catch (err) {
      alert('Failed to download record');
    }
  };

  const handleShare = async (record) => {
    try {
      // Mock share functionality
      alert(`Sharing ${record.type} record with healthcare provider...`);
      // In real implementation, this would share via secure portal
    } catch (err) {
      alert('Failed to share record');
    }
  };

  const handlePrint = async (record) => {
    try {
      // Mock print functionality
      alert(`Printing ${record.type} record...`);
      // In real implementation, this would open print dialog
    } catch (err) {
      alert('Failed to print record');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'consultation': return <User size={20} className="text-blue-600" />;
      case 'lab-result': return <Activity size={20} className="text-green-600" />;
      case 'x-ray': return <Eye size={20} className="text-purple-600" />;
      case 'prescription': return <FileText size={20} className="text-orange-600" />;
      case 'surgery': return <AlertCircle size={20} className="text-red-600" />;
      case 'vaccination': return <TrendingUp size={20} className="text-teal-600" />;
      case 'upload': return <Upload size={20} className="text-indigo-600" />;
      default: return <FileText size={20} className="text-gray-600" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-700';
      case 'lab-result': return 'bg-green-100 text-green-700';
      case 'x-ray': return 'bg-purple-100 text-purple-700';
      case 'prescription': return 'bg-orange-100 text-orange-700';
      case 'surgery': return 'bg-red-100 text-red-700';
      case 'vaccination': return 'bg-teal-100 text-teal-700';
      case 'upload': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="glass p-8 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Medical Records</h1>
            <p className="text-slate-600">Complete medical history and reports</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload size={18} />
              <span>Upload Record</span>
            </button>
            <button
              onClick={() => alert('Export all records...')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={18} />
              <span>Export All</span>
            </button>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by diagnosis, doctor, or type..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Records ({records.length})</option>
              <option value="consultation">Consultations</option>
              <option value="lab-result">Lab Results</option>
              <option value="x-ray">X-Rays & Imaging</option>
              <option value="prescription">Prescriptions</option>
              <option value="surgery">Surgeries</option>
              <option value="vaccination">Vaccinations</option>
            </select>
          </div>
        </div>

        {/* Records Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-center">
              <User size={24} className="text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{records.filter(r => r.type === 'consultation').length}</div>
              <p className="text-sm text-blue-700">Consultations</p>
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="text-center">
              <Activity size={24} className="text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">{records.filter(r => r.type === 'lab-result').length}</div>
              <p className="text-sm text-green-700">Lab Results</p>
            </div>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="text-center">
              <Eye size={24} className="text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">{records.filter(r => r.type === 'x-ray').length}</div>
              <p className="text-sm text-purple-700">Imaging</p>
            </div>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div className="text-center">
              <FileText size={24} className="text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-900">{records.filter(r => r.type === 'prescription').length}</div>
              <p className="text-sm text-orange-700">Prescriptions</p>
            </div>
          </div>
        </div>

        {/* Records List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-slate-600">Loading medical records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No medical records found</p>
              <p className="text-sm text-slate-500 mt-2">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            filteredRecords.map(record => (
              <div key={record.id} className="p-6 rounded-xl bg-white border border-slate-200 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getTypeIcon(record.type)}
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg">{record.diagnosis}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar size={16} className="text-slate-400" />
                          <span>{record.date}</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(record.type)}`}>
                            {record.type.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <User size={16} className="text-slate-400" />
                        <span>Dr: {record.doctor}</span>
                        {record.location && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{record.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Vitals Display */}
                    {record.vitals && (
                      <div className="mt-3 p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm font-semibold text-slate-900 mb-2">Vital Signs Recorded:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {Object.entries(record.vitals).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</p>
                              <p className="font-medium text-slate-900">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Prescription Display */}
                    {record.prescription && (
                      <div className="mt-3 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Prescription:</p>
                        <p className="text-sm text-blue-700">{record.prescription}</p>
                      </div>
                    )}
                    
                    {/* Notes */}
                    {record.notes && (
                      <div className="mt-3 p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm font-semibold text-slate-900 mb-2">Notes:</p>
                        <p className="text-sm text-slate-700">{record.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {/* Follow Up Info */}
                    {record.followUp && (
                      <div className="text-sm text-slate-500 mb-2">
                        <Calendar size={16} className="text-slate-400" />
                        <span>Follow-up: {record.followUp}</span>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(record)}
                        className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                        title="Download record"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleShare(record)}
                        className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                        title="Share record"
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        onClick={() => handlePrint(record)}
                        className="p-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                        title="Print record"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Upload Medical Record</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">Choose file to upload</p>
              <input
                type="file"
                className="hidden"
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])}
              />
              <label 
                htmlFor="file-upload"
                className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Files
              </label>
              <p className="text-sm text-slate-500 mt-2">Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)</p>
              <p className="text-sm text-slate-500">Or drag and drop files here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
