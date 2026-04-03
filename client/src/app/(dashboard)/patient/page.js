'use client';
import { useEffect, useState } from 'react';
import api from '../../../lib/axios';
import { Calendar, Pill, Clock } from 'lucide-react';

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [appRes, medRes] = await Promise.all([
          api.get('/appointments'),
          api.get('/medications')
        ]);
        setAppointments(appRes.data);
        setMedications(medRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const markAdherence = async (medId, taken) => {
    try {
      await api.post('/medications/log', { medicationId: medId, taken });
      alert("Adherence logged successfully!");
    } catch(err) {
      alert("Failed to log adherence");
    }
  }

  if (loading) return <div>Loading timeline...</div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Patient Overview</h1>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Appointments Widget */}
        <div className="glass p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="text-blue-500" /> Upcoming Appointments
            </h2>
            <a href="/patient/appointments" className="text-sm text-teal-600 font-semibold">Book New</a>
          </div>
          
          <div className="space-y-4">
             {appointments.length === 0 && <p className="text-slate-500">No upcoming appointments.</p>}
             {appointments.map(app => (
               <div key={app._id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex justify-between items-center">
                 <div>
                   <div className="font-semibold text-slate-900">Dr. {app.doctorId?.name}</div>
                   <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                     <Clock size={14}/> {new Date(app.date).toLocaleDateString()} at {app.time}
                   </div>
                 </div>
                 <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium uppercase border border-blue-100">
                   {app.status}
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Medications Tracking Widget */}
        <div className="glass p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Pill className="text-emerald-500" /> Today's Medications
            </h2>
          </div>
          
          <div className="space-y-4">
             {medications.length === 0 && <p className="text-slate-500">No active medications.</p>}
             {medications.map(med => (
               <div key={med._id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-bold text-slate-900 text-lg">{med.name}</div>
                      <div className="text-sm text-slate-500">{med.dosage} • {med.frequency}</div>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => markAdherence(med._id, true)} className="flex-1 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors">
                      Mark Taken
                    </button>
                    <button onClick={() => markAdherence(med._id, false)} className="flex-1 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors">
                      Missed
                    </button>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
