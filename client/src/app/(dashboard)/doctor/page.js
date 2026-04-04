'use client';
import { useEffect, useState } from 'react';
import api from '../../../lib/axios';
import { 
  Activity, Bell, AlertTriangle, Users, Calendar, TrendingUp, 
  Clock, MessageSquare, Phone, Mail, CheckCircle, XCircle,
  UserPlus, Filter, Search, RefreshCw, Pill
} from 'lucide-react';

export default function DoctorDashboard() {
  const [queue, setQueue] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [refillRequests, setRefillRequests] = useState([]);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    highRiskPatients: 0,
    avgWaitTime: 0,
    pendingRefills: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchDashboardData();
    fetchRefillRequests();
    // In a real app, setup websocket for real-time updates
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [queueRes, appointmentsRes, patientsRes, statsRes] = await Promise.all([
        api.get('/appointments/queue/live'),
        api.get('/appointments'),
        api.get('/doctor/patients'),
        api.get('/doctor/dashboard/stats', { 
          params: { dateRange: 'today' } 
        })
      ]);

      setQueue(queueRes.data);
      setAppointments(appointmentsRes.data);
      setPatients(patientsRes.data || []);
      setStats(statsRes.data || {});

      // Calculate stats
      const today = new Date().toDateString();
      const todayApps = appointmentsRes.data.filter(app => 
        new Date(app.date).toDateString() === today
      );
      
      const highRiskCount = todayApps.filter(app => app.riskLevel === 'HIGH').length;
      const avgWait = queueRes.data.length > 0 ? 15 : 0; // Mock calculation

      setStats({
        todayAppointments: todayApps.length,
        totalPatients: patientsRes.data?.length || 0,
        highRiskPatients: highRiskCount,
        avgWaitTime: avgWait
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefillRequests = async () => {
    try {
      const res = await api.get('/refills');
      const requests = res.data.data || [];
      setRefillRequests(requests);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingRefills: requests.length
      }));
    } catch (err) {
      console.error("Failed to fetch refill requests:", err);
      setRefillRequests([]);
    }
  };

  const handleAcceptRefill = async (requestId) => {
    try {
      await api.patch(`/refills/${requestId}`, { status: 'approved' });
      
      // Refresh list and stats
      fetchRefillRequests();
      alert('Refill request approved successfully!');
    } catch (err) {
      console.error("Approval error:", err);
      alert('Failed to approve refill request');
    }
  };

  const handleRejectRefill = async (requestId) => {
    try {
      await api.patch(`/refills/${requestId}`, { status: 'rejected' });
      
      // Refresh list and stats
      fetchRefillRequests();
      alert('Refill request rejected!');
    } catch (err) {
      console.error("Rejection error:", err);
      alert('Failed to reject refill request');
    }
  };

  const triggerSmartAction = async (userId, actionType) => {
    try {
      let message, channels;
      
      switch (actionType) {
        case 'urgent':
          message = "URGENT: Your appointment is scheduled soon. Please confirm your attendance immediately.";
          channels = ['sms', 'whatsapp', 'email'];
          break;
        case 'reminder':
          message = "Friendly reminder about your upcoming appointment. We look forward to seeing you!";
          channels = ['sms', 'email'];
          break;
        case 'followup':
          message = "Following up on your recent appointment. How are you feeling? Any concerns to discuss?";
          channels = ['email', 'whatsapp'];
          break;
        default:
          message = "HealthSync AI+ notification";
          channels = ['in-app'];
      }

      await api.post('/notifications', {
        userId,
        message,
        type: actionType,
        channels,
        priority: actionType === 'urgent' ? 'high' : 'normal'
      });

      alert(`Smart ${actionType} action triggered successfully!`);
    } catch(err) {
      console.error("Failed to trigger smart action:", err);
      alert("Failed to send notification. Please try again.");
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await api.patch(`/doctor/appointments/${appointmentId}/status`, { status });
      fetchDashboardData(); // Refresh data
      alert(`Appointment marked as ${status}`);
    } catch (err) {
      alert("Failed to update appointment status");
    }
  };

  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = app.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Doctor Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage patients and appointments with AI insights</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="text-blue-600" size={24} />
            <span className="font-semibold text-slate-900">Today's Appointments</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.todayAppointments}</div>
          <div className="text-sm text-slate-600">Scheduled today</div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-teal-600" size={24} />
            <span className="font-semibold text-slate-900">Total Patients</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalPatients}</div>
          <div className="text-sm text-slate-600">Under your care</div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-600" size={24} />
            <span className="font-semibold text-slate-900">High Risk Patients</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.highRiskPatients}</div>
          <div className="text-sm text-slate-600">Need attention</div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Pill className="text-purple-600" size={24} />
            <span className="font-semibold text-slate-900">Pending Refills</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.pendingRefills}</div>
          <div className="text-sm text-slate-600">Awaiting approval</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        {[
          { id: 'queue', label: 'Live Queue', icon: Users },
          { id: 'appointments', label: 'All Appointments', icon: Calendar },
          { id: 'patients', label: 'Patient Management', icon: UserPlus },
          { id: 'refills', label: 'Refill Requests', icon: Pill }
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
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold text-slate-900">Today's Queue</h2>
            <span className="relative flex h-3 w-3 inline-flex">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="p-8 text-center glass rounded-2xl text-slate-500">
              <Users size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No patients in queue</h3>
              <p>No appointments scheduled for today or all patients have been seen.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((app, idx) => (
                <div key={app._id} className="glass p-6 rounded-2xl">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="text-4xl font-black text-slate-200 w-12 text-center">#{idx + 1}</div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{app.patientId?.name || 'Unknown Patient'}</h3>
                        <div className="text-slate-500 mt-1 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> {app.time}
                          </span>
                          <span>Est. {app.estimatedDuration} min</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm border 
                        ${app.riskLevel === 'HIGH' ? 'bg-red-50 text-red-600 border-red-200' : 
                          app.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                          'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                        <Activity size={16} /> 
                        AI Risk: {app.riskLevel}
                      </div>

                      {app.riskLevel === 'HIGH' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => triggerSmartAction(app.patientId?._id, 'urgent')}
                            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            <Phone size={14}/> Urgent
                          </button>
                          <button 
                            onClick={() => triggerSmartAction(app.patientId?._id, 'reminder')}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <MessageSquare size={14}/> Remind
                          </button>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateAppointmentStatus(app._id, 'completed')}
                          className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm"
                        >
                          <CheckCircle size={14}/> Complete
                        </button>
                        <button 
                          onClick={() => updateAppointmentStatus(app._id, 'no-show')}
                          className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
                        >
                          <XCircle size={14}/> No Show
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Appointments Tab */}
      {activeTab === 'appointments' && (
        <div>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-slate-900">All Appointments</h2>
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
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="no-show">No Show</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Risk Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAppointments.map(app => (
                    <tr key={app._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{app.patientId?.name || 'Unknown'}</div>
                        <div className="text-sm text-slate-500">{app.patientId?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {new Date(app.date).toLocaleDateString()} at {app.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          app.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          app.status === 'no-show' ? 'bg-red-100 text-red-800' :
                          app.status === 'cancelled' ? 'bg-slate-100 text-slate-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          app.riskLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                          app.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {app.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => triggerSmartAction(app.patientId?._id, 'followup')}
                            className="text-teal-600 hover:text-teal-900"
                            title="Send Follow-up Email"
                          >
                            <Mail size={16} />
                          </button>
                          <button 
                            onClick={() => triggerSmartAction(app.patientId?._id, 'reminder')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Send Message/Reminder"
                          >
                            <MessageSquare size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Patient Management Tab */}
      {activeTab === 'patients' && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Patient Management</h2>
          
          {patients.length === 0 ? (
            <div className="p-8 text-center glass rounded-2xl text-slate-500">
              <UserPlus size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No patients found</h3>
              <p>Patients will appear here once they book appointments with you.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients.map(patient => (
                <div key={patient._id} className="glass p-6 rounded-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                      <span className="text-teal-600 font-bold text-lg">
                        {patient.name?.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                      <p className="text-sm text-slate-500">{patient.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Appointments:</span>
                      <span className="font-medium">{patient.appointmentCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Adherence Rate:</span>
                      <span className="font-medium">{patient.adherenceRate || 100}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Last Visit:</span>
                      <span className="font-medium">
                        {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => triggerSmartAction(patient._id, 'followup')}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm"
                    >
                      <Mail size={14} /> Follow Up
                    </button>
                    <button 
                      onClick={() => triggerSmartAction(patient._id, 'reminder')}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      <MessageSquare size={14} /> Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Refill Requests Tab */}
      {activeTab === 'refills' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Medication Refill Requests</h2>
            <button 
              onClick={fetchRefillRequests}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {refillRequests.length === 0 ? (
              <div className="text-center py-12">
                <Pill size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No refill requests</p>
                <p className="text-sm text-slate-500 mt-2">Patients will appear here when they request medication refills</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {refillRequests.map(request => (
                  <div key={request._id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Pill size={20} className="text-purple-600" />
                          <div>
                            <h3 className="font-semibold text-slate-900">{request.medicationName}</h3>
                            <p className="text-sm text-slate-600">Patient: {request.patientId?.name || 'Unknown'}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            request.status === 'approved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {request.status?.toUpperCase() || 'PENDING'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Dosage</p>
                            <p className="font-medium text-slate-900">{request.dosage}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Frequency</p>
                            <p className="font-medium text-slate-900">{request.frequency}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Requested</p>
                            <p className="font-medium text-slate-900">{request.requestedDate}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Last Refill</p>
                            <p className="font-medium text-slate-900">{request.lastRefillDate || 'Never'}</p>
                          </div>
                        </div>

                        {request.notes && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-700">{request.notes}</p>
                          </div>
                        )}
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleAcceptRefill(request._id)}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <CheckCircle size={16} /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectRefill(request._id)}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            <XCircle size={16} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
