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

  useEffect(() => {
    fetchCaregiverData();
  }, [activeTab]);

  const fetchCaregiverData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (activeTab === 'patients') {
        const patientsRes = await api.get('/caregiver/patients');
        setLinkedPatients(patientsRes.data || []);
      }
      
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

  const sendReminder = async (patientId, message) => {
    try {
      await api.post('/caregiver/send-reminder', {
        patientId,
        message,
        type: 'medication'
      });
      alert('Reminder sent successfully!');
      fetchCaregiverData();
    } catch (err) {
      alert('Failed to send reminder');
    }
  };

  const checkPatientStatus = async (patientId) => {
    try {
      const statusRes = await api.get(`/caregiver/patient-status/${patientId}`);
      alert(`Patient Status: ${statusRes.data.status}`);
    } catch (err) {
      alert('Failed to check patient status');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading caregiver dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Caregiver Dashboard</h1>
          <p className="text-slate-600 mt-1">Monitor and support your loved ones healthcare journey</p>
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
                <span className="font-semibold text-slate-900">Linked Patients</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{linkedPatients.length}</div>
              <div className="text-sm text-slate-600">Under your care</div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="text-red-600" size={24} />
                <span className="font-semibold text-slate-900">Health Alerts</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">2</div>
              <div className="text-sm text-slate-600">Active today</div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="text-blue-600" size={24} />
                <span className="font-semibold text-slate-900">Appointments</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">3</div>
              <div className="text-sm text-slate-600">This week</div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-emerald-600" size={24} />
                <span className="font-semibold text-slate-900">Response Time</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">2.5h</div>
              <div className="text-sm text-slate-600">Average</div>
            </div>
          </div>
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
                      <span className="text-slate-600">Blood Pressure: {patient.vitals?.bloodPressure || 'Normal'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="text-slate-600">Next Appointment: {patient.nextAppointment || 'Not scheduled'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Activity size={14} className="text-emerald-500" />
                      <span className="text-slate-600">Medication Adherence: {patient.adherence || '85%'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => sendReminder(patient._id, 'Time for your medication')}
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
    </div>
  );
}
