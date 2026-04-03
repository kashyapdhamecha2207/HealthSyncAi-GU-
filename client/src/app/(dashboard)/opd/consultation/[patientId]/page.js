'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../lib/axios';
import { 
  User, Activity, Clock, FileText, Pill, TestTube, 
  CreditCard, Save, Send, AlertTriangle, CheckCircle
} from 'lucide-react';

export default function OPDConsultation() {
  const params = useParams();
  const router = useRouter();
  const { patientId } = params;
  
  const [patient, setPatient] = useState(null);
  const [consultation, setConsultation] = useState({
    vitals: {
      temperature: '',
      bloodPressure: { systolic: '', diastolic: '' },
      heartRate: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      height: '',
      bmi: ''
    },
    examination: {
      general: '',
      systemic: '',
      local: ''
    },
    diagnosis: {
      provisional: [''],
      final: [''],
      differential: ['']
    },
    investigations: [],
    treatment: {
      medications: [],
      procedures: [''],
      advice: '',
      followUp: {
        required: false,
        after: '',
        instructions: ''
      }
    },
    consultationFee: 100,
    doctorNotes: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      // Mock patient data - in production, this would fetch from API
      setPatient({
        _id: patientId,
        name: 'John Doe',
        age: 35,
        gender: 'Male',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St, City',
        medicalHistory: ['Hypertension', 'Diabetes Type 2'],
        allergies: ['Penicillin'],
        lastVisit: '2024-01-15'
      });
    } catch (err) {
      console.error('Failed to fetch patient data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVitalChange = (field, value) => {
    setConsultation(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [field]: value
      }
    }));
    
    // Calculate BMI if height and weight are provided
    if (field === 'height' || field === 'weight') {
      const height = field === 'height' ? value : prev.vitals.height;
      const weight = field === 'weight' ? value : prev.vitals.weight;
      
      if (height && weight) {
        const heightInMeters = height / 100;
        const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
        setConsultation(prev => ({
          ...prev,
          vitals: {
            ...prev.vitals,
            bmi
          }
        }));
      }
    }
  };

  const addDiagnosisItem = (type) => {
    setConsultation(prev => ({
      ...prev,
      diagnosis: {
        ...prev.diagnosis,
        [type]: [...prev.diagnosis[type], '']
      }
    }));
  };

  const updateDiagnosisItem = (type, index, value) => {
    setConsultation(prev => ({
      ...prev,
      diagnosis: {
        ...prev.diagnosis,
        [type]: prev.diagnosis[type].map((item, i) => i === index ? value : item)
      }
    }));
  };

  const removeDiagnosisItem = (type, index) => {
    setConsultation(prev => ({
      ...prev,
      diagnosis: {
        ...prev.diagnosis,
        [type]: prev.diagnosis[type].filter((_, i) => i !== index)
      }
    }));
  };

  const addInvestigation = () => {
    setConsultation(prev => ({
      ...prev,
      investigations: [...prev.investigations, {
        type: 'lab',
        name: '',
        status: 'ordered'
      }]
    }));
  };

  const updateInvestigation = (index, field, value) => {
    setConsultation(prev => ({
      ...prev,
      investigations: prev.investigations.map((inv, i) => 
        i === index ? { ...inv, [field]: value } : inv
      )
    }));
  };

  const removeInvestigation = (index) => {
    setConsultation(prev => ({
      ...prev,
      investigations: prev.investigations.filter((_, i) => i !== index)
    }));
  };

  const addMedication = () => {
    setConsultation(prev => ({
      ...prev,
      treatment: {
        ...prev.treatment,
        medications: [...prev.treatment.medications, {
          name: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: ''
        }]
      }
    }));
  };

  const updateMedication = (index, field, value) => {
    setConsultation(prev => ({
      ...prev,
      treatment: {
        ...prev.treatment,
        medications: prev.treatment.medications.map((med, i) => 
          i === index ? { ...med, [field]: value } : med
        )
      }
    }));
  };

  const removeMedication = (index) => {
    setConsultation(prev => ({
      ...prev,
      treatment: {
        ...prev.treatment,
        medications: prev.treatment.medications.filter((_, i) => i !== index)
      }
    }));
  };

  const saveConsultation = async () => {
    setSaving(true);
    try {
      // Mock API call - in production, this would save to backend
      console.log('Saving consultation:', consultation);
      
      alert('Consultation saved successfully!');
      router.push('/opd');
    } catch (err) {
      alert('Failed to save consultation');
    } finally {
      setSaving(false);
    }
  };

  const completeConsultation = async () => {
    setSaving(true);
    try {
      // Mock API call to complete consultation
      console.log('Completing consultation:', consultation);
      
      alert('Consultation completed successfully!');
      router.push('/opd');
    } catch (err) {
      alert('Failed to complete consultation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading patient data...</div>;
  if (!patient) return <div className="min-h-screen flex items-center justify-center">Patient not found</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">OPD Consultation</h1>
          <p className="text-slate-600 mt-1">Patient: {patient.name} ({patient.age}y, {patient.gender})</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={saveConsultation}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            <Save size={18} /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button 
            onClick={completeConsultation}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            <CheckCircle size={18} /> {saving ? 'Completing...' : 'Complete'}
          </button>
        </div>
      </div>

      {/* Patient Information Card */}
      <div className="glass p-6 rounded-2xl mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
            <User size={24} className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
            <p className="text-slate-600">{patient.email} • {patient.phone}</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Age/Gender:</span>
            <span className="ml-2 font-medium">{patient.age}y, {patient.gender}</span>
          </div>
          <div>
            <span className="text-slate-500">Last Visit:</span>
            <span className="ml-2 font-medium">{patient.lastVisit}</span>
          </div>
          <div>
            <span className="text-slate-500">Medical History:</span>
            <span className="ml-2 font-medium">{patient.medicalHistory.join(', ')}</span>
          </div>
        </div>
        {patient.allergies.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle size={16} />
              <span className="font-semibold">Allergies:</span>
              <span>{patient.allergies.join(', ')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vitals Section */}
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-blue-600" />
            Vital Signs
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Temperature (°F)</label>
              <input
                type="number"
                step="0.1"
                value={consultation.vitals.temperature}
                onChange={(e) => handleVitalChange('temperature', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="98.6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Heart Rate (bpm)</label>
              <input
                type="number"
                value={consultation.vitals.heartRate}
                onChange={(e) => handleVitalChange('heartRate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="72"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Blood Pressure</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={consultation.vitals.bloodPressure.systolic}
                  onChange={(e) => handleVitalChange('bloodPressure', { 
                    ...consultation.vitals.bloodPressure, 
                    systolic: e.target.value 
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="120"
                />
                <span className="flex items-center">/</span>
                <input
                  type="number"
                  value={consultation.vitals.bloodPressure.diastolic}
                  onChange={(e) => handleVitalChange('bloodPressure', { 
                    ...consultation.vitals.bloodPressure, 
                    diastolic: e.target.value 
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="80"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Respiratory Rate</label>
              <input
                type="number"
                value={consultation.vitals.respiratoryRate}
                onChange={(e) => handleVitalChange('respiratoryRate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="16"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Oxygen Saturation (%)</label>
              <input
                type="number"
                value={consultation.vitals.oxygenSaturation}
                onChange={(e) => handleVitalChange('oxygenSaturation', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="98"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={consultation.vitals.weight}
                onChange={(e) => handleVitalChange('weight', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="70"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
              <input
                type="number"
                value={consultation.vitals.height}
                onChange={(e) => handleVitalChange('height', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="175"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">BMI</label>
              <input
                type="number"
                step="0.1"
                value={consultation.vitals.bmi}
                readOnly
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                placeholder="Auto-calculated"
              />
            </div>
          </div>
        </div>

        {/* Examination Section */}
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-emerald-600" />
            Clinical Examination
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">General Examination</label>
              <textarea
                value={consultation.examination.general}
                onChange={(e) => setConsultation(prev => ({
                  ...prev,
                  examination: { ...prev.examination, general: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                rows={3}
                placeholder="Patient appears well, conscious, oriented..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Systemic Examination</label>
              <textarea
                value={consultation.examination.systemic}
                onChange={(e) => setConsultation(prev => ({
                  ...prev,
                  examination: { ...prev.examination, systemic: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                rows={3}
                placeholder="Chest clear, heart sounds normal, abdomen soft..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Local Examination</label>
              <textarea
                value={consultation.examination.local}
                onChange={(e) => setConsultation(prev => ({
                  ...prev,
                  examination: { ...prev.examination, local: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                rows={3}
                placeholder="Local findings related to chief complaint..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Diagnosis Section */}
      <div className="glass p-6 rounded-2xl mt-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Diagnosis</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {['provisional', 'final', 'differential'].map(type => (
            <div key={type}>
              <label className="block text-sm font-medium text-slate-700 mb-2 capitalize">
                {type} Diagnosis
              </label>
              <div className="space-y-2">
                {consultation.diagnosis[type].map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateDiagnosisItem(type, index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder={`Enter ${type} diagnosis`}
                    />
                    {consultation.diagnosis[type].length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDiagnosisItem(type, index)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addDiagnosisItem(type)}
                  className="w-full px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                >
                  Add {type} Diagnosis
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Investigations Section */}
      <div className="glass p-6 rounded-2xl mt-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TestTube size={20} className="text-purple-600" />
          Investigations
        </h3>
        <div className="space-y-3">
          {consultation.investigations.map((investigation, index) => (
            <div key={index} className="flex gap-3 items-end">
              <div className="flex-1">
                <select
                  value={investigation.type}
                  onChange={(e) => updateInvestigation(index, 'type', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="lab">Laboratory</option>
                  <option value="radiology">Radiology</option>
                  <option value="pathology">Pathology</option>
                  <option value="cardiology">Cardiology</option>
                </select>
              </div>
              <div className="flex-2">
                <input
                  type="text"
                  value={investigation.name}
                  onChange={(e) => updateInvestigation(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Investigation name"
                />
              </div>
              <button
                type="button"
                onClick={() => removeInvestigation(index)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addInvestigation}
            className="w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
          >
            Add Investigation
          </button>
        </div>
      </div>

      {/* Treatment Section */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Medications */}
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Pill size={20} className="text-teal-600" />
            Medications
          </h3>
          <div className="space-y-3">
            {consultation.treatment.medications.map((medication, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={medication.name}
                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Medication name"
                  />
                  <input
                    type="text"
                    value={medication.dosage}
                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Dosage"
                  />
                  <input
                    type="text"
                    value={medication.frequency}
                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Frequency"
                  />
                  <input
                    type="text"
                    value={medication.duration}
                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Duration"
                  />
                </div>
                <textarea
                  value={medication.instructions}
                  onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  rows={2}
                  placeholder="Special instructions"
                />
                <button
                  type="button"
                  onClick={() => removeMedication(index)}
                  className="mt-2 px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addMedication}
              className="w-full px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100"
            >
              Add Medication
            </button>
          </div>
        </div>

        {/* Advice & Follow-up */}
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Advice & Follow-up</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Procedures</label>
              <textarea
                value={consultation.treatment.procedures.join('\n')}
                onChange={(e) => setConsultation(prev => ({
                  ...prev,
                  treatment: {
                    ...prev.treatment,
                    procedures: e.target.value.split('\n').filter(p => p.trim())
                  }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                rows={3}
                placeholder="List any procedures performed (one per line)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Advice</label>
              <textarea
                value={consultation.treatment.advice}
                onChange={(e) => setConsultation(prev => ({
                  ...prev,
                  treatment: { ...prev.treatment, advice: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                rows={3}
                placeholder="General advice for the patient"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={consultation.treatment.followUp.required}
                  onChange={(e) => setConsultation(prev => ({
                    ...prev,
                    treatment: {
                      ...prev.treatment,
                      followUp: { ...prev.treatment.followUp, required: e.target.checked }
                    }
                  }))}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-slate-700">Follow-up Required</span>
              </label>
              {consultation.treatment.followUp.required && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={consultation.treatment.followUp.after}
                    onChange={(e) => setConsultation(prev => ({
                      ...prev,
                      treatment: {
                        ...prev.treatment,
                        followUp: { ...prev.treatment.followUp, after: e.target.value }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g., 2 weeks, 1 month"
                  />
                  <textarea
                    value={consultation.treatment.followUp.instructions}
                    onChange={(e) => setConsultation(prev => ({
                      ...prev,
                      treatment: {
                        ...prev.treatment,
                        followUp: { ...prev.treatment.followUp, instructions: e.target.value }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    rows={2}
                    placeholder="Follow-up instructions"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Notes & Billing */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Doctor Notes</h3>
          <textarea
            value={consultation.doctorNotes}
            onChange={(e) => setConsultation(prev => ({ ...prev, doctorNotes: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            rows={4}
            placeholder="Additional notes for the patient record..."
          />
        </div>
        
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard size={20} className="text-green-600" />
            Consultation Fee
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Fee ($)</label>
              <input
                type="number"
                value={consultation.consultationFee}
                onChange={(e) => setConsultation(prev => ({ ...prev, consultationFee: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="100"
              />
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-800">
                <div className="flex justify-between">
                  <span>Consultation:</span>
                  <span>${consultation.consultationFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Investigations:</span>
                  <span>${consultation.investigations.length * 200}</span>
                </div>
                <div className="flex justify-between">
                  <span>Procedures:</span>
                  <span>${consultation.treatment.procedures.length * 500}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-green-300">
                  <span>Total:</span>
                  <span>${consultation.consultationFee + (consultation.investigations.length * 200) + (consultation.treatment.procedures.length * 500)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
