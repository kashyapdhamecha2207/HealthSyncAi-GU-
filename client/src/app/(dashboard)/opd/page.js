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
  const [doctors, setDoctors] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [registrationData, setRegistrationData] = useState({
    patientId: '',
    doctorId: '',
    department: '',
    visitType: 'new',
    chiefComplaint: '',
    severity: 'moderate',
    isEmergency: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Consultation State
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [consultationData, setConsultationData] = useState({
    vitals: { temperature: '', bp: '', heartRate: '' },
    diagnosis: '',
    treatment: '',
    followUp: { required: false, after: '1 week', instructions: '' }
  });

  useEffect(() => {
    fetchOPDData();
    fetchDoctors();
  }, [activeTab]);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors/all');
      setDoctors(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  const fetchOPDData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const doctorId = user.id;
      
      // Fetch queue
      const queueRes = await api.get(`/opd/queue/${doctorId}`);
      setQueue(queueRes.data.data || []);
      
      // Fetch stats
      const statsRes = await api.get('/opd/stats', { 
        params: { doctorId, dateRange: 'today' } 
      });
      setStats(statsRes.data.data || {});
    } catch (err) {
      console.error('Failed to fetch OPD data:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchPatients = async (query) => {
    setPatientSearch(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/opd/patients/search?query=${query}`);
      setSearchResults(res.data.data || []);
    } catch (err) {
      console.error('Patient search failed:', err);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/opd/register', registrationData);
      setShowRegistration(false);
      setRegistrationData({
        patientId: '', doctorId: '', department: '',
        visitType: 'new', chiefComplaint: '',
        severity: 'moderate', isEmergency: false
      });
      setPatientSearch('');
      fetchOPDData();
      alert('Patient registered successfully!');
    } catch (err) {
      alert('Registration failed. Please fill all required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteConsultation = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        vitals: {
          temperature: parseFloat(consultationData.vitals.temperature),
          bloodPressure: {
            systolic: parseInt(consultationData.vitals.bp?.split('/')[0]) || 0,
            diastolic: parseInt(consultationData.vitals.bp?.split('/')[1]) || 0,
          },
          heartRate: parseInt(consultationData.vitals.heartRate)
        },
        diagnosis: {
          final: [consultationData.diagnosis]
        },
        treatment: {
          advice: consultationData.treatment,
          followUp: consultationData.followUp
        },
        consultationFee: 500, // Default fee
        status: 'completed'
      };

      await api.post(`/opd/consultation/${activeConsultation.opdVisitId}/complete`, payload);
      setActiveConsultation(null);
      setActiveTab('queue');
      fetchOPDData();
      alert('Consultation completed successfully!');
    } catch (err) {
      console.error('Completion error:', err);
      alert('Failed to complete consultation');
    } finally {
      setIsSubmitting(false);
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
                              onClick={() => {
                                setActiveConsultation(patient);
                                setActiveTab('consultations');
                                updateQueueStatus(patient._id, 'in-consultation');
                              }}
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
        <div className="space-y-6">
          {!activeConsultation ? (
            <div className="glass rounded-3xl p-8 text-center">
              <Stethoscope size={48} className="mx-auto mb-4 text-teal-500" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">No Active Consultation</h2>
              <p className="text-slate-500 mb-6">Select a patient from the Live Queue to start a consultation.</p>
              <button 
                onClick={() => setActiveTab('queue')}
                className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100"
              >
                Go to Live Queue
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
              {/* Patient Info Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <div className="glass p-6 rounded-3xl border-teal-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-700 text-2xl font-black">
                      {activeConsultation.patientId?.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{activeConsultation.patientId?.name}</h3>
                      <p className="text-sm text-slate-500">Queue #{activeConsultation.queueNumber} | {activeConsultation.category.toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chief Complaint</label>
                      <p className="text-slate-700 mt-1 font-medium">{activeConsultation.chiefComplaint}</p>
                    </div>
                    <div className="flex justify-between items-center px-2">
                       <span className="text-sm text-slate-500">Risk Level</span>
                       <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                         activeConsultation.riskLevel === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                       }`}>
                         {activeConsultation.riskLevel}
                       </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultation Form */}
              <div className="lg:col-span-2">
                <div className="glass p-8 rounded-3xl shadow-xl border-t-4 border-teal-500">
                  <form onSubmit={handleCompleteConsultation} className="space-y-8">
                    {/* Vitals Section */}
                    <section>
                      <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Activity size={20} className="text-teal-600" /> Vitals Data
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500">Temp (°C)</label>
                          <input 
                            type="number" step="0.1"
                            className="w-full px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                            onChange={(e) => setConsultationData({...consultationData, vitals: {...consultationData.vitals, temperature: e.target.value}})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500">BP (mmHg)</label>
                          <input 
                            className="w-full px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="120/80"
                            onChange={(e) => setConsultationData({...consultationData, vitals: {...consultationData.vitals, bp: e.target.value}})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500">HR (bpm)</label>
                          <input 
                            type="number"
                            className="w-full px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                            onChange={(e) => setConsultationData({...consultationData, vitals: {...consultationData.vitals, heartRate: e.target.value}})}
                          />
                        </div>
                      </div>
                    </section>

                    {/* Clinical Notes */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Diagnosis</label>
                        <textarea 
                          className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none h-32 resize-none"
                          placeholder="Clinical diagnosis..."
                          required
                          value={consultationData.diagnosis}
                          onChange={(e) => setConsultationData({...consultationData, diagnosis: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Treatment Plan / Prescription</label>
                        <textarea 
                          className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none h-32 resize-none"
                          placeholder="Medications and advice..."
                          required
                          value={consultationData.treatment}
                          onChange={(e) => setConsultationData({...consultationData, treatment: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Follow-up Section */}
                    <div className="p-6 bg-teal-50 rounded-3xl border border-teal-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="text-teal-600" />
                          <span className="font-bold text-slate-900">Schedule Follow-up</span>
                        </div>
                        <button
                          type="button"
                          className={`w-12 h-6 rounded-full transition-all relative ${consultationData.followUp.required ? 'bg-teal-500' : 'bg-slate-300'}`}
                          onClick={() => setConsultationData({
                            ...consultationData, 
                            followUp: { ...consultationData.followUp, required: !consultationData.followUp.required }
                          })}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${consultationData.followUp.required ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>

                      {consultationData.followUp.required && (
                        <div className="grid md:grid-cols-2 gap-4 animate-slide-up">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-teal-700">Review After</label>
                            <select 
                              className="w-full px-4 py-2 rounded-xl border border-teal-200 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                              value={consultationData.followUp.after}
                              onChange={(e) => setConsultationData({...consultationData, followUp: {...consultationData.followUp, after: e.target.value}})}
                            >
                              <option>3 days</option>
                              <option>1 week</option>
                              <option>2 weeks</option>
                              <option>1 month</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-teal-700">Follow-up Instructions</label>
                            <input 
                              type="text"
                              className="w-full px-4 py-2 rounded-xl border border-teal-200 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                              placeholder="e.g. Bring latest reports"
                              onChange={(e) => setConsultationData({...consultationData, followUp: {...consultationData.followUp, instructions: e.target.value}})}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <button 
                        type="button"
                        onClick={() => setActiveConsultation(null)}
                        className="flex-1 px-4 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all"
                      >
                        Save Draft
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold shadow-lg shadow-teal-200 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? 'Saving...' : 'Complete & Finalize Consultation'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
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

      {showRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 leading-tight">OPD Registration</h3>
                <p className="text-slate-500 mt-1">Assign a patient to the live queue</p>
              </div>
              <button onClick={() => setShowRegistration(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <XCircle className="text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleRegisterPatient} className="space-y-6">
              {/* Patient Search */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Search size={16} /> Search Existing Patient
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search by name, email or phone..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    value={patientSearch}
                    onChange={(e) => searchPatients(e.target.value)}
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden">
                      {searchResults.map(patient => (
                        <button
                          key={patient._id}
                          type="button"
                          className="w-full p-4 text-left hover:bg-teal-50 flex items-center justify-between border-b border-slate-100 last:border-0 transition-colors"
                          onClick={() => {
                            setRegistrationData({ ...registrationData, patientId: patient._id });
                            setPatientSearch(patient.name);
                            setSearchResults([]);
                          }}
                        >
                          <div>
                            <div className="font-bold text-slate-900">{patient.name}</div>
                            <div className="text-xs text-slate-500">{patient.email} | {patient.phone}</div>
                          </div>
                          <CheckCircle size={16} className={registrationData.patientId === patient._id ? 'text-teal-600' : 'text-slate-200'} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Stethoscope size={16} /> Assign Doctor
                  </label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none appearance-none bg-white"
                    required
                    value={registrationData.doctorId}
                    onChange={(e) => {
                      const doc = doctors.find(d => d._id === e.target.value);
                      setRegistrationData({ 
                        ...registrationData, 
                        doctorId: e.target.value,
                        department: doc?.department || ''
                      });
                    }}
                  >
                    <option value="">Select Doctor...</option>
                    {doctors.map(doc => (
                      <option key={doc._id} value={doc._id}>Dr. {doc.name} ({doc.department})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Activity size={16} /> Visit Type
                  </label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                    value={registrationData.visitType}
                    onChange={(e) => setRegistrationData({ ...registrationData, visitType: e.target.value })}
                  >
                    <option value="new">New Visit</option>
                    <option value="followup">Follow-up</option>
                    <option value="routine">Routine Checkup</option>
                    <option value="review">Review</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Chief Complaint</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none h-24 resize-none"
                  placeholder="Reason for visit..."
                  required
                  value={registrationData.chiefComplaint}
                  onChange={(e) => setRegistrationData({ ...registrationData, chiefComplaint: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${registrationData.isEmergency ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Priority Case</div>
                    <div className="text-xs text-slate-500">Mark as emergency for immediate attention</div>
                  </div>
                </div>
                <button
                  type="button"
                  className={`w-12 h-6 rounded-full transition-all relative ${registrationData.isEmergency ? 'bg-red-500' : 'bg-slate-300'}`}
                  onClick={() => setRegistrationData({ ...registrationData, isEmergency: !registrationData.isEmergency })}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${registrationData.isEmergency ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowRegistration(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !registrationData.patientId || !registrationData.doctorId}
                  className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-200 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
