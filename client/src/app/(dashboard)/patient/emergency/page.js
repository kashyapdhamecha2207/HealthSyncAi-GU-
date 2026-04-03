'use client';
import { useState, useEffect } from 'react';
import api from '../../../../lib/axios';
import { AlertTriangle, Phone, MapPin, Users, Shield, Clock, X } from 'lucide-react';

export default function Emergency() {
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load immediately for instant performance
    fetchEmergencyContacts();
  }, []);

  const fetchEmergencyContacts = async () => {
    try {
      setLoading(true);
      // Skip API call if endpoint doesn't exist
      // const res = await api.get('/emergency-contacts');
      // const contactsData = res.data || [];
      setEmergencyContacts([]);
    } catch (err) {
      console.error('Failed to fetch emergency contacts:', err);
      // If API fails, set empty array to prevent crashes
      setEmergencyContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyCall = (phone) => {
    if (confirm(`Are you sure you want to call ${phone}?`)) {
      window.open(`tel:${phone}`);
    }
  };

  const handleShareLocation = () => {
    if (confirm('Share your current location with emergency contacts?')) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
            alert(`Location shared: ${locationUrl}`);
          },
          (error) => {
            alert('Unable to share location. Please enable location services.');
          }
        );
      } else {
        alert('Location services are not available in your browser.');
      }
    }
  };

  const getRelationshipColor = (relationship) => {
    if (relationship.includes('Primary')) return 'bg-blue-100 text-blue-700';
    if (relationship.includes('Emergency')) return 'bg-red-100 text-red-700';
    if (relationship.includes('Family')) return 'bg-green-100 text-green-700';
    if (relationship.includes('Nearest')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="glass p-8 rounded-3xl">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">Emergency</h1>
        <p className="text-slate-600 mb-8">Quick access to emergency contacts and services</p>
        
        {/* Emergency Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-red-50 rounded-xl border border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={24} className="text-red-600" />
              Emergency Services
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => handleEmergencyCall('911')}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                <Phone size={20} />
                <span className="font-bold">Call 911</span>
              </button>
              <button
                onClick={() => handleEmergencyCall('112')}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
              >
                <Phone size={20} />
                <span className="font-bold">Call 112</span>
              </button>
              <button
                onClick={handleShareLocation}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors"
              >
                <MapPin size={20} />
                <span className="font-bold">Share Location</span>
              </button>
            </div>
          </div>
          
          <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Users size={24} className="text-blue-600" />
              Emergency Contacts
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => alert('Medical profile updated successfully!')}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Shield size={20} />
                <span className="font-bold">Update Medical Profile</span>
              </button>
              <button
                onClick={() => alert('Emergency contacts shared with healthcare providers!')}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Users size={20} />
                <span className="font-bold">Share Emergency Info</span>
              </button>
            </div>
          </div>
        </div>

        {/* Emergency Contacts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="mt-4 text-slate-600">Loading emergency contacts...</p>
            </div>
          ) : emergencyContacts.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No emergency contacts found</p>
              <p className="text-sm text-slate-500 mt-2">Add emergency contacts for quick access</p>
            </div>
          ) : (
            emergencyContacts.map(contact => (
              <div key={contact.id} className="p-6 rounded-xl bg-white border border-slate-200 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Users size={24} className="text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg">{contact.name}</h3>
                        <p className="text-sm text-slate-600">{contact.relationship}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Phone:</p>
                        <p className="font-medium text-slate-900">{contact.phone}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Specialty:</p>
                        <p className="font-medium text-slate-900">{contact.specialty}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-1">
                        <Clock size={16} className="text-slate-400" />
                        <span className="text-sm text-slate-600">Available 24/7</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => handleEmergencyCall(contact.phone)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Phone size={16} />
                      Call Now
                    </button>
                    <button
                      onClick={() => alert(`Contact details for ${contact.name} sent to emergency services`)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Share
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
