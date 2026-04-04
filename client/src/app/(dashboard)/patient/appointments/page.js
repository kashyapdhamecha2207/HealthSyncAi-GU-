'use client';
import { useState, useEffect } from 'react';
import api from '../../../../lib/axios';
import { useRouter } from 'next/navigation';
import { Calendar, BarChart3, Heart, User, Clock } from 'lucide-react';

export default function BookAppointment() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState({
    total: 0,
    attended: 0,
    upcoming: 0,
    missed: 0,
    rescheduled: 0
  });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    date: '', 
    time: '', 
    doctorId: '', 
    reason: '',
    experience: '',
    notes: ''
  });
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data || []);
      
      const stats = res.data.reduce((acc, apt) => {
        acc.total++;
        if (apt.status === 'completed') acc.attended++;
        else if (apt.status === 'scheduled') acc.upcoming++;
        else if (apt.status === 'missed') acc.missed++;
        else if (apt.status === 'rescheduled') acc.rescheduled++;
        return acc;
      }, { total: 0, attended: 0, upcoming: 0, missed: 0, rescheduled: 0 });
      
      setAppointmentStats(stats);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors/all');
      const doctorsData = res.data.data || [];
      
      if (doctorsData.length === 0) {
        const mockDoctors = [
          { _id: '1', name: 'Sarah Johnson', specialty: 'General Physician', experience: '10 years' },
          { _id: '2', name: 'Michael Chen', specialty: 'Cardiologist', experience: '15 years' },
          { _id: '3', name: 'Emily Davis', specialty: 'Dermatologist', experience: '8 years' }
        ];
        setDoctors(mockDoctors);
      } else {
        setDoctors(doctorsData);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      const mockDoctors = [
        { _id: '1', name: 'Sarah Johnson', specialty: 'General Physician', experience: '10 years' },
        { _id: '2', name: 'Michael Chen', specialty: 'Cardiologist', experience: '15 years' },
        { _id: '3', name: 'Emily Davis', specialty: 'Dermatologist', experience: '8 years' }
      ];
      setDoctors(mockDoctors);
    }
  };

  const handleDoctorSelect = (doctorId) => {
    const doctor = doctors.find(d => d._id === doctorId);
    setSelectedDoctor(doctor);
    setFormData({ ...formData, doctorId });
  };

  const handleExportAll = async () => {
    try {
      const response = await api.get('/appointments/export');
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'all_appointments.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export appointments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/appointments', formData);
      const appointment = response.data;
      
      alert("Appointment booked successfully! 📧 Confirmation emails sent to you and the doctor.");
      setFormData({ date: '', time: '', doctorId: '', reason: '', experience: '', notes: '' });
      setSelectedDoctor(null);
      fetchAppointments();
    } catch (err) {
      alert("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="glass p-8 rounded-3xl">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">Health Management Dashboard</h1>
        <p className="text-slate-600 mb-4">Complete overview of your appointments, medications, and health journey</p>
        
        {/* Email Notification Info */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Confirmation emails will be sent to: user@example.com
          </p>
        </div>
        
        {/* Overview Content */}
        <div className="space-y-6">
          {/* AI Risk Score */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="text-purple-600" size={24} />
                  <h3 className="text-xl font-semibold text-purple-900">AI Risk Assessment</h3>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  LOW
                </div>
              </div>
              <div className="mb-4">
                <div className="text-3xl font-bold text-purple-900 mb-2">15%</div>
                <p className="text-sm text-purple-700">No-show Risk Score</p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="text-blue-600" size={24} />
                <h3 className="text-xl font-semibold text-blue-900">Health Status</h3>
              </div>
              <div className="mb-4">
                <div className="text-3xl font-bold text-blue-900 mb-2">Good</div>
                <p className="text-sm text-blue-700">Overall Health Score</p>
              </div>
            </div>
          </div>

          {/* Appointment Statistics */}
          <div className="p-6 rounded-xl bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">Appointment Statistics</h3>
              <button
                onClick={handleExportAll}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-2"
              >
                📊 Export All Records
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{appointmentStats.total}</div>
                <div className="text-sm text-slate-600">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{appointmentStats.attended}</div>
                <div className="text-sm text-green-600">Attended</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{appointmentStats.upcoming}</div>
                <div className="text-sm text-blue-600">Upcoming</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{appointmentStats.missed}</div>
                <div className="text-sm text-red-600">Missed</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{appointmentStats.rescheduled}</div>
                <div className="text-sm text-yellow-600">Rescheduled</div>
              </div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="p-6 rounded-xl bg-white border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Upcoming Appointments</h3>
            <div className="space-y-4">
              {appointments.filter(apt => apt.status === 'scheduled').slice(0, 3).map((apt, index) => (
                <div key={index} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{apt.doctor?.name || 'Doctor'}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        {new Date(apt.date).toLocaleDateString()} at {apt.time}
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      Scheduled
                    </div>
                  </div>
                </div>
              ))}
              {appointments.filter(apt => apt.status === 'scheduled').length === 0 && (
                <div className="text-center py-8 text-slate-600">
                  <Calendar className="mx-auto mb-2 text-slate-400" size={48} />
                  <p>No upcoming appointments</p>
                </div>
              )}
            </div>
          </div>

          {/* Book New Appointment */}
          <div className="p-6 rounded-xl bg-white border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Book New Appointment</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <User size={18} /> Select Doctor
                  </label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.doctorId}
                    onChange={(e) => handleDoctorSelect(e.target.value)}
                    required
                  >
                    <option value="">Choose a doctor...</option>
                    {doctors.map(doctor => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.name} - {doctor.specialty}
                      </option>
                    ))}
                  </select>
                  {selectedDoctor && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>Dr. {selectedDoctor.name}</strong> - {selectedDoctor.specialty}
                      </p>
                      <p className="text-xs text-blue-600">Experience: {selectedDoctor.experience}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Calendar size={18} /> Preferred Date
                  </label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Clock size={18} /> Preferred Time
                  </label>
                  <input 
                    type="time" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Clock size={16} />
                    Experience Years
                  </label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  >
                    <option value="">Select experience</option>
                    <option value="0-1">0-1 years</option>
                    <option value="1-3">1-3 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10-15">10-15 years</option>
                    <option value="15-20">15-20 years</option>
                    <option value="20+">20+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Reason for Visit
                  </label>
                  <textarea 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    rows="4"
                    placeholder="Describe your symptoms or reason for visit..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    rows="3"
                    placeholder="Any additional information..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !formData.doctorId || !formData.date || !formData.time}
                className="w-full py-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Booking...' : 'Book Appointment'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

