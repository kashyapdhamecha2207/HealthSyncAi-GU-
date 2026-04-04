'use client';
import { useState, useEffect } from 'react';
import api from '../../../../lib/axios';
import { FileText, Download, Upload, X, Trash2 } from 'lucide-react';

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/medical-records');
      setRecords(res.data || []);
    } catch (err) {
      console.error('Failed to fetch medical records:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      await api.post('/medical-records', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowUploadModal(false);
      fetchRecords();
      alert('Medical record uploaded successfully!');
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (record) => {
    try {
      const res = await api.get(`/medical-records/${record._id}/download`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: record.mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (record) => {
    if (!confirm(`Delete "${record.originalName}"?`)) return;

    try {
      await api.delete(`/medical-records/${record._id}`);
      fetchRecords();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete record');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType) => {
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType?.includes('word')) return '📝';
    return '📎';
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="glass p-8 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Medical Records</h1>
            <p className="text-slate-600">Upload and manage your medical documents</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg"
          >
            <Upload size={18} />
            <span>Upload Record</span>
          </button>
        </div>

        {/* Records List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-slate-600">Loading medical records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16">
              <FileText size={56} className="text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-600 font-medium">No medical records yet</p>
              <p className="text-sm text-slate-500 mt-2">Upload your first medical record to get started</p>
            </div>
          ) : (
            records.map(record => (
              <div key={record._id} className="flex items-center justify-between p-5 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="text-3xl flex-shrink-0">
                    {getFileIcon(record.mimeType)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{record.originalName}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span>{formatFileSize(record.fileSize)}</span>
                      <span>•</span>
                      <span>{new Date(record.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <button
                    onClick={() => handleDownload(record)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    title="Download original file"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Upload Medical Record</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div>
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-slate-600 font-medium">Uploading...</p>
                </div>
              ) : (
                <>
                  <Upload size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-slate-700 font-medium mb-2">Drag & drop your file here</p>
                  <p className="text-slate-500 text-sm mb-4">or</p>
                  <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Browse Files
                  </label>
                  <p className="text-sm text-slate-500 mt-4">PDF, JPG, PNG, DOC, DOCX — Max 10MB</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
