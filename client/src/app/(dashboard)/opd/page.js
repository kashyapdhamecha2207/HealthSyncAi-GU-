'use client';
import { useEffect, useState } from 'react';
import api from '../../../lib/axios';
import { 
  Users, Clock, Activity, AlertTriangle, CheckCircle, 
  Calendar, DollarSign, TrendingUp, Filter, Search,
  UserPlus, Stethoscope, FileText, CreditCard, Bell
} from 'lucide-react';

export default function OPDDashboard() {
  const [activeTab, setActiveTab] = useState('queue');
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({
    totalVisits: 0,
    completedVisits: 0,
    emergencyVisits: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    fetchOPDData();
  }, [activeTab]);

  const fetchOPDData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const doctorId = user.id;
      
      if (activeTab === 'queue') {
        const queueRes = await api.get(`/opd/queue/${doctorId}`);
        setQueue(queueRes.data || []);
      }
      
      const statsRes = await api.get('/opd/stats', { 
        params: { doctorId, dateRange: 'today' } 
      });
      setStats(statsRes.data || {});
    } catch (err) {
      console.error('Failed to fetch OPD data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateQueueStatus = async (queueId, status) => {
    try {
      await api.patch(`/opd/queue/${queueId}/status`, { status });
      fetchOPDData(); // Refresh queue
      alert(`Patient status updated to ${status}`);
    } catch (err) {
      alert('Failed to update patient status');
    }
  };

  const filteredQueue = queue.filter(patient => {
    const matchesSearch = patient.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.chiefComplaint?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || patient.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading OPD data...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">OPD Management</h1>
          <p className="text-slate-600 mt-1">Outpatient Department Management System</p>
        </div>
        <button 
          onClick={() => setShowRegistration(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
        >
          <UserPlus size={18} /> Register Patient
        </button>
      </div>

      {/* OPD Statistics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-blue-600" size={24} />
            <span className="font-semibold text-slate-900">Total Visits</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.visits?.total || 0}</div>
          <div className="text-sm text-slate-600">Today</div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="text-emerald-600" size={24} />
            <span className="font-semibold text-slate-900">Completed</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.visits?.completed || 0}</div>
          <div className="text-sm text-slate-600">Consultations</div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-600" size={24} />
            <span className="font-semibold text-slate-900">Emergency</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.visits?.emergency || 0}</div>
          <div className="text-sm text-slate-600">Cases</div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="text-teal-600" size={24} />
            <span className="font-semibold text-slate-900">Revenue</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">${stats.revenue || 0}</div>
          <div className="text-sm text-slate-600">Today</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        {[
          { id: 'queue', label: 'Live Queue', icon: Users },
          { id: 'consultations', label: 'Consultations', icon: Stethoscope },
          { id: 'billing', label: 'Billing', icon: CreditCard },
          { id: 'reports', label: 'Reports', icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'text-teal-600 border-teal-600'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Live Queue Tab */}
      {activeTab === 'queue' && (
        <div>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Live Queue</h2>
              <span className="relative flex h-3 w-3 inline-flex">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                <option value="general">General Medicine</option>
                <option value="cardiology">Cardiology</option>
                <option value="pediatrics">Pediatrics</option>
                <option value="orthopedics">Orthopedics</option>
              </select>
            </div>
          </div>

          {filteredQueue.length === 0 ? (
            <div className="p-8 text-center glass rounded-2xl text-slate-500">
              <Users size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No patients in queue</h3>
              <p>No patients are currently waiting for consultation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueue.map((patient, index) => (
                <div key={patient._id} className="glass p-6 rounded-2xl">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-black text-slate-200">#{patient.queueNumber}</div>
                        <div className="text-xs text-slate-500 mt-1">Queue</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-slate-800">
                            {patient.patientId?.name || 'Unknown Patient'}
                          </h3>
                          {patient.isEmergency && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                              Emergency
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            patient.priority === 'emergency' ? 'bg-red-100 text-red-700' :
                            patient.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {patient.priority}
                          </span>
                        </div>
                        <div className="text-slate-500 text-sm space-y-1">
                          <div>Chief Complaint: {patient.chiefComplaint}</div>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock size={14} /> Est. wait: {patient.estimatedWaitTime || 15}m
                            </span>
                            <span>Category: {patient.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        patient.status === 'waiting' ? 'bg-blue-50 text-blue-700' :
                        patient.status === 'called' ? 'bg-amber-50 text-amber-700' :
                        patient.status === 'in-consultation' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {patient.status.replace('-', ' ').toUpperCase()}
                      </div>

                      <div className="flex gap-2">
                        {patient.status === 'waiting' && (
                          <>
                            <button 
                              onClick={() => updateQueueStatus(patient._id, 'called')}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              <Bell size={14}/> Call
                            </button>
                            <button 
                              onClick={() => updateQueueStatus(patient._id, 'in-consultation')}
                              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                            >
                              <Stethoscope size={14}/> Start
                            </button>
                          </>
                        )}
                        
                        {patient.status === 'in-consultation' && (
                          <button 
                            onClick={() => updateQueueStatus(patient._id, 'completed')}
                            className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                          >
                            <CheckCircle size={14}/> Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Consultations Tab */}
      {activeTab === 'consultations' && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Active Consultations</h2>
          <div className="p-8 text-center glass rounded-2xl text-slate-500">
            <Stethoscope size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Consultation Interface</h3>
            <p>Detailed consultation management will be available here.</p>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Billing & Payments</h2>
          <div className="p-8 text-center glass rounded-2xl text-slate-500">
            <CreditCard size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Billing Management</h3>
            <p>Payment processing and billing interface will be available here.</p>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-6">OPD Reports</h2>
          <div className="p-8 text-center glass rounded-2xl text-slate-500">
            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Analytics & Reports</h3>
            <p>Comprehensive OPD analytics and reporting will be available here.</p>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Register OPD Patient</h3>
            <p className="text-slate-600 mb-6">Enter patient details for OPD registration</p>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  OPD patient registration interface will be implemented here with full patient details, 
                  appointment linking, and queue management integration.
                </p>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowRegistration(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
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
