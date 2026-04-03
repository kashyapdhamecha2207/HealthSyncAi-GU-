'use client';
import { useState, useEffect } from 'react';
import api from '../../../../lib/axios';
import { Heart, TrendingUp, Activity, Plus, Calendar, AlertTriangle, X, Weight } from 'lucide-react';

export default function HealthTracking() {
  const [healthData, setHealthData] = useState([]);
  const [vitalForm, setVitalForm] = useState({
    type: 'weight',
    value: '',
    unit: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    // Load immediately for instant performance
    fetchHealthData();
  }, []);

  const fetchHealthData = () => {
    try {
      setLoading(true);
      // Load from localStorage instantly (synchronous)
      const storedHealthData = JSON.parse(localStorage.getItem('healthData') || '[]');
      
      // If no data, add some sample data for demonstration
      if (storedHealthData.length === 0) {
        const sampleData = [
          {
            id: '1',
            date: '2026-04-01',
            type: 'weight',
            value: '75.5',
            unit: 'kg',
            notes: 'Morning weight before breakfast'
          },
          {
            id: '2',
            date: '2026-04-02',
            type: 'blood_pressure',
            value: '120/80',
            unit: 'mmHg',
            notes: 'Slightly elevated, monitor closely'
          },
          {
            id: '3',
            date: '2026-04-03',
            type: 'heart_rate',
            value: '72',
            unit: 'bpm',
            notes: 'Normal resting rate'
          }
        ];
        setHealthData(sampleData);
        localStorage.setItem('healthData', JSON.stringify(sampleData));
      } else {
        setHealthData(storedHealthData);
      }
    } catch (err) {
      console.error('Failed to fetch health data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthTimeline = async () => {
    try {
      // Skip API call completely for performance
      setTimeline([]);
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
      setTimeline([]);
    }
  };

  const handleAddVital = async (e) => {
    e.preventDefault();
    try {
      const newVital = {
        ...vitalForm,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      // Update state
      const updatedHealthData = [...healthData, newVital];
      setHealthData(updatedHealthData);
      
      // Store in localStorage
      localStorage.setItem('healthData', JSON.stringify(updatedHealthData));
      
      // Reset form
      setVitalForm({
        type: 'weight',
        value: '',
        unit: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
      
      alert('Health data added successfully!');
    } catch (err) {
      alert('Failed to add health data');
    }
  };

  const handleDeleteHealthData = async (id) => {
    try {
      // Update state
      const updatedHealthData = healthData.filter(data => data.id !== id);
      setHealthData(updatedHealthData);
      
      // Update localStorage
      localStorage.setItem('healthData', JSON.stringify(updatedHealthData));
      
      alert('Health data deleted successfully!');
    } catch (err) {
      alert('Failed to delete health data');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'weight': return <Activity size={20} className="text-blue-600" />;
      case 'blood_pressure': return <Heart size={20} className="text-red-600" />;
      case 'heart_rate': return <Heart size={20} className="text-pink-600" />;
      case 'blood_sugar': return <TrendingUp size={20} className="text-purple-600" />;
      case 'exercise': return <Activity size={20} className="text-green-600" />;
      case 'mood': return <Heart size={20} className="text-yellow-600" />;
      case 'sleep': return <Calendar size={20} className="text-indigo-600" />;
      default: return <Activity size={20} className="text-gray-600" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'weight': return 'bg-blue-100 text-blue-700';
      case 'blood_pressure': return 'bg-red-100 text-red-700';
      case 'heart_rate': return 'bg-pink-100 text-pink-700';
      case 'blood_sugar': return 'bg-purple-100 text-purple-700';
      case 'exercise': return 'bg-green-100 text-green-700';
      case 'mood': return 'bg-yellow-100 text-yellow-700';
      case 'sleep': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getUnitPlaceholder = (type) => {
    switch (type) {
      case 'weight': return 'kg';
      case 'blood_pressure': return 'mmHg';
      case 'heart_rate': return 'bpm';
      case 'blood_sugar': return 'mg/dL';
      case 'exercise': return 'minutes';
      case 'sleep': return 'hours';
      default: return '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="glass p-8 rounded-3xl">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">Health Tracking</h1>
        <p className="text-slate-600 mb-8">Monitor your vital signs and track your health journey</p>
        
        {/* Add Health Data Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add Health Data</span>
          </button>
        </div>

        {/* Add Health Data Form */}
        {showAddForm && (
          <div className="mb-8 p-6 bg-red-50 rounded-xl border border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-4">Add Health Data</h3>
            <form onSubmit={handleAddVital} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Data Type</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    value={vitalForm.type}
                    onChange={(e) => setVitalForm({...vitalForm, type: e.target.value})}
                  >
                    <option value="weight">Weight</option>
                    <option value="blood_pressure">Blood Pressure</option>
                    <option value="heart_rate">Heart Rate</option>
                    <option value="blood_sugar">Blood Sugar</option>
                    <option value="exercise">Exercise</option>
                    <option value="mood">Mood</option>
                    <option value="sleep">Sleep</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Value</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    value={vitalForm.value}
                    onChange={(e) => setVitalForm({...vitalForm, value: e.target.value})}
                    placeholder="e.g., 75.5"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Unit</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    value={vitalForm.unit}
                    onChange={(e) => setVitalForm({...vitalForm, unit: e.target.value})}
                    placeholder={getUnitPlaceholder(vitalForm.type)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    value={vitalForm.date}
                    onChange={(e) => setVitalForm({...vitalForm, date: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Add Health Data
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Health Data List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="mt-4 text-slate-600">Loading health data...</p>
            </div>
          ) : healthData.length === 0 ? (
            <div className="text-center py-12">
              <Heart size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No health data found</p>
              <p className="text-sm text-slate-500 mt-2">Start tracking your health journey today</p>
            </div>
          ) : (
            healthData.map(data => (
              <div key={data.id} className="p-6 rounded-xl bg-white border border-slate-200 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getTypeIcon(data.type)}
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg capitalize">{data.type.replace('_', ' ')}</h3>
                        <p className="text-sm text-slate-600">{data.value} {data.unit}</p>
                      </div>
                    </div>
                    
                    <div className="text-sm text-slate-500 mb-2">
                      <span>Recorded: {data.date}</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(data.type)}`}>
                        {data.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {data.notes && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-700">{data.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => handleDeleteHealthData(data.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
