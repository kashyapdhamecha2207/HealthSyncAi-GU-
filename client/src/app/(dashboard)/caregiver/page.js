'use client';
import { useEffect, useState } from 'react';
import api from '../../../lib/axios';
import { 
  Users, Heart, Calendar, Phone, Mail, 
  Activity, AlertCircle, CheckCircle, Clock
} from 'lucide-react';

export default function CaregiverDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [linkedPatients, setLinkedPatients] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminderModal, setReminderModal] = useState(null);
  const [reminderMsg, setReminderMsg] = useState('');
  const [reminderType, setReminderType] = useState('medication');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchCaregiverData();
  }, [activeTab]);

  const fetchCaregiverData = async () => {
    try {
      // Always load patients for overview counts
      const patientsRes = await api.get('/caregiver/patients');
      setLinkedPatients(patientsRes.data || []);
      
      if (activeTab === 'notifications') {
        const notificationsRes = await api.get('/caregiver/notifications');
        setNotifications(notificationsRes.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch caregiver data:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async () => {
    if (!reminderModal || !reminderMsg.trim()) return;
    setSending(true);
    try {
      const res = await api.post('/caregiver/send-reminder', {
        patientId: reminderModal._id,
        message: reminderMsg,
        type: reminderType
      });
      alert(res.data.message || 'Reminder sent!');
      setReminderModal(null);
      setReminderMsg('');
      setReminderType('medication');
    } catch (err) {
      alert('Failed to send reminder');
    } finally {
      setSending(false);
    }
  };

  const checkPatientStatus = async (patientId) => {
    try {
      const statusRes = await api.get(`/caregiver/patient-status/${patientId}`);
      const s = statusRes.data;
      alert(`Patient: ${s.patient?.name}\nStatus: ${s.status}\nTotal Visits: ${s.stats?.totalVisits}\nEmergency Visits: ${s.stats?.emergencyVisits}\nMedications: ${s.currentMedications?.map(m => m.name).join(', ') || 'None'}`);
    } catch (err) {
      alert('Failed to check patient status');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading caregiver dashboard...</div>;

  const patientsWithUpcoming = linkedPatients.filter(p => p.nextAppointment);
  const emergencyPatients = linkedPatients.filter(p => p.vitals?.temperature > 100 || p.vitals?.heartRate > 100);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Caregiver Dashboard</h1>
          <p className="text-slate-600 mt-1">Monitor and support your patients healthcare journey</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'patients', label: 'Linked Patients', icon: Users },
          { id: 'notifications', label: 'Notifications', icon: Mail }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'text-purple-600 border-purple-600'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-purple-600" size={24} />
                <span className="font-semibold text-slate-900">Total Patients</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{linkedPatients.length}</div>
              <div className="text-sm text-slate-600">Registered in system</div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="text-red-600" size={24} />
                <span className="font-semibold text-slate-900">Health Alerts</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{emergencyPatients.length}</div>
              <div className="text-sm text-slate-600">Elevated vitals</div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="text-blue-600" size={24} />
                <span className="font-semibold text-slate-900">Upcoming Appts</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{patientsWithUpcoming.length}</div>
              <div className="text-sm text-slate-600">Patients with appointments</div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="text-emerald-600" size={24} />
                <span className="font-semibold text-slate-900">Active Meds</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{linkedPatients.filter(p => p.medications?.length > 0).length}</div>
              <div className="text-sm text-slate-600">Patients on medication</div>
            </div>
          </div>

          {/* Recent patients summary */}
          {linkedPatients.length > 0 && (
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Patient Activity</h3>
              <div className="space-y-3">
                {linkedPatients.filter(p => p.lastVisit).slice(0, 5).map(p => (
                  <div key={p._id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-none">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">{p.name?.substring(0, 2).toUpperCase()}</div>
                      <div>
                        <span className="font-medium text-slate-900">{p.name}</span>
                        <span className="text-sm text-slate-500 ml-2">{p.department}</span>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : 'No visits'}
                      {p.medications?.length > 0 && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{p.medications.length} meds</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Linked Patients Tab */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Linked Patients</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              <Users size={16} /> Link New Patient
            </button>
          </div>

          {linkedPatients.length === 0 ? (
            <div className="p-8 text-center glass rounded-2xl text-slate-500">
              <Users size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Patients Linked</h3>
              <p>Start by linking patients to monitor their healthcare journey.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {linkedPatients.map((patient) => (
                <div key={patient._id} className="glass p-6 rounded-2xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center font-bold text-purple-700 uppercase">
                        {patient.name?.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{patient.name}</div>
                        <div className="text-sm text-slate-600">{patient.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Heart size={14} className="text-red-500" />
                      <span className="text-slate-600">BP: {patient.vitals?.bloodPressure ? `${patient.vitals.bloodPressure.systolic}/${patient.vitals.bloodPressure.diastolic}` : 'No record'} {patient.vitals?.heartRate ? `· HR: ${patient.vitals.heartRate}bpm` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="text-slate-600">Next Appt: {patient.nextAppointment || 'Not scheduled'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Activity size={14} className="text-emerald-500" />
                      <span className="text-slate-600">Visits: {patient.totalVisits || 0} · Meds: {patient.medications?.length > 0 ? patient.medications.join(', ') : 'None'}</span>
                    </div>
                    {patient.lastVisit && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-amber-500" />
                        <span className="text-slate-600">Last visit: {new Date(patient.lastVisit).toLocaleDateString()} · {patient.department}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => { setReminderModal(patient); setReminderMsg(''); setReminderType('medication'); }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      <Mail size={14} />
                      Send Reminder
                    </button>
                    <button 
                      onClick={() => checkPatientStatus(patient._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm"
                    >
                      <Activity size={14} />
                      Check Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Recent Notifications</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              <Mail size={16} /> Send Alert
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center glass rounded-2xl text-slate-500">
              <Mail size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Notifications</h3>
              <p>All patient activities and alerts will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification._id} className="glass p-6 rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === 'alert' ? 'bg-red-500' :
                      notification.type === 'reminder' ? 'bg-orange-500' :
                      'bg-emerald-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          notification.type === 'alert' ? 'bg-red-100 text-red-700' :
                          notification.type === 'reminder' ? 'bg-orange-100 text-orange-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {notification.type.toUpperCase()}
                        </span>
                        <span className="text-sm text-slate-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="font-medium text-slate-900">{notification.message}</div>
                      {notification.patientName && (
                        <div className="text-sm text-slate-600 mt-1">
                          Patient: {notification.patientName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reminder Modal */}
      {reminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button onClick={() => setReminderModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Send Reminder</h3>
            <p className="text-sm text-slate-500 mb-6">To: <span className="font-semibold text-slate-700">{reminderModal.name}</span> ({reminderModal.email})</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase">Type</label>
                <div className="flex gap-2">
                  <button onClick={() => setReminderType('medication')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border-2 ${reminderType === 'medication' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                    💊 Medication
                  </button>
                  <button onClick={() => setReminderType('general')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border-2 ${reminderType === 'general' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                    💬 General
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase">Message</label>
                <textarea
                  value={reminderMsg}
                  onChange={(e) => setReminderMsg(e.target.value)}
                  placeholder={reminderType === 'medication' ? 'Time to take your medication...' : 'Your message to the patient...'}
                  className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-medium outline-none focus:border-purple-300 resize-none h-28 placeholder:text-slate-300"
                />
              </div>

              {reminderType === 'medication' && reminderModal.medications?.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-xl">
                  <p className="text-xs font-bold text-blue-500 mb-1">Current Medications:</p>
                  <p className="text-sm font-medium text-blue-700">{reminderModal.medications.join(', ')}</p>
                </div>
              )}

              <button
                onClick={sendReminder}
                disabled={!reminderMsg.trim() || sending}
                className={`w-full py-3 text-white rounded-xl font-bold transition-all ${!reminderMsg.trim() || sending ? 'bg-slate-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200'}`}
              >
                {sending ? 'Sending...' : `📧 Send Email to ${reminderModal.name}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
