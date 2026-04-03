'use client';
import { useState, useEffect } from 'react';
import api from '../../../../lib/axios';
import { Calendar, Clock, FileText, Heart, Activity, Pill, AlertTriangle, TrendingUp, X } from 'lucide-react';

export default function HealthTimeline() {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockTimeline = [
        {
          id: '1',
          date: '2026-01-15',
          type: 'appointment',
          title: 'Initial Health Assessment',
          description: 'Comprehensive health evaluation with Dr. Sarah Johnson',
          status: 'completed',
          doctor: 'Dr. Sarah Johnson',
          location: 'HealthSync Medical Center'
        },
        {
          id: '2',
          date: '2026-02-01',
          type: 'medication',
          title: 'Started Metformin',
          description: 'Prescribed 500mg Metformin for diabetes management',
          status: 'active',
          doctor: 'Dr. Michael Chen',
          location: 'HealthSync Pharmacy'
        },
        {
          id: '3',
          date: '2026-02-15',
          type: 'lab-result',
          title: 'Blood Work Results',
          description: 'Complete blood panel - all levels within normal range',
          status: 'completed',
          doctor: 'Dr. Emily Davis',
          location: 'HealthSync Laboratory'
        },
        {
          id: '4',
          date: '2026-03-01',
          type: 'appointment',
          title: 'Diabetes Follow-up',
          description: '3-month checkup to review medication effectiveness',
          status: 'completed',
          doctor: 'Dr. Michael Chen',
          location: 'HealthSync Medical Center'
        },
        {
          id: '5',
          date: '2026-03-15',
          type: 'exercise',
          title: 'Started Exercise Program',
          description: 'Began 30-minute daily walking routine as recommended',
          status: 'active',
          location: 'Local Park'
        },
        {
          id: '6',
          date: '2026-04-01',
          type: 'vital-signs',
          title: 'Health Metrics Improvement',
          description: 'Blood pressure improved from 140/90 to 120/80 through lifestyle changes',
          status: 'completed',
          location: 'Home Monitoring'
        }
      ];
      setTimeline(mockTimeline);
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'appointment': return <Calendar size={20} className="text-blue-600" />;
      case 'medication': return <Pill size={20} className="text-purple-600" />;
      case 'lab-result': return <FileText size={20} className="text-green-600" />;
      case 'exercise': return <Activity size={20} className="text-orange-600" />;
      case 'vital-signs': return <Heart size={20} className="text-red-600" />;
      default: return <Clock size={20} className="text-gray-600" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'appointment': return 'bg-blue-100 text-blue-700';
      case 'medication': return 'bg-purple-100 text-purple-700';
      case 'lab-result': return 'bg-green-100 text-green-700';
      case 'exercise': return 'bg-orange-100 text-orange-700';
      case 'vital-signs': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'scheduled': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const groupTimelineByMonth = (timeline) => {
    const grouped = {};
    timeline.forEach(item => {
      const month = new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!grouped[month]) {
        grouped[month] = [];
      }
      grouped[month].push(item);
    });
    return grouped;
  };

  const sortedGroupedTimeline = groupTimelineByMonth(timeline);
  const months = Object.keys(sortedGroupedTimeline).sort();

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="glass p-8 rounded-3xl">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">Health Timeline</h1>
        <p className="text-slate-600 mb-8">Your complete health journey from start to present</p>
        
        {/* Timeline Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-center">
              <Calendar size={24} className="text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{timeline.length}</div>
              <p className="text-sm text-blue-700">Total Events</p>
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="text-center">
              <TrendingUp size={24} className="text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">
                {timeline.filter(item => item.status === 'completed').length}
              </div>
              <p className="text-sm text-green-700">Completed</p>
            </div>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div className="text-center">
              <Activity size={24} className="text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-900">
                {timeline.filter(item => item.status === 'active').length}
              </div>
              <p className="text-sm text-orange-700">Active</p>
            </div>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="text-center">
              <Clock size={24} className="text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">
                {timeline.filter(item => item.type === 'appointment').length}
              </div>
              <p className="text-sm text-purple-700">Appointments</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-slate-600">Loading timeline...</p>
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No timeline events found</p>
              <p className="text-sm text-slate-500 mt-2">Your health journey will appear here as you add events</p>
            </div>
          ) : (
            months.map(month => (
              <div key={month} className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                  {month}
                </h3>
                <div className="space-y-4">
                  {sortedGroupedTimeline[month].map((event, index) => (
                    <div key={event.id} className="relative pl-8 pb-4 border-l-2 border-slate-200 hover:border-slate-300 transition-all">
                      {/* Timeline dot */}
                      <div className="absolute -left-2 top-4 w-4 h-4 rounded-full bg-slate-400 border-2 border-slate-300"></div>
                      
                      {/* Event content */}
                      <div className="ml-8">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getTypeIcon(event.type)}
                              <div>
                                <h4 className="font-semibold text-slate-900">{event.title}</h4>
                                <p className="text-sm text-slate-500">{event.description}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                                {event.type.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                                {event.status.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar size={16} className="text-slate-400" />
                              <span>{event.date}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1 mt-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
