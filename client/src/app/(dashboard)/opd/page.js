'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../../../lib/axios';
import { 
  Users, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  UserPlus,
  Search,
  CheckCircle,
  XCircle,
  Stethoscope,
  Bell,
  DollarSign,
  CreditCard,
  FileText,
  Mail,
  ChevronRight,
  ArrowRight,
  Thermometer,
  Heart,
  Plus,
  Trash2,
  Banknote,
  QrCode,
  Phone,
  SkipForward,
  Play
} from 'lucide-react';

export default function OPDDashboard() {
  const [activeTab, setActiveTab] = useState('queue');
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ visits: { total: 0, completed: 0, emergency: 0 }, revenue: 0, averageWait: 15 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showRegistration, setShowRegistration] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Registration State
  const [registrationData, setRegistrationData] = useState({ patientId: '', doctorId: '', department: '', visitType: 'new', chiefComplaint: '', severity: 'moderate', isEmergency: false });

  // Consultation State
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [consultationStep, setConsultationStep] = useState(1);
  const [consultationData, setConsultationData] = useState({
    vitals: { temperature: '', bp: '', heartRate: '', spo2: '', weight: '' },
    diagnosis: '',
    treatment: { medications: [{ name: '', dosage: '', frequency: '', duration: '' }], advice: '' },
    followUp: { required: false, after: '7', instructions: '' }
  });
  const [paymentData, setPaymentData] = useState({ method: 'cash', amount: 500 });
  const [completedReport, setCompletedReport] = useState(null);

  // Call Queue State
  const [calledPatientId, setCalledPatientId] = useState(null);
  const [callTimer, setCallTimer] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const doctorId = user._id || user.id;
        if (!doctorId) {
          console.error('No doctor ID found in localStorage');
          setLoading(false);
          return;
        }
        setRegistrationData(prev => ({ ...prev, doctorId, department: user.department || 'General Medicine' }));
        const [queueRes, statsRes, doctorsRes] = await Promise.all([
          api.get(`/opd/queue/${doctorId}`),
          api.get('/opd/stats', { params: { doctorId, dateRange: 'today' } }),
          api.get('/doctors/all')
        ]);
        setQueue(queueRes.data.data || []);
        setStats(statsRes.data.data || { visits: { total: 0, completed: 0, emergency: 0 }, revenue: 0 });
        setDoctors(doctorsRes.data.data || doctorsRes.data || []);
      } catch (err) {
        console.error('Data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/opd/register', registrationData);
      setShowRegistration(false);
      setRegistrationData(prev => ({ ...prev, patientId: '', visitType: 'new', chiefComplaint: '', severity: 'moderate', isEmergency: false }));
      setPatientSearch('');
      setSearchResults([]);
      // refresh queue
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const doctorId = user._id || user.id;
      const queueRes = await api.get(`/opd/queue/${doctorId}`);
      setQueue(queueRes.data.data || []);
      alert('Patient registered successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePatientSearch = async (query) => {
    setPatientSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get('/opd/patients/search', { params: { query } });
      setSearchResults(res.data.data || []);
    } catch (err) {
      console.error('Patient search error:', err);
    }
  };

  const selectPatient = (patient) => {
    setRegistrationData({ ...registrationData, patientId: patient._id });
    setPatientSearch(patient.name);
    setSearchResults([]);
  };

  // Call a patient — starts 10s countdown
  const callPatient = useCallback((patientId) => {
    // Clear any existing timer
    if (timerRef.current) clearInterval(timerRef.current);
    setCalledPatientId(patientId);
    setShowActions(false);
    setCallTimer(10);

    timerRef.current = setInterval(() => {
      setCallTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setShowActions(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Skip patient and auto-call next
  const skipPatient = useCallback(async (patientId) => {
    try {
      await api.patch(`/opd/queue/${patientId}/status`, { status: 'skipped' });
      // Refresh queue
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const doctorId = user._id || user.id;
      const queueRes = await api.get(`/opd/queue/${doctorId}`);
      const freshQueue = queueRes.data.data || [];
      setQueue(freshQueue);

      // Reset call state
      setCalledPatientId(null);
      setShowActions(false);
      setCallTimer(0);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

      // Auto-call next waiting patient
      const nextPatient = freshQueue.find(p => p.status === 'waiting');
      if (nextPatient) {
        setTimeout(() => callPatient(nextPatient._id), 500);
      }
    } catch (err) {
      console.error('Skip error:', err);
    }
  }, [callPatient]);

  // Start consultation for called patient
  const startConsultation = async (queueId) => {
    try {
      // Reset call state
      setCalledPatientId(null);
      setShowActions(false);
      setCallTimer(0);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

      const res = await api.patch(`/opd/queue/${queueId}/status`, { status: 'in-consultation' });
      const patientFromQueue = queue.find(p => p._id === queueId);
      const patient = { ...patientFromQueue, ...(res.data.data || {}) };
      setActiveConsultation(patient);
      setConsultationStep(1);
      setConsultationData({
        vitals: { temperature: '', bp: '', heartRate: '', spo2: '', weight: '' },
        diagnosis: '',
        treatment: { medications: [{ name: '', dosage: '', frequency: '', duration: '' }], advice: '' },
        followUp: { required: false, after: '7', instructions: '' }
      });
      setPaymentData({ method: 'cash', amount: 500 });
      setCompletedReport(null);
      setActiveTab('consultations');
    } catch (err) {
      console.error(err);
    }
  };

  // Medication helpers
  const addMedication = () => {
    setConsultationData(prev => ({
      ...prev,
      treatment: {
        ...prev.treatment,
        medications: [...prev.treatment.medications, { name: '', dosage: '', frequency: '', duration: '' }]
      }
    }));
  };

  const removeMedication = (index) => {
    setConsultationData(prev => ({
      ...prev,
      treatment: {
        ...prev.treatment,
        medications: prev.treatment.medications.filter((_, i) => i !== index)
      }
    }));
  };

  const updateMedication = (index, field, value) => {
    setConsultationData(prev => {
      const meds = [...prev.treatment.medications];
      meds[index] = { ...meds[index], [field]: value };
      return { ...prev, treatment: { ...prev.treatment, medications: meds } };
    });
  };

  // Complete consultation
  const handleCompleteConsultation = async () => {
    setIsSubmitting(true);
    try {
      const visitId = activeConsultation.opdVisitId;
      
      // Complete the consultation
      await api.post(`/opd/consultation/${visitId}/complete`, {
        vitals: {
          temperature: parseFloat(consultationData.vitals.temperature) || undefined,
          bloodPressure: consultationData.vitals.bp ? {
            systolic: parseInt(consultationData.vitals.bp.split('/')[0]) || 0,
            diastolic: parseInt(consultationData.vitals.bp.split('/')[1]) || 0
          } : undefined,
          heartRate: parseInt(consultationData.vitals.heartRate) || undefined,
          oxygenSaturation: parseInt(consultationData.vitals.spo2) || undefined,
          weight: parseFloat(consultationData.vitals.weight) || undefined
        },
        diagnosis: consultationData.diagnosis,
        treatment: {
          medications: consultationData.treatment.medications.filter(m => m.name),
          advice: consultationData.treatment.advice,
          followUp: consultationData.followUp
        },
        consultationFee: paymentData.amount
      });

      // Process payment
      await api.post(`/opd/visit/${visitId}/payment`, {
        paymentMethod: paymentData.method,
        amount: paymentData.amount
      });

      // Build completed report
      setCompletedReport({
        patient: activeConsultation.patientId?.name || activeConsultation.patientName,
        department: activeConsultation.department,
        vitals: consultationData.vitals,
        diagnosis: consultationData.diagnosis,
        medications: consultationData.treatment.medications.filter(m => m.name),
        advice: consultationData.treatment.advice,
        followUp: consultationData.followUp,
        payment: paymentData,
        isEmergency: activeConsultation.isEmergency,
        completedAt: new Date().toLocaleString()
      });

      setConsultationStep(6); // Report view step

      // Refresh queue and stats
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const doctorId = user._id || user.id;
      const [queueRes, statsRes] = await Promise.all([
        api.get(`/opd/queue/${doctorId}`),
        api.get('/opd/stats', { params: { doctorId, dateRange: 'today' } })
      ]);
      setQueue(queueRes.data.data || []);
      setStats(statsRes.data.data || stats);

    } catch (err) {
      console.error('Complete consultation error:', err);
      alert(err.response?.data?.message || 'Failed to complete consultation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = ['Vitals', 'Diagnosis', 'Medications', 'Follow-Up', 'Payment'];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase italic">OPD Command</h1>
          <p className="text-slate-500 font-bold">HealthSync AI+ Digital Dashboard</p>
        </div>
        <button onClick={() => setShowRegistration(true)} className="px-6 py-4 bg-teal-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-teal-700 transition-all"><UserPlus size={20} /> Register Patient</button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-5 gap-6 mb-10">
        {[
          { label: 'Total Queue', value: queue.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Completed', value: stats.visits?.completed || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Emergency', value: stats.visits?.emergency || 0, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-100' },
          { label: 'Avg Wait', value: '15m', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Revenue', value: `₹${stats.revenue || 0}`, icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-100' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100">
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} w-fit mb-4`}><stat.icon size={24} /></div>
            <div className="text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</div>
            <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-10 border-b border-slate-100">
        {['queue', 'consultations'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 font-black transition-all ${activeTab === tab ? 'text-teal-600 border-b-4 border-teal-600' : 'text-slate-400'}`}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab Content: Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-6 animate-fade-in">
          {/* Active Queue */}
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Waiting ({queue.filter(p => p.status === 'waiting').length})</h3>
            {queue.filter(p => p.status === 'waiting' || p.status === 'called').length === 0 && (
              <div className="p-12 text-center bg-white rounded-3xl text-slate-300 font-bold italic border border-slate-100">No patients waiting</div>
            )}
            <div className="space-y-3">
              {queue.filter(p => p.status !== 'completed' && p.status !== 'skipped').map((p, i) => {
                const isCalled = calledPatientId === p._id;
                const isCounting = isCalled && !showActions;
                const canAct = isCalled && showActions;

                return (
                  <div key={i} className={`bg-white p-6 rounded-3xl border shadow-sm flex justify-between items-center transition-all ${isCalled ? 'border-blue-300 bg-blue-50/30 ring-2 ring-blue-200' : p.isEmergency ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}>
                    <div className="flex gap-6 items-center">
                      <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center font-black ${isCalled ? 'bg-blue-600 animate-pulse' : p.isEmergency ? 'bg-rose-600' : 'bg-slate-900'}`}>{p.queueNumber}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-800">{p.patientId?.name || p.patientName || 'Patient'}</h3>
                          {p.isEmergency && <span className="px-2 py-1 bg-rose-100 text-rose-600 text-[10px] font-black uppercase rounded-lg">🚨 Emergency</span>}
                          {isCalled && <span className="px-2 py-1 bg-blue-100 text-blue-600 text-[10px] font-black uppercase rounded-lg animate-pulse">📢 Called</span>}
                          {p.riskLevel && <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg ${p.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-600' : p.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{p.riskLevel} Risk</span>}
                        </div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{p.department} · {p.chiefComplaint || 'No complaint noted'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Default: Call button */}
                      {!isCalled && (
                        <button onClick={() => callPatient(p._id)} className={`px-6 py-3 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2 ${p.isEmergency ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                          <Phone size={16} /> Call
                        </button>
                      )}

                      {/* Counting down */}
                      {isCounting && (
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12">
                            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
                              <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                              <circle cx="20" cy="20" r="16" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${(callTimer / 10) * 100.5} 100.5`} strokeLinecap="round" className="transition-all duration-1000" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-blue-600">{callTimer}</span>
                          </div>
                          <span className="text-sm font-bold text-blue-500 animate-pulse">Calling patient...</span>
                        </div>
                      )}

                      {/* After 10s: Skip / Start */}
                      {canAct && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => skipPatient(p._id)} className="px-5 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all flex items-center gap-2">
                            <SkipForward size={16} /> Skip
                          </button>
                          <button onClick={() => startConsultation(p._id)} className="px-5 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 hover:shadow-lg transition-all flex items-center gap-2">
                            <Play size={16} /> Start
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skipped patients */}
          {queue.filter(p => p.status === 'skipped').length > 0 && (
            <div>
              <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><SkipForward size={14} /> Skipped ({queue.filter(p => p.status === 'skipped').length})</h3>
              <div className="space-y-3">
                {queue.filter(p => p.status === 'skipped').map((p, i) => (
                  <div key={i} className="bg-amber-50/50 p-5 rounded-3xl border border-amber-100 flex justify-between items-center">
                    <div className="flex gap-5 items-center">
                      <div className="w-10 h-10 rounded-xl bg-amber-400 text-white flex items-center justify-center font-black text-sm">{p.queueNumber}</div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-700">{p.patientId?.name || p.patientName || 'Patient'}</h3>
                        <p className="text-xs text-amber-600 font-bold">{p.department} · Skipped</p>
                      </div>
                    </div>
                    <button onClick={() => callPatient(p._id)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2">
                      <Phone size={14} /> Re-Call
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Queue */}
          {queue.filter(p => p.status === 'completed').length > 0 && (
            <div>
              <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><CheckCircle size={14} /> Completed ({queue.filter(p => p.status === 'completed').length})</h3>
              <div className="space-y-3">
                {queue.filter(p => p.status === 'completed').map((p, i) => (
                  <div key={i} className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100 flex justify-between items-center">
                    <div className="flex gap-5 items-center">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm">✓</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-700">{p.patientId?.name || p.patientName || 'Patient'}</h3>
                          {p.isEmergency && <span className="px-2 py-1 bg-rose-100 text-rose-600 text-[10px] font-black uppercase rounded-lg">Emergency</span>}
                        </div>
                        <p className="text-xs text-emerald-600 font-bold">{p.department} · Consultation Complete</p>
                      </div>
                    </div>
                    <span className="px-4 py-2 bg-emerald-100 text-emerald-700 text-xs font-black rounded-xl uppercase">Done ✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Consultations */}
      {activeTab === 'consultations' && (
        <div className="animate-fade-in">
          {!activeConsultation ? (
            <div className="p-20 text-center bg-white rounded-3xl text-slate-400 font-black italic">No Case Active — Select a patient from the Queue</div>
          ) : consultationStep === 6 && completedReport ? (
            /* ===== COMPLETED REPORT VIEW ===== */
            <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-emerald-600" /></div>
                <h2 className="text-3xl font-black text-slate-900">Consultation Complete</h2>
                <p className="text-slate-400 font-medium mt-1">{completedReport.completedAt}</p>
              </div>
              
              <div className="space-y-6">
                {/* Patient Info */}
                <div className="bg-slate-50 p-5 rounded-2xl">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Patient</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-slate-800">{completedReport.patient}</span>
                    <span className="text-sm text-slate-500">{completedReport.department}</span>
                  </div>
                  {completedReport.isEmergency && <span className="inline-block mt-2 px-3 py-1 bg-rose-100 text-rose-600 text-xs font-black rounded-lg">🚨 EMERGENCY CASE</span>}
                </div>

                {/* Vitals Summary */}
                <div className="bg-blue-50 p-5 rounded-2xl">
                  <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3">Vitals Recorded</h3>
                  <div className="grid grid-cols-5 gap-4">
                    {[
                      { label: 'Temp', value: completedReport.vitals.temperature ? `${completedReport.vitals.temperature}°F` : '-' },
                      { label: 'BP', value: completedReport.vitals.bp || '-' },
                      { label: 'Heart Rate', value: completedReport.vitals.heartRate ? `${completedReport.vitals.heartRate} bpm` : '-' },
                      { label: 'SpO2', value: completedReport.vitals.spo2 ? `${completedReport.vitals.spo2}%` : '-' },
                      { label: 'Weight', value: completedReport.vitals.weight ? `${completedReport.vitals.weight} kg` : '-' }
                    ].map((v, i) => (
                      <div key={i} className="text-center">
                        <div className="text-lg font-black text-slate-800">{v.value}</div>
                        <div className="text-[10px] font-bold text-blue-400 uppercase">{v.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Diagnosis */}
                <div className="bg-amber-50 p-5 rounded-2xl">
                  <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2">Diagnosis</h3>
                  <p className="font-medium text-slate-800">{completedReport.diagnosis || 'No diagnosis recorded'}</p>
                </div>

                {/* Medications */}
                {completedReport.medications.length > 0 && (
                  <div className="bg-emerald-50 p-5 rounded-2xl">
                    <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-3">Prescribed Medications</h3>
                    <div className="space-y-2">
                      {completedReport.medications.map((med, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl">
                          <span className="font-bold text-slate-800">{med.name}</span>
                          <span className="text-sm text-slate-500">{med.dosage} · {med.frequency} · {med.duration}</span>
                        </div>
                      ))}
                    </div>
                    {completedReport.advice && <p className="mt-3 text-sm text-emerald-700 font-medium">Advice: {completedReport.advice}</p>}
                  </div>
                )}

                {/* Follow-up */}
                {completedReport.followUp.required && (
                  <div className="bg-purple-50 p-5 rounded-2xl">
                    <h3 className="text-xs font-black text-purple-500 uppercase tracking-widest mb-2">Follow-Up Scheduled</h3>
                    <p className="font-bold text-slate-800">Return after {completedReport.followUp.after} days</p>
                    {completedReport.followUp.instructions && <p className="text-sm text-purple-600 mt-1">{completedReport.followUp.instructions}</p>}
                  </div>
                )}

                {/* Payment */}
                <div className="bg-violet-50 p-5 rounded-2xl">
                  <h3 className="text-xs font-black text-violet-500 uppercase tracking-widest mb-2">Payment</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-slate-800">₹{completedReport.payment.amount}</span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-black rounded-lg uppercase">{completedReport.payment.method} — Paid ✓</span>
                  </div>
                </div>
              </div>

              <button onClick={() => { setActiveConsultation(null); setConsultationStep(1); setCompletedReport(null); setActiveTab('queue'); }} className="w-full mt-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-slate-800 transition-all">
                ← Back to Queue
              </button>
            </div>
          ) : (
            /* ===== CONSULTATION STEPS ===== */
            <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm max-w-4xl mx-auto">
              {/* Patient Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {activeConsultation.patientId?.name || activeConsultation.patientName}
                  </h2>
                  <p className="text-sm text-slate-400 font-bold">{activeConsultation.department} · {activeConsultation.chiefComplaint || 'Routine Checkup'}</p>
                </div>
                {activeConsultation.isEmergency && <span className="px-3 py-1 bg-rose-100 text-rose-600 text-sm font-black rounded-xl">🚨 EMERGENCY</span>}
              </div>

              {/* Step Progress Bar */}
              <div className="flex items-center gap-2 mb-10">
                {stepLabels.map((label, i) => (
                  <div key={i} className="flex items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${consultationStep > i + 1 ? 'bg-emerald-500 text-white' : consultationStep === i + 1 ? 'bg-teal-600 text-white shadow-lg shadow-teal-200' : 'bg-slate-100 text-slate-400'}`}>
                      {consultationStep > i + 1 ? '✓' : i + 1}
                    </div>
                    <span className={`ml-2 text-[10px] font-black uppercase tracking-wider hidden sm:block ${consultationStep === i + 1 ? 'text-teal-600' : 'text-slate-300'}`}>{label}</span>
                    {i < 4 && <div className={`flex-1 h-0.5 mx-2 ${consultationStep > i + 1 ? 'bg-emerald-300' : 'bg-slate-100'}`}></div>}
                  </div>
                ))}
              </div>

              {/* STEP 1: Vitals */}
              {consultationStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Thermometer size={20} className="text-teal-600" /> Record Vitals</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-2 block">Temperature (°F)</label>
                      <input type="number" step="0.1" placeholder="98.6" value={consultationData.vitals.temperature} onChange={(e) => setConsultationData({...consultationData, vitals: {...consultationData.vitals, temperature: e.target.value}})} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-teal-300" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-2 block">Blood Pressure (mmHg)</label>
                      <input type="text" placeholder="120/80" value={consultationData.vitals.bp} onChange={(e) => setConsultationData({...consultationData, vitals: {...consultationData.vitals, bp: e.target.value}})} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-teal-300" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-2 block">Heart Rate (bpm)</label>
                      <input type="number" placeholder="72" value={consultationData.vitals.heartRate} onChange={(e) => setConsultationData({...consultationData, vitals: {...consultationData.vitals, heartRate: e.target.value}})} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-teal-300" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-2 block">SpO2 (%)</label>
                      <input type="number" placeholder="98" value={consultationData.vitals.spo2} onChange={(e) => setConsultationData({...consultationData, vitals: {...consultationData.vitals, spo2: e.target.value}})} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-teal-300" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-2 block">Weight (kg)</label>
                      <input type="number" step="0.1" placeholder="70" value={consultationData.vitals.weight} onChange={(e) => setConsultationData({...consultationData, vitals: {...consultationData.vitals, weight: e.target.value}})} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-teal-300" />
                    </div>
                  </div>
                  <button onClick={() => setConsultationStep(2)} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-lg hover:bg-teal-700 transition-all">Next → Diagnosis</button>
                </div>
              )}

              {/* STEP 2: Diagnosis */}
              {consultationStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><FileText size={20} className="text-teal-600" /> Clinical Diagnosis</h3>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">Diagnosis / Clinical Observations</label>
                    <textarea placeholder="Enter detailed diagnosis, clinical findings, and observations..." value={consultationData.diagnosis} onChange={(e) => setConsultationData({...consultationData, diagnosis: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 font-medium outline-none focus:border-teal-300 resize-none h-40 placeholder:text-slate-300" />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setConsultationStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all">← Vitals</button>
                    <button onClick={() => setConsultationStep(3)} className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black text-lg hover:bg-teal-700 transition-all">Next → Medications</button>
                  </div>
                </div>
              )}

              {/* STEP 3: Medications */}
              {consultationStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Stethoscope size={20} className="text-teal-600" /> Prescribe Medications</h3>
                    <button onClick={addMedication} className="flex items-center gap-1 px-4 py-2 bg-teal-50 text-teal-700 rounded-xl font-bold text-sm hover:bg-teal-100 transition-all"><Plus size={16} /> Add</button>
                  </div>
                  <div className="space-y-3">
                    {consultationData.treatment.medications.map((med, i) => (
                      <div key={i} className="grid grid-cols-[1fr_0.7fr_0.7fr_0.7fr_auto] gap-2 items-end">
                        <div>
                          {i === 0 && <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Medicine</label>}
                          <input type="text" placeholder="Medicine name" value={med.name} onChange={(e) => updateMedication(i, 'name', e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold text-sm outline-none focus:border-teal-300" />
                        </div>
                        <div>
                          {i === 0 && <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Dosage</label>}
                          <input type="text" placeholder="500mg" value={med.dosage} onChange={(e) => updateMedication(i, 'dosage', e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold text-sm outline-none focus:border-teal-300" />
                        </div>
                        <div>
                          {i === 0 && <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Frequency</label>}
                          <select value={med.frequency} onChange={(e) => updateMedication(i, 'frequency', e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold text-sm outline-none focus:border-teal-300">
                            <option value="">Select</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Thrice daily">Thrice daily</option>
                            <option value="As needed">As needed</option>
                          </select>
                        </div>
                        <div>
                          {i === 0 && <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Duration</label>}
                          <select value={med.duration} onChange={(e) => updateMedication(i, 'duration', e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold text-sm outline-none focus:border-teal-300">
                            <option value="">Select</option>
                            <option value="3 days">3 days</option>
                            <option value="5 days">5 days</option>
                            <option value="7 days">7 days</option>
                            <option value="14 days">14 days</option>
                            <option value="30 days">30 days</option>
                          </select>
                        </div>
                        <button onClick={() => removeMedication(i)} className="p-3 text-rose-400 hover:text-rose-600 transition-all" disabled={consultationData.treatment.medications.length === 1}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">General Advice</label>
                    <textarea placeholder="Diet advice, precautions, lifestyle suggestions..." value={consultationData.treatment.advice} onChange={(e) => setConsultationData({...consultationData, treatment: {...consultationData.treatment, advice: e.target.value}})} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-medium outline-none focus:border-teal-300 resize-none h-20 placeholder:text-slate-300" />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setConsultationStep(2)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all">← Diagnosis</button>
                    <button onClick={() => setConsultationStep(4)} className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black text-lg hover:bg-teal-700 transition-all">Next → Follow-Up</button>
                  </div>
                </div>
              )}

              {/* STEP 4: Follow-Up */}
              {consultationStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Calendar size={20} className="text-teal-600" /> Follow-Up Appointment</h3>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-3 block">Does the patient need a follow-up visit?</label>
                    <div className="flex gap-3">
                      <button onClick={() => setConsultationData({...consultationData, followUp: {...consultationData.followUp, required: true}})} className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all border-2 ${consultationData.followUp.required ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        Yes — Schedule Follow-Up
                      </button>
                      <button onClick={() => setConsultationData({...consultationData, followUp: {...consultationData.followUp, required: false}})} className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all border-2 ${!consultationData.followUp.required ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        No — Not Required
                      </button>
                    </div>
                  </div>
                  {consultationData.followUp.required && (
                    <div className="space-y-4 p-5 bg-teal-50 rounded-2xl border border-teal-100">
                      <div>
                        <label className="text-xs font-bold text-teal-600 mb-2 block">Come back after (days)</label>
                        <div className="flex gap-2">
                          {['3', '5', '7', '10', '14', '30'].map(d => (
                            <button key={d} onClick={() => setConsultationData({...consultationData, followUp: {...consultationData.followUp, after: d}})} className={`px-4 py-3 rounded-xl font-black text-sm transition-all border-2 ${consultationData.followUp.after === d ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-100 hover:border-teal-200'}`}>
                              {d}d
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-teal-600 mb-2 block">Follow-Up Instructions</label>
                        <textarea placeholder="Special instructions for the next visit..." value={consultationData.followUp.instructions} onChange={(e) => setConsultationData({...consultationData, followUp: {...consultationData.followUp, instructions: e.target.value}})} className="w-full p-4 bg-white rounded-xl border-2 border-teal-100 font-medium outline-none focus:border-teal-300 resize-none h-20 placeholder:text-teal-200" />
                      </div>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <button onClick={() => setConsultationStep(3)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all">← Medications</button>
                    <button onClick={() => setConsultationStep(5)} className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black text-lg hover:bg-teal-700 transition-all">Next → Payment</button>
                  </div>
                </div>
              )}

              {/* STEP 5: Payment */}
              {consultationStep === 5 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><DollarSign size={20} className="text-teal-600" /> Payment & Billing</h3>
                  
                  {/* Bill Summary */}
                  <div className="bg-slate-50 p-6 rounded-2xl">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Bill Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Consultation Fee</span><span className="font-bold">₹500</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Medications ({consultationData.treatment.medications.filter(m => m.name).length})</span><span className="font-bold">₹{consultationData.treatment.medications.filter(m => m.name).length * 100}</span></div>
                      <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between"><span className="font-black text-slate-800">Total</span><span className="font-black text-xl text-teal-600">₹{500 + consultationData.treatment.medications.filter(m => m.name).length * 100}</span></div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-3 block">Payment Method</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setPaymentData({...paymentData, method: 'cash', amount: 500 + consultationData.treatment.medications.filter(m => m.name).length * 100})} className={`p-6 rounded-2xl font-black text-lg transition-all border-2 flex flex-col items-center gap-3 ${paymentData.method === 'cash' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        <Banknote size={32} />
                        Cash
                      </button>
                      <button onClick={() => setPaymentData({...paymentData, method: 'online', amount: 500 + consultationData.treatment.medications.filter(m => m.name).length * 100})} className={`p-6 rounded-2xl font-black text-lg transition-all border-2 flex flex-col items-center gap-3 ${paymentData.method === 'online' ? 'bg-violet-50 text-violet-700 border-violet-300 shadow-lg shadow-violet-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        <QrCode size={32} />
                        QR / UPI
                      </button>
                    </div>
                  </div>

                  {paymentData.method === 'online' && (
                    <div className="bg-violet-50 p-6 rounded-2xl text-center border border-violet-100">
                      <div className="w-40 h-40 bg-white rounded-2xl mx-auto flex items-center justify-center border-2 border-violet-200 mb-3">
                        <QrCode size={80} className="text-violet-300" />
                      </div>
                      <p className="text-sm font-bold text-violet-600">Scan QR code to pay ₹{paymentData.amount}</p>
                      <p className="text-xs text-violet-400 mt-1">UPI / Google Pay / PhonePe</p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button onClick={() => setConsultationStep(4)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all">← Follow-Up</button>
                    <button onClick={() => { setPaymentData(prev => ({...prev, amount: 500 + consultationData.treatment.medications.filter(m => m.name).length * 100})); handleCompleteConsultation(); }} disabled={isSubmitting} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all disabled:opacity-50">
                      {isSubmitting ? 'Processing...' : '✓ Complete & Generate Report'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Registration Modal Overlay */}
      {showRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6 animate-fade-in">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 relative">
             <button onClick={() => { setShowRegistration(false); setPatientSearch(''); setSearchResults([]); setRegistrationData(prev => ({ ...prev, patientId: '', visitType: 'new', chiefComplaint: '', severity: 'moderate', isEmergency: false })); }} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 z-10"><XCircle size={32}/></button>
             <h2 className="text-3xl font-black text-slate-900 mb-2">Enroll Patient</h2>
             <p className="text-slate-400 font-medium text-sm mb-8">Fill in the details below to add a patient to the OPD queue</p>

             <form onSubmit={handleRegisterPatient} className="space-y-8">

               {/* SECTION 1: Patient Search */}
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Step 1 — Find Patient</label>
                 <div className="relative">
                   <div className="flex items-center gap-3 w-full p-5 bg-slate-100 rounded-2xl">
                     <Search size={20} className="text-slate-400 shrink-0" />
                     <input type="text" placeholder="Search by name, email, or phone..." className="w-full bg-transparent border-none font-bold outline-none text-slate-800 placeholder:text-slate-300" value={patientSearch} onChange={(e) => handlePatientSearch(e.target.value)} />
                   </div>
                   {searchResults.length > 0 && (
                     <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-52 overflow-y-auto">
                       {searchResults.map((p) => (
                         <button type="button" key={p._id} onClick={() => selectPatient(p)} className="w-full text-left px-5 py-4 hover:bg-teal-50 transition-colors flex justify-between items-center border-b border-slate-50 last:border-none">
                           <div>
                             <div className="font-bold text-slate-800">{p.name}</div>
                             <div className="text-xs text-slate-400">{p.email}</div>
                           </div>
                           <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{p.gender} {p.age ? `• ${p.age}y` : ''}</span>
                         </button>
                       ))}
                     </div>
                   )}
                   {registrationData.patientId && (
                     <div className="mt-3 px-5 py-3 bg-teal-50 rounded-2xl text-sm font-bold text-teal-700 flex items-center gap-2 border border-teal-100">
                       <CheckCircle size={18} /> Patient selected: <span className="text-teal-900">{patientSearch}</span>
                     </div>
                   )}
                 </div>
               </div>

               <div className="border-t border-slate-100"></div>

               {/* SECTION 2: Visit Details */}
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Step 2 — Visit Details</label>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                   <div>
                     <label className="text-xs font-bold text-slate-500 mb-2 block">Visit Type</label>
                     <div className="grid grid-cols-2 gap-2">
                       {['new', 'followup', 'review', 'emergency'].map(type => (
                         <button type="button" key={type} onClick={() => setRegistrationData({...registrationData, visitType: type})} className={`py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2 ${registrationData.visitType === type ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-100' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200'}`}>
                           {type === 'followup' ? 'Follow-Up' : type}
                         </button>
                       ))}
                     </div>
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-500 mb-2 block">Department</label>
                     <select value={registrationData.department || ''} onChange={(e) => setRegistrationData({...registrationData, department: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold text-slate-800 outline-none focus:border-teal-300 transition-colors">
                       <option value="General Medicine">General Medicine</option>
                       <option value="Cardiology">Cardiology</option>
                       <option value="Orthopedics">Orthopedics</option>
                       <option value="Dermatology">Dermatology</option>
                       <option value="Neurology">Neurology</option>
                       <option value="Pediatrics">Pediatrics</option>
                       <option value="ENT">ENT</option>
                       <option value="Ophthalmology">Ophthalmology</option>
                       <option value="Gynecology">Gynecology</option>
                       <option value="Psychiatry">Psychiatry</option>
                     </select>
                   </div>
                 </div>
                 <div className="mb-4">
                   <label className="text-xs font-bold text-slate-500 mb-2 block">Assign Doctor</label>
                   <select value={registrationData.doctorId || ''} onChange={(e) => setRegistrationData({...registrationData, doctorId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold text-slate-800 outline-none focus:border-teal-300 transition-colors">
                     <option value="" disabled>Select a doctor...</option>
                     {doctors.map(doc => (
                       <option key={doc._id} value={doc._id}>{doc.name}{doc.department ? ` — ${doc.department}` : ''}{doc.speciality ? ` (${doc.speciality})` : ''}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 mb-2 block">Chief Complaint / Reason for Visit</label>
                   <textarea placeholder="Describe the patient's main concern..." value={registrationData.chiefComplaint || ''} onChange={(e) => setRegistrationData({...registrationData, chiefComplaint: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-medium text-slate-800 outline-none focus:border-teal-300 transition-colors resize-none h-24 placeholder:text-slate-300" />
                 </div>
               </div>

               <div className="border-t border-slate-100"></div>

               {/* SECTION 3: Severity & Emergency */}
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Step 3 — Severity & Priority</label>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-bold text-slate-500 mb-2 block">Severity Level</label>
                     <div className="flex gap-2">
                       {[
                         { value: 'mild', label: 'Mild', color: 'emerald' },
                         { value: 'moderate', label: 'Moderate', color: 'amber' },
                         { value: 'severe', label: 'Severe', color: 'rose' }
                       ].map(s => (
                         <button type="button" key={s.value} onClick={() => setRegistrationData({...registrationData, severity: s.value})} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2 ${registrationData.severity === s.value ? (s.color === 'emerald' ? 'bg-emerald-500 text-white border-emerald-500' : s.color === 'amber' ? 'bg-amber-500 text-white border-amber-500' : 'bg-rose-500 text-white border-rose-500') : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'}`}>
                           {s.label}
                         </button>
                       ))}
                     </div>
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-500 mb-2 block">Emergency Case?</label>
                     <button type="button" onClick={() => setRegistrationData({...registrationData, isEmergency: !registrationData.isEmergency})} className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all border-2 flex items-center justify-center gap-2 ${registrationData.isEmergency ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'}`}>
                       <AlertTriangle size={18} />
                       {registrationData.isEmergency ? '🚨 EMERGENCY — YES' : 'No — Regular Visit'}
                     </button>
                   </div>
                 </div>
               </div>

               <button type="submit" disabled={!registrationData.patientId || isSubmitting} className={`w-full py-5 text-white rounded-2xl font-black text-xl shadow-xl transition-all ${registrationData.patientId ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-200 hover:scale-[1.01]' : 'bg-slate-300 cursor-not-allowed shadow-none'}`}>
                 {isSubmitting ? 'Adding to Queue...' : registrationData.isEmergency ? '🚨 Add Emergency Patient' : 'Add Patient to Queue'}
               </button>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}
