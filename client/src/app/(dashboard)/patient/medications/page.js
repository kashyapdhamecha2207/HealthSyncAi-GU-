'use client';
import { useEffect, useState } from 'react';
import api from '../../../../lib/axios';
import { Pill, Clock, Calendar, Plus, CheckCircle, XCircle, TrendingUp, AlertCircle, Activity } from 'lucide-react';

export default function MedicationsPage() {
  const [medications, setMedications] = useState([]);
  const [adherenceData, setAdherenceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: '',
    scheduleTimes: [''],
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const res = await api.get('/medications');
      setMedications(res.data);
      
      // Fetch adherence data for each medication
      const adherencePromises = res.data.map(async (med) => {
        try {
          const adherenceRes = await api.get(`/medications/${med._id}/adherence`);
          return { [med._id]: adherenceRes.data };
        } catch (err) {
          return { [med._id]: { adherence: 100, streak: 0, last7Days: [] } };
        }
      });
      
      const adherenceResults = await Promise.all(adherencePromises);
      const combinedAdherence = adherenceResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setAdherenceData(combinedAdherence);
    } catch (err) {
      console.error("Failed to load medications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAdherence = async (medId, taken) => {
    try {
      await api.post('/medications/log', { medicationId: medId, taken });
      
      // Refresh adherence data
      try {
        const adherenceRes = await api.get(`/medications/${medId}/adherence`);
        setAdherenceData(prev => ({ ...prev, [medId]: adherenceRes.data }));
      } catch (err) {
        console.error("Failed to refresh adherence data");
      }
      
      alert(taken ? "Medication marked as taken! Great job!" : "Medication marked as missed. Stay consistent!");
    } catch(err) {
      alert("Failed to log adherence");
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    try {
      await api.post('/medications', {
        ...newMed,
        scheduleTimes: newMed.scheduleTimes.filter(time => time.trim() !== '')
      });
      setShowAddForm(false);
      setNewMed({
        name: '',
        dosage: '',
        frequency: '',
        scheduleTimes: [''],
        startDate: '',
        endDate: ''
      });
      fetchMedications();
      alert("Medication added successfully!");
    } catch(err) {
      alert("Failed to add medication");
    }
  };

  const addScheduleTime = () => {
    setNewMed(prev => ({
      ...prev,
      scheduleTimes: [...prev.scheduleTimes, '']
    }));
  };

  const updateScheduleTime = (index, value) => {
    setNewMed(prev => ({
      ...prev,
      scheduleTimes: prev.scheduleTimes.map((time, i) => i === index ? value : time)
    }));
  };

  const removeScheduleTime = (index) => {
    setNewMed(prev => ({
      ...prev,
      scheduleTimes: prev.scheduleTimes.filter((_, i) => i !== index)
    }));
  };

  const getAdherenceColor = (adherence) => {
    if (adherence >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (adherence >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getAdherenceIcon = (adherence) => {
    if (adherence >= 80) return <TrendingUp size={16} className="text-emerald-600" />;
    if (adherence >= 60) return <AlertCircle size={16} className="text-yellow-600" />;
    return <XCircle size={16} className="text-red-600" />;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading medications...</div>;

  // Calculate overall adherence
  const overallAdherence = Object.values(adherenceData).length > 0 
    ? Object.values(adherenceData).reduce((sum, data) => sum + (data.adherence || 0), 0) / Object.values(adherenceData).length
    : 0;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Medications</h1>
          <p className="text-slate-600 mt-1">Track your medications and improve adherence with AI insights</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} /> Add Medication
        </button>
      </div>

      {/* Overall Adherence Dashboard */}
      {medications.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="text-teal-600" size={24} />
                <span className="font-semibold text-slate-900">Overall Adherence</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">{overallAdherence.toFixed(1)}%</div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getAdherenceColor(overallAdherence)}`}>
              {getAdherenceIcon(overallAdherence)}
              {overallAdherence >= 80 ? 'Excellent' : overallAdherence >= 60 ? 'Good' : 'Needs Improvement'}
            </div>
          </div>

          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Pill className="text-blue-600" size={24} />
              <span className="font-semibold text-slate-900">Active Medications</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">{medications.length}</div>
            <div className="text-sm text-slate-600">Currently tracking</div>
          </div>

          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="text-emerald-600" size={24} />
              <span className="font-semibold text-slate-900">Best Streak</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {Math.max(...Object.values(adherenceData).map(data => data.streak || 0), 0)} days
            </div>
            <div className="text-sm text-slate-600">Consecutive days</div>
          </div>
        </div>
      )}

      {/* Add Medication Form */}
      {showAddForm && (
        <div className="glass p-6 rounded-2xl mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Medication</h2>
          <form onSubmit={handleAddMedication} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Medication Name</label>
                <input
                  type="text"
                  required
                  value={newMed.name}
                  onChange={(e) => setNewMed(prev => ({...prev, name: e.target.value}))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="e.g., Aspirin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dosage</label>
                <input
                  type="text"
                  required
                  value={newMed.dosage}
                  onChange={(e) => setNewMed(prev => ({...prev, dosage: e.target.value}))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="e.g., 100mg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Frequency</label>
              <input
                type="text"
                required
                value={newMed.frequency}
                onChange={(e) => setNewMed(prev => ({...prev, frequency: e.target.value}))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="e.g., Twice a day"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Schedule Times</label>
              <div className="space-y-2">
                {newMed.scheduleTimes.map((time, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateScheduleTime(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    {newMed.scheduleTimes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeScheduleTime(index)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addScheduleTime}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Add Time
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  required
                  value={newMed.startDate}
                  onChange={(e) => setNewMed(prev => ({...prev, startDate: e.target.value}))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date (Optional)</label>
                <input
                  type="date"
                  value={newMed.endDate}
                  onChange={(e) => setNewMed(prev => ({...prev, endDate: e.target.value}))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
              >
                Add Medication
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Medications List */}
      <div className="space-y-6">
        {medications.length === 0 ? (
          <div className="glass p-8 rounded-2xl text-center">
            <Pill className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No medications yet</h3>
            <p className="text-slate-600 mb-4">Start tracking your medications by adding your first one.</p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
            >
              Add Your First Medication
            </button>
          </div>
        ) : (
          medications.map(med => {
            const adherence = adherenceData[med._id] || { adherence: 100, streak: 0, last7Days: [] };
            
            return (
              <div key={med._id} className="glass p-6 rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{med.name}</h3>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getAdherenceColor(adherence.adherence)}`}>
                        {getAdherenceIcon(adherence.adherence)}
                        {adherence.adherence.toFixed(0)}% adherence
                      </div>
                    </div>
                    <p className="text-slate-600">{med.dosage} • {med.frequency}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span>🔥 {adherence.streak || 0} day streak</span>
                      <span>Started {new Date(med.startDate).toLocaleDateString()}</span>
                      {med.endDate && <span>Ends {new Date(med.endDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>

                {/* Adherence Chart */}
                {adherence.last7Days && adherence.last7Days.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-slate-700 mb-2">Last 7 Days</div>
                    <div className="flex gap-1">
                      {adherence.last7Days.map((day, index) => (
                        <div
                          key={index}
                          className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-medium ${
                            day ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}
                          title={day ? 'Taken' : 'Missed'}
                        >
                          {day ? '✓' : '✗'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {med.scheduleTimes && med.scheduleTimes.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-slate-700 mb-2">Schedule Times:</div>
                    <div className="flex flex-wrap gap-2">
                      {med.scheduleTimes.map((time, index) => (
                        <span key={index} className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium">
                          <Clock size={14} className="inline mr-1" />
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={() => markAdherence(med._id, true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-semibold transition-colors"
                  >
                    <CheckCircle size={18} />
                    Mark as Taken
                  </button>
                  <button 
                    onClick={() => markAdherence(med._id, false)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-semibold transition-colors"
                  >
                    <XCircle size={18} />
                    Mark as Missed
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
