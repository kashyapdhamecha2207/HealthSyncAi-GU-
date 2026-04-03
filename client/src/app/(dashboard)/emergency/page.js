'use client';
import { useEffect, useState } from 'react';
import api from '../../../lib/axios';
import { 
  AlertTriangle, Users, Clock, Activity, TrendingUp,
  Phone, MapPin, Ambulance, Bell, RefreshCw,
  Filter, Search, Calendar, Eye, CheckCircle
} from 'lucide-react';

export default function EmergencyDashboard() {
  const [activeTab, setActiveTab] = useState('priority-queue');
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    fetchEmergencyData();
  }, [activeTab, selectedDepartment]);

  const fetchEmergencyData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'priority-queue') {
        const queueRes = await api.get('/emergency/priority-queue', {
          params: { department: selectedDepartment !== 'all' ? selectedDepartment : undefined }
        });
        setPriorityQueue(queueRes.data.data || []);
      }
      
      if (activeTab === 'stats') {
        const statsRes = await api.get('/emergency/stats', { 
          params: { period: '24h' } 
        });
        setStats(statsRes.data || {});
      }
    } catch (err) {
      console.error('Failed to fetch emergency data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createPrioritySlot = async (patientId, emergencyLevel) => {
    try {
      await api.post('/emergency/priority-slot', {
        patientId,
        emergencyLevel,
        duration: emergencyLevel === 'critical' ? 30 : 25
      });
      
      alert('Priority slot created successfully!');
      fetchEmergencyData(); // Refresh queue
    } catch (err) {
      alert('Failed to create priority slot');
    }
  };

  const getPriorityColor = (level) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getPriorityIcon = (type) => {
    switch (type) {
      case 'emergency': return <AlertTriangle size={16} className="text-red-600" />;
      case 'high_risk': return <Bell size={16} className="text-amber-600" />;
      default: return <Activity size={16} className="text-blue-600" />;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading emergency dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Emergency Priority Routing</h1>
          <p className="text-slate-600 mt-1">Real-time emergency detection and priority patient management</p>
        </div>
        <button 
          onClick={fetchEmergencyData}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {/* Emergency Statistics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="glass p-6 rounded-2xl border-l-4 border-red-500">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-600" size={24} />
            <span className="font-semibold text-slate-900">Total Emergencies</span>
          </div>
          <div className="text-3xl font-bold text-red-600">{stats.total || 0}</div>
          <div className="text-sm text-slate-600">Last 24 hours</div>
        </div>

        <div className="glass p-6 rounded-2xl border-l-4 border-amber-500">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="text-amber-600" size={24} />
            <span className="font-semibold text-slate-900">Critical Cases</span>
          </div>
          <div className="text-3xl font-bold text-amber-600">{stats.critical || 0}</div>
          <div className="text-sm text-slate-600">Requiring immediate attention</div>
        </div>

        <div className="glass p-6 rounded-2xl border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="text-blue-600" size={24} />
            <span className="font-semibold text-slate-900">Avg Response Time</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">{stats.responseTime || 0}m</div>
          <div className="text-sm text-slate-600">From detection to response</div>
        </div>

        <div className="glass p-6 rounded-2xl border-l-4 border-emerald-500">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-emerald-600" size={24} />
            <span className="font-semibold text-slate-900">Peak Hours</span>
          </div>
          <div className="text-lg font-bold text-emerald-600">
            {stats.trends?.peakHours?.join(', ') || '09:00, 14:00, 18:00'}
          </div>
          <div className="text-sm text-slate-600">Highest activity periods</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        {[
          { id: 'priority-queue', label: 'Priority Queue', icon: Users },
          { id: 'stats', label: 'Emergency Stats', icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'text-red-600 border-red-600'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Priority Queue Tab */}
      {activeTab === 'priority-queue' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Priority Queue</h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 w-64"
                />
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Departments</option>
                <option value="emergency">Emergency</option>
                <option value="cardiology">Cardiology</option>
                <option value="general">General Medicine</option>
                <option value="pediatrics">Pediatrics</option>
              </select>
            </div>
          </div>

          {priorityQueue.length === 0 ? (
            <div className="p-8 text-center glass rounded-2xl text-slate-500">
              <AlertTriangle size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Priority Cases</h3>
              <p>No emergency or high-risk patients currently in the queue.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {priorityQueue.map((patient, index) => (
                <div key={patient.id} className={`glass p-6 rounded-2xl border-l-4 ${
                  patient.type === 'emergency' ? 'border-red-500' :
                  patient.type === 'high_risk' ? 'border-amber-500' :
                  'border-blue-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(patient.type)}
                          <span className="text-lg font-bold text-slate-900">
                            #{index + 1}
                          </span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(
                          patient.emergencyLevel || (patient.type === 'emergency' ? 'critical' : 'high')
                        )}`}>
                          {patient.emergencyLevel || 'HIGH PRIORITY'}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-slate-600">Patient:</span>
                          <div className="font-medium text-slate-900">
                            {patient.patientId?.name || 'Unknown Patient'}
                          </div>
                          <div className="text-sm text-slate-500">
                            {patient.patientId?.email}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-slate-600">Doctor:</span>
                          <div className="font-medium text-slate-900">
                            Dr. {patient.doctorId?.name || 'Unassigned'}
                          </div>
                          <div className="text-sm text-slate-500">
                            {patient.doctorId?.department || 'No department'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <span className="text-sm text-slate-600">Chief Complaint:</span>
                        <div className="font-medium text-slate-900">{patient.chiefComplaint}</div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span>Wait Time: {patient.waitTime || 0}m</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>Est. Duration: {patient.estimatedDuration}m</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={14} />
                          <span>{patient.patientId?.phone || 'No phone'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <button 
                        onClick={() => createPrioritySlot(patient.patientId?._id, patient.emergencyLevel)}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Ambulance size={14} />
                        Create Priority Slot
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm">
                        <Eye size={14} />
                        View Details
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm">
                        <CheckCircle size={14} />
                        Mark as Seen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Emergency Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Emergency Statistics</h2>
            <div className="flex gap-3">
              <select className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500">
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Emergency Trends */}
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-red-600" />
                Emergency Trends
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Emergencies:</span>
                  <span className="font-medium text-red-600">{stats.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Critical Cases:</span>
                  <span className="font-medium text-red-600">{stats.critical || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Average Per Day:</span>
                  <span className="font-medium">{stats.trends?.avgPerDay || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Trend:</span>
                  <span className={`font-medium ${stats.trends?.increasing ? 'text-red-600' : 'text-emerald-600'}`}>
                    {stats.trends?.increasing ? '↑ Increasing' : '↓ Decreasing'}
                  </span>
                </div>
              </div>
            </div>

            {/* Department Distribution */}
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-blue-600" />
                Department Distribution
              </h3>
              <div className="space-y-3">
                {stats.byDepartment?.map((dept, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-slate-600">{dept._id}:</span>
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{dept.count}</div>
                      <div className="w-20 bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((dept.count / 20) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Response Metrics */}
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-emerald-600" />
              Response Metrics
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.responseTime || 0}m</div>
                <div className="text-sm text-slate-600">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">95%</div>
                <div className="text-sm text-slate-600">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
