'use client';
import { useEffect, useState } from 'react';
import api from '../../../../lib/axios';
import { 
  FileText, Calendar, User, Stethoscope, Pill, TestTube,
  Download, Filter, Search, Eye, Clock, DollarSign
} from 'lucide-react';

export default function OPDHistory() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showVisitDetails, setShowVisitDetails] = useState(false);

  useEffect(() => {
    fetchOPDHistory();
  }, []);

  const fetchOPDHistory = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const patientId = user.id;
      
      // Mock OPD history data
      const mockVisits = [
        {
          _id: '1',
          doctorId: { name: 'Dr. Sarah Johnson', department: 'General Medicine' },
          visitType: 'followup',
          department: 'General Medicine',
          chiefComplaint: 'Follow-up for hypertension',
          diagnosis: {
            final: ['Hypertension', 'Type 2 Diabetes']
          },
          treatment: {
            medications: [
              { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' },
              { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' }
            ]
          },
          consultationFee: 100,
          totalAmount: 300,
          paymentStatus: 'paid',
          status: 'completed',
          createdAt: '2024-01-15T10:30:00Z',
          consultationDuration: 25
        },
        {
          _id: '2',
          doctorId: { name: 'Dr. Michael Chen', department: 'Cardiology' },
          visitType: 'new',
          department: 'Cardiology',
          chiefComplaint: 'Chest pain and shortness of breath',
          diagnosis: {
            provisional: ['Angina', 'Possible CAD'],
            final: ['Stable Angina']
          },
          treatment: {
            medications: [
              { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily' },
              { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily' }
            ],
            procedures: ['ECG', 'Echocardiogram']
          },
          investigations: [
            { type: 'lab', name: 'Lipid Profile', status: 'completed' },
            { type: 'radiology', name: 'Chest X-ray', status: 'completed' }
          ],
          consultationFee: 150,
          totalAmount: 650,
          paymentStatus: 'paid',
          status: 'completed',
          createdAt: '2024-01-10T14:15:00Z',
          consultationDuration: 35
        }
      ];
      
      setVisits(mockVisits);
    } catch (err) {
      console.error('Failed to fetch OPD history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVisits = visits.filter(visit => {
    const matchesSearch = 
      visit.doctorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.chiefComplaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.department?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const viewVisitDetails = (visit) => {
    setSelectedVisit(visit);
    setShowVisitDetails(true);
  };

  const downloadReport = (visit) => {
    // Mock download functionality
    console.log('Downloading report for visit:', visit._id);
    alert(`Report for visit on ${new Date(visit.createdAt).toLocaleDateString()} would be downloaded here.`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading OPD history...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">OPD Visit History</h1>
          <p className="text-slate-600 mt-1">Your complete outpatient department visit records</p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search visits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent w-64"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="text-blue-600" size={24} />
            <span className="font-semibold text-slate-900">Total Visits</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{visits.length}</div>
          <div className="text-sm text-slate-600">All time</div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="text-emerald-600" size={24} />
            <span className="font-semibold text-slate-900">Last Visit</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {visits.length > 0 ? new Date(visits[0].createdAt).toLocaleDateString() : 'Never'}
          </div>
          <div className="text-sm text-slate-600">
            {visits.length > 0 ? visits[0].doctorId.name : 'No visits yet'}
          </div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="text-teal-600" size={24} />
            <span className="font-semibold text-slate-900">Total Spent</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            ${visits.reduce((sum, visit) => sum + visit.totalAmount, 0)}
          </div>
          <div className="text-sm text-slate-600">On consultations</div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="text-amber-600" size={24} />
            <span className="font-semibold text-slate-900">Avg Duration</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {visits.length > 0 ? Math.round(visits.reduce((sum, visit) => sum + (visit.consultationDuration || 0), 0) / visits.length) : 0}m
          </div>
          <div className="text-sm text-slate-600">Per consultation</div>
        </div>
      </div>

      {/* Visits List */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Visit Records</h2>
        </div>
        
        {filteredVisits.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No visits found</h3>
            <p>No OPD visits match your search criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredVisits.map((visit) => (
              <div key={visit._id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {visit.doctorId.name}
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {visit.department}
                      </span>
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                        {visit.visitType}
                      </span>
                    </div>
                    
                    <div className="text-slate-600 text-sm space-y-1 mb-3">
                      <div>Date: {new Date(visit.createdAt).toLocaleDateString()} at {new Date(visit.createdAt).toLocaleTimeString()}</div>
                      <div>Chief Complaint: {visit.chiefComplaint}</div>
                      {visit.diagnosis?.final?.length > 0 && (
                        <div>Diagnosis: {visit.diagnosis.final.join(', ')}</div>
                      )}
                      {visit.treatment?.medications?.length > 0 && (
                        <div>Medications: {visit.treatment.medications.map(med => med.name).join(', ')}</div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {visit.treatment?.procedures?.map((procedure, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                          <TestTube size={12} className="inline mr-1" />
                          {procedure}
                        </span>
                      ))}
                      {visit.treatment?.medications?.slice(0, 2).map((med, index) => (
                        <span key={index} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">
                          <Pill size={12} className="inline mr-1" />
                          {med.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">${visit.totalAmount}</div>
                      <div className={`text-sm ${visit.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {visit.paymentStatus}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => viewVisitDetails(visit)}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button 
                        onClick={() => downloadReport(visit)}
                        className="flex items-center gap-1 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm"
                      >
                        <Download size={14} /> Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visit Details Modal */}
      {showVisitDetails && selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Visit Details</h3>
                  <p className="text-slate-600 mt-1">
                    {new Date(selectedVisit.createdAt).toLocaleDateString()} at {new Date(selectedVisit.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <button 
                  onClick={() => setShowVisitDetails(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Doctor and Visit Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass p-4 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <User size={18} className="text-blue-600" />
                    Doctor Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-slate-600">Name:</span> {selectedVisit.doctorId.name}</div>
                    <div><span className="text-slate-600">Department:</span> {selectedVisit.department}</div>
                    <div><span className="text-slate-600">Visit Type:</span> {selectedVisit.visitType}</div>
                    <div><span className="text-slate-600">Duration:</span> {selectedVisit.consultationDuration} minutes</div>
                  </div>
                </div>

                <div className="glass p-4 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <DollarSign size={18} className="text-teal-600" />
                    Billing Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Consultation Fee:</span>
                      <span>${selectedVisit.consultationFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Investigations:</span>
                      <span>${selectedVisit.investigations?.length * 200 || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Procedures:</span>
                      <span>${(selectedVisit.treatment?.procedures?.length || 0) * 500}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span>${selectedVisit.totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Payment Status:</span>
                      <span className={`font-semibold ${selectedVisit.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {selectedVisit.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chief Complaint */}
              <div className="glass p-4 rounded-xl">
                <h4 className="font-semibold text-slate-900 mb-3">Chief Complaint</h4>
                <p className="text-slate-700">{selectedVisit.chiefComplaint}</p>
              </div>

              {/* Diagnosis */}
              <div className="glass p-4 rounded-xl">
                <h4 className="font-semibold text-slate-900 mb-3">Diagnosis</h4>
                <div className="space-y-2">
                  {selectedVisit.diagnosis?.final?.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-slate-600">Final Diagnosis:</span>
                      <ul className="mt-1 space-y-1">
                        {selectedVisit.diagnosis.final.map((diagnosis, index) => (
                          <li key={index} className="text-slate-700">• {diagnosis}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedVisit.diagnosis?.provisional?.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-slate-600">Provisional Diagnosis:</span>
                      <ul className="mt-1 space-y-1">
                        {selectedVisit.diagnosis.provisional.map((diagnosis, index) => (
                          <li key={index} className="text-slate-700">• {diagnosis}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Treatment */}
              <div className="glass p-4 rounded-xl">
                <h4 className="font-semibold text-slate-900 mb-3">Treatment Plan</h4>
                
                {selectedVisit.treatment?.medications?.length > 0 && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-slate-600">Medications:</span>
                    <div className="mt-2 space-y-2">
                      {selectedVisit.treatment.medications.map((med, index) => (
                        <div key={index} className="bg-emerald-50 p-3 rounded-lg">
                          <div className="font-medium text-emerald-900">{med.name}</div>
                          <div className="text-sm text-emerald-700">
                            {med.dosage} • {med.frequency} {med.duration && `• ${med.duration}`}
                          </div>
                          {med.instructions && (
                            <div className="text-sm text-emerald-600 mt-1">Instructions: {med.instructions}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVisit.treatment?.procedures?.length > 0 && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-slate-600">Procedures:</span>
                    <div className="mt-2 space-y-1">
                      {selectedVisit.treatment.procedures.map((procedure, index) => (
                        <div key={index} className="text-slate-700">• {procedure}</div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVisit.treatment?.advice && (
                  <div>
                    <span className="text-sm font-medium text-slate-600">Advice:</span>
                    <p className="mt-1 text-slate-700">{selectedVisit.treatment.advice}</p>
                  </div>
                )}
              </div>

              {/* Investigations */}
              {selectedVisit.investigations?.length > 0 && (
                <div className="glass p-4 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-3">Investigations</h4>
                  <div className="space-y-2">
                    {selectedVisit.investigations.map((investigation, index) => (
                      <div key={index} className="flex items-center justify-between bg-purple-50 p-3 rounded-lg">
                        <div>
                          <div className="font-medium text-purple-900">{investigation.name}</div>
                          <div className="text-sm text-purple-700">{investigation.type}</div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          investigation.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          investigation.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {investigation.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={() => downloadReport(selectedVisit)}
                  className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <Download size={18} /> Download Full Report
                </button>
                <button 
                  onClick={() => setShowVisitDetails(false)}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
