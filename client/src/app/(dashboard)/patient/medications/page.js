'use client';
import { useState, useEffect } from 'react';
import api from '../../../../lib/axios';
import { Pill, Clock, Calendar, AlertTriangle, Plus, Trash2, CheckCircle, TrendingUp, X } from 'lucide-react';

export default function Medications() {
  const [medications, setMedications] = useState([]);
  const [medicationForm, setMedicationForm] = useState({
    name: '',
    dosage: '',
    frequency: 'once',
    timesPerDay: 1,
    mgPerDose: '',
    startDate: '',
    endDate: '',
    reminderTimes: []
  });
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    // Load immediately for instant performance
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/medications');
      const medicationsData = res.data || [];
      setMedications(medicationsData);
    } catch (err) {
      console.error('Failed to fetch medications:', err);
      // If API fails, set empty array to prevent crashes
      setMedications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/medications', medicationForm);
      setMedications([...medications, res.data]);
      setMedicationForm({
        name: '',
        dosage: '',
        frequency: 'once',
        timesPerDay: 1,
        mgPerDose: '',
        startDate: '',
        endDate: '',
        reminderTimes: []
      });
      setShowAddForm(false);
      alert('Medication added successfully!');
    } catch (err) {
      console.error('Add medication error:', err);
      alert('Failed to add medication: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedication = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medication?')) return;
    try {
      await api.delete(`/medications/${id}`);
      setMedications(medications.filter(med => (med._id || med.id) !== id));
      alert('Medication deleted successfully!');
    } catch (err) {
      alert('Failed to delete medication');
    }
  };

  const handleRequestRefill = async (id) => {
    try {
      const medication = medications.find(med => med.id === id);
      if (!medication) return;

      // Create refill request
      const refillRequest = {
        id: Date.now().toString(),
        medicationId: medication.id,
        medicationName: medication.name,
        patientName: 'John Doe', // In real app, get from user context
        dosage: medication.dosage,
        frequency: medication.frequency,
        requestedDate: new Date().toISOString().split('T')[0],
        lastRefillDate: medication.lastRefillDate,
        notes: `Patient requested refill for ${medication.name}`,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Store refill request in localStorage
      const storedRequests = JSON.parse(localStorage.getItem('refillRequests') || '[]');
      storedRequests.push(refillRequest);
      localStorage.setItem('refillRequests', JSON.stringify(storedRequests));

      // Update medication refills count
      setMedications(medications.map(med => 
        med.id === id ? { ...med, refills: med.refills + 1 } : med
      ));
      
      alert('Refill request sent to doctor successfully!');
    } catch (err) {
      alert('Failed to request refill');
    }
  };

  const getAdherenceColor = (adherence) => {
    if (adherence >= 90) return 'text-green-600 bg-green-100';
    if (adherence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="glass p-8 rounded-3xl">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">Medications</h1>
        <p className="text-slate-600 mb-8">Manage your medications and track adherence</p>
        
        {/* Add Medication Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add New Medication</span>
          </button>
        </div>

        {/* Add Medication Form */}
        {showAddForm && (
          <div className="mb-8 p-6 bg-purple-50 rounded-xl border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Add New Medication</h3>
            <form onSubmit={handleAddMedication} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">Medication Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    value={medicationForm.name}
                    onChange={(e) => setMedicationForm({...medicationForm, name: e.target.value})}
                    placeholder="e.g., Metformin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">Dosage</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    value={medicationForm.dosage}
                    onChange={(e) => setMedicationForm({...medicationForm, dosage: e.target.value})}
                    placeholder="e.g., 500mg"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">Frequency</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    value={medicationForm.frequency}
                    onChange={(e) => setMedicationForm({...medicationForm, frequency: e.target.value})}
                  >
                    <option value="once">Once daily</option>
                    <option value="twice">Twice daily</option>
                    <option value="thrice">Three times daily</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">Times per Day</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    value={medicationForm.timesPerDay || 1}
                    onChange={(e) => setMedicationForm({...medicationForm, timesPerDay: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    value={medicationForm.startDate}
                    onChange={(e) => setMedicationForm({...medicationForm, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">End Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    value={medicationForm.endDate}
                    onChange={(e) => setMedicationForm({...medicationForm, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Medication
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Medications List */}
        <div className="space-y-4">
          {loading ? (
            <div key="loading-state" className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-slate-600">Loading medications...</p>
            </div>
          ) : medications.length === 0 ? (
            <div key="empty-state" className="text-center py-12">
              <Pill size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No medications found</p>
              <p className="text-sm text-slate-500 mt-2">Add your first medication to get started</p>
            </div>
          ) : (
            medications.map((medication, index) => (
              <div key={medication.id || `medication-${index}`} className="p-6 rounded-xl bg-white border border-slate-200 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Pill size={24} className="text-purple-600" />
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg">{medication.name}</h3>
                        <p className="text-sm text-slate-600">{medication.dosage} • {medication.frequency} daily</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Duration:</p>
                        <p className="font-medium text-slate-900">{medication.startDate} to {medication.endDate}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Prescribed by:</p>
                        <p className="font-medium text-slate-900">{medication.doctor}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-1">
                        <Clock size={16} className="text-slate-400" />
                        <span className="text-sm text-slate-600">{medication.reminderTimes ? medication.reminderTimes.join(', ') : 'No reminders set'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm text-slate-500">Adherence</p>
                        <div className={`text-2xl font-bold ${getAdherenceColor(medication.adherence || 0)}`}>
                          {medication.adherence || 0}%
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-slate-500">Refills Left</p>
                        <div className="text-2xl font-bold text-slate-900">{medication.refills || 0}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequestRefill(medication.id)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Request Refill
                      </button>
                      <button
                        onClick={() => handleDeleteMedication(medication.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
