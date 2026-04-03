'use client';
import { useState, useEffect } from 'react';
import api from '../../../../lib/axios';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';

export default function BookAppointment() {
  const router = useRouter();
  const [formData, setFormData] = useState({ date: '', time: '', doctorId: '' });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors/all');
      const doctorsData = res.data.data || [];
      
      // If no doctors from API, use mock data for demonstration
      if (doctorsData.length === 0) {
        const mockDoctors = [
          {
            _id: '1',
            name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@healthsync.com',
            department: 'Cardiology',
            speciality: 'Cardiology',
            rating: 4.8
          },
          {
            _id: '2', 
            name: 'Dr. Michael Chen',
            email: 'michael.chen@healthsync.com',
            department: 'General Medicine',
            speciality: 'General Medicine',
            rating: 4.9
          },
          {
            _id: '3',
            name: 'Dr. Emily Davis',
            email: 'emily.davis@healthsync.com', 
            department: 'Pediatrics',
            speciality: 'Pediatrics',
            rating: 4.7
          }
        ];
        setDoctors(mockDoctors);
      } else {
        setDoctors(doctorsData);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      // Use mock data as fallback
      const mockDoctors = [
        {
          _id: '1',
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@healthsync.com',
          department: 'Cardiology',
          speciality: 'Cardiology',
          rating: 4.8
        }
      ];
      setDoctors(mockDoctors);
    }
  };

  const handleDoctorSelect = (doctorId) => {
    const doctor = doctors.find(d => d._id === doctorId);
    setSelectedDoctor(doctor);
    setFormData({ ...formData, doctorId });
    
    // Generate available slots for selected date
    if (formData.date) {
      generateAvailableSlots(formData.date);
    }
  };

  const generateAvailableSlots = (date) => {
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    
    setAvailableSlots(slots);
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, date });
    if (selectedDoctor) {
      generateAvailableSlots(date);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/appointments', formData);
      const appointment = response.data;
      
      // Show AI risk assessment
      let riskMessage = "Appointment booked successfully!";
      if (appointment.riskLevel === 'HIGH') {
        riskMessage += " ⚠️ High no-show risk detected. We'll send extra reminders.";
      } else if (appointment.riskLevel === 'MEDIUM') {
        riskMessage += " ℹ️ Moderate no-show risk. Standard reminders will be sent.";
      } else {
        riskMessage += " ✅ Low no-show risk. See you soon!";
      }
      
      alert(riskMessage);
      router.push('/patient');
    } catch (err) {
      alert("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="glass p-8 rounded-3xl">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">Book New Appointment</h1>
        <p className="text-slate-600 mb-8">Select a doctor and preferred time slot. Our AI will assess no-show risk.</p>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Doctor Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <User size={18} /> Select Doctor
            </label>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map(doctor => (
                <div
                  key={doctor._id}
                  onClick={() => handleDoctorSelect(doctor._id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.doctorId === doctor._id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="font-semibold text-slate-900">{doctor.name}</div>
                  <div className="text-sm text-slate-600">{doctor.specialty}</div>
                  <div className="text-sm text-teal-600 mt-1">⭐ {doctor.rating}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Date and Time Selection */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Calendar size={18} /> Preferred Date
              </label>
              <input 
                type="date" 
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Clock size={18} /> Preferred Time
              </label>
              {availableSlots.length > 0 ? (
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                >
                  <option value="">Select time slot</option>
                  {availableSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="time" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              )}
            </div>
          </div>

          {/* AI Risk Assessment Info */}
          {selectedDoctor && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-blue-600 mt-1" size={20} />
                <div>
                  <div className="font-semibold text-blue-900">AI-Powered Risk Assessment</div>
                  <div className="text-sm text-blue-700 mt-1">
                    Our system will automatically analyze your appointment history and medication adherence 
                    to predict the likelihood of no-shows and send appropriate reminders.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Doctor Summary */}
          {selectedDoctor && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 mt-1" size={20} />
                <div>
                  <div className="font-semibold text-green-900">Appointment Summary</div>
                  <div className="text-sm text-green-700 mt-1">
                    <div>Doctor: {selectedDoctor.name} ({selectedDoctor.specialty})</div>
                    {formData.date && <div>Date: {new Date(formData.date).toLocaleDateString()}</div>}
                    {formData.time && <div>Time: {formData.time}</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !formData.doctorId || !formData.date || !formData.time}
            className="w-full py-4 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Booking...' : 'Confirm Appointment'}
          </button>
        </form>
      </div>
    </div>
  );
}
