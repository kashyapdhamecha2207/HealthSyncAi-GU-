'use client';
import { useEffect, useState } from 'react';
import api from '../../../lib/axios';
import { 
  Users, DollarSign, Calendar, Activity, TrendingUp, 
  AlertTriangle, Clock, Settings, FileText, Search,
  Filter, Download, RefreshCw, Eye, Edit,
  Ban, CheckCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState({});
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab, dateRange, searchTerm]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'overview') {
        const statsRes = await api.get('/admin/dashboard/stats', {
          params: { dateRange }
        });
        setStats(statsRes.data || {});
      }
      
      if (activeTab === 'analytics') {
        const analyticsRes = await api.get('/admin/analytics', {
          params: { type: 'overview', period: dateRange }
        });
        setAnalytics(analyticsRes.data || {});
      }
      
      if (activeTab === 'users') {
        const usersRes = await api.get('/admin/users', {
          params: { search: searchTerm }
        });
        setUsers(usersRes.data.users || []);
      }
      
      if (activeTab === 'doctors') {
        const doctorsRes = await api.get('/admin/users', {
          params: { role: 'doctor', search: searchTerm }
        });
        setDoctors(doctorsRes.data.users || []);
      }
      
      if (activeTab === 'logs') {
        const logsRes = await api.get('/admin/logs');
        setLogs(logsRes.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status });
      fetchDashboardData();
      alert(`User status updated to ${status}`);
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const exportData = (type) => {
    // Mock export functionality
    console.log(`Exporting ${type} data...`);
    alert(`${type} data would be exported here`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading admin dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">System management and operations analytics</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button 
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          { id: 'doctors', label: 'Doctors', icon: Users },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'logs', label: 'System Logs', icon: FileText }
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-blue-600" size={24} />
                <span className="font-semibold text-slate-900">Total Users</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stats.users?.total || 0}</div>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <span className="text-slate-600">Doctors:</span>
                  <span className="ml-2 font-medium">{stats.users?.doctors || 0}</span>
                </div>
                <div>
                  <span className="text-slate-600">Patients:</span>
                  <span className="ml-2 font-medium">{stats.users?.patients || 0}</span>
                </div>
              </div>
              <div className="mt-3 text-sm text-emerald-600">
                <TrendingUp size={14} className="inline mr-1" />
                +{stats.users?.growth || 0}% growth
              </div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="text-purple-600" size={24} />
                <span className="font-semibold text-slate-900">Appointments</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stats.appointments?.total || 0}</div>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <span className="text-slate-600">Completed:</span>
                  <span className="ml-2 font-medium">{stats.appointments?.completed || 0}</span>
                </div>
                <div>
                  <span className="text-slate-600">No-Shows:</span>
                  <span className="ml-2 font-medium text-red-600">{stats.appointments?.noShows || 0}</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm text-emerald-600">
                  Completion Rate: {stats.appointments?.completionRate || 0}%
                </div>
                <div className="text-sm text-amber-600">
                  No-Show Rate: {stats.appointments?.noShowRate || 0}%
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="text-teal-600" size={24} />
                <span className="font-semibold text-slate-900">Revenue</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">${stats.revenue?.total || 0}</div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="text-emerald-600">
                  Protected from no-shows: ${stats.revenue?.protectedFromNoShows || 0}
                </div>
                <div className="text-blue-600">
                  Projected: ${stats.revenue?.projected || 0}
                </div>
                <div className="text-emerald-600">
                  <TrendingUp size={14} className="inline mr-1" />
                  +{stats.revenue?.growth || 0}% growth
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="text-emerald-600" size={24} />
                <span className="font-semibold text-slate-900">OPD Operations</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stats.opd?.totalVisits || 0}</div>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <span className="text-slate-600">Emergency:</span>
                  <span className="ml-2 font-medium">{stats.opd?.emergencyCases || 0}</span>
                </div>
                <div>
                  <span className="text-slate-600">Utilization:</span>
                  <span className="ml-2 font-medium">{stats.opd?.utilization || 0}%</span>
                </div>
              </div>
              <div className="mt-3 text-sm text-amber-600">
                <Clock size={14} className="inline mr-1" />
                Avg Wait: {stats.opd?.avgWaitTime || 0}m
              </div>
            </div>
          </div>

          {/* Patient Satisfaction */}
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Patient Satisfaction Metrics</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{stats.satisfaction?.overall || 0}</div>
                <div className="text-sm text-slate-600">Overall Rating</div>
                <div className="text-xs text-amber-500 mt-1">out of 5.0</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{stats.satisfaction?.waitTimeSatisfaction || 0}</div>
                <div className="text-sm text-slate-600">Wait Time</div>
                <div className="text-xs text-amber-500 mt-1">out of 5.0</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{stats.satisfaction?.communicationSatisfaction || 0}</div>
                <div className="text-sm text-slate-600">Communication</div>
                <div className="text-xs text-amber-500 mt-1">out of 5.0</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{stats.satisfaction?.responseTime || 0}h</div>
                <div className="text-sm text-slate-600">Response Time</div>
                <div className="text-xs text-amber-500 mt-1">average</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">System Analytics</h2>
            <div className="flex gap-3">
              <button 
                onClick={() => exportData('analytics')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                <Download size={18} /> Export Report
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* System Health */}
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity size={20} className="text-emerald-600" />
                System Health
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Uptime:</span>
                  <span className="font-medium text-emerald-600">{analytics.systemHealth?.uptime || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Response Time:</span>
                  <span className="font-medium">{analytics.systemHealth?.responseTime || 0}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Error Rate:</span>
                  <span className="font-medium text-amber-600">{analytics.systemHealth?.errorRate || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Active Users:</span>
                  <span className="font-medium">{analytics.systemHealth?.activeUsers || 0}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                Performance Metrics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Avg Consultation Time:</span>
                  <span className="font-medium">{analytics.performance?.avgConsultationTime || 0}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Patient Throughput:</span>
                  <span className="font-medium">{analytics.performance?.patientThroughput || 0}/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Bed Occupancy:</span>
                  <span className="font-medium">{analytics.performance?.bedOccupancy || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Resource Utilization:</span>
                  <span className="font-medium">{analytics.performance?.resourceUtilization || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctors Tab */}
      {activeTab === 'doctors' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Doctors List</h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 w-64"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div key={doctor._id} className="glass p-6 rounded-2xl hover:shadow-lg transition-all border border-slate-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {doctor.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{doctor.name}</h4>
                      <p className="text-sm text-slate-500">{doctor.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${
                    doctor.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {doctor.status || 'active'}
                  </span>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Active Cases</span>
                    <span className={`font-bold ${doctor.stats?.activeConsultations > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {doctor.stats?.activeConsultations || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Patients</span>
                    <span className="font-semibold text-slate-900">{doctor.stats?.totalPatients || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Department</span>
                    <span className="font-semibold text-slate-900">{doctor.department || 'General Medicine'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Speciality</span>
                    <span className="font-semibold text-slate-900">{doctor.speciality || 'General Practice'}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-bold transition-all">
                    View Profile
                  </button>
                  <button className="flex-1 py-2 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-lg text-sm font-bold transition-all">
                    Assign Dept
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {doctors.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl text-slate-400 font-bold italic border border-slate-100 shadow-sm">
              No doctors found matching your search.
            </div>
          )}
        </div>
      )}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">User Management</h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 w-64"
                />
              </div>
              <button 
                onClick={() => exportData('users')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                <Download size={18} /> Export Users
              </button>
            </div>
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 mr-3">
                            {user.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{user.name}</div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye size={16} />
                          </button>
                          <button className="text-amber-600 hover:text-amber-900">
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => updateUserStatus(user._id, user.status === 'active' ? 'suspended' : 'active')}
                            className={user.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-emerald-600 hover:text-emerald-900'}
                          >
                            {user.status === 'active' ? <Ban size={16} /> : <CheckCircle size={16} />}
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

      {/* System Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">System Logs</h2>
            <div className="flex gap-3">
              <select className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                <option value="">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              <button 
                onClick={() => exportData('logs')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                <Download size={18} /> Export Logs
              </button>
            </div>
          </div>

          <div className="glass rounded-2xl">
            <div className="divide-y divide-slate-200">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      log.level === 'error' ? 'bg-red-500' :
                      log.level === 'warning' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          log.level === 'error' ? 'bg-red-100 text-red-700' :
                          log.level === 'warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          {log.type}
                        </span>
                        <span className="text-sm text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-900 font-medium">{log.message}</div>
                      {log.userId && (
                        <div className="text-sm text-slate-600 mt-1">
                          User ID: {log.userId}
                        </div>
                      )}
                      {log.details && (
                        <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-700">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
