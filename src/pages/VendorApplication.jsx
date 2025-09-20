import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import { motion as Motion } from 'framer-motion';
import { FiUser, FiPhone, FiBriefcase, FiKey, FiClock, FiTarget, FiEdit, FiGlobe, FiHelpCircle, FiCheck } from 'react-icons/fi';

const VendorApplication = () => {
  const { currentUser, userDetails } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    companyName: '',
    licenseNumber: '',
    yearsExperience: '',
    specialization: '',
    bio: '',
    website: '',
    reason: ''
  });

  // Redirect vendor users to the vendor dashboard
  useEffect(() => {
    if (userDetails?.role === 'vendor') {
      navigate('/vendor');
    }
  }, [userDetails, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login?redirect=vendor-application');
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to apply');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Update the user document with application data
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        vendorApplication: {
          ...formData,
          status: 'pending', // pending, approved, rejected
          submittedAt: serverTimestamp()
        }
      });

      setSuccess(true);
      // Reset form
      setFormData({
        fullName: '',
        phoneNumber: '',
        companyName: '',
        licenseNumber: '',
        yearsExperience: '',
        specialization: '',
        bio: '',
        website: '',
        reason: ''
      });

    } catch (err) {
      console.error('Error submitting vendor application:', err);
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative py-20 overflow-hidden bg-center bg-no-repeat bg-cover" 
           style={{backgroundImage: 'url(https://images.unsplash.com/photo-1560520031-3a4dc4e9de0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80)'}}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-emerald-900/80"></div>
        <div className="relative z-10 max-w-5xl px-4 mx-auto text-center">
          <Motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-4xl font-bold text-white md:text-5xl font-heading"
          >
            Join Our Network of Property Professionals
          </Motion.h1>
          <Motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg text-gray-100 md:text-xl"
          >
            Expand your reach and grow your real estate business by becoming a verified vendor on our platform
          </Motion.p>
        </div>
      </div>
      
      <div className="w-full px-4 py-16 mx-auto -mt-10 max-w-7xl sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="p-8 bg-white border border-gray-100 shadow-lg rounded-xl"
          >
            {success ? (
              <Motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 text-center bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl"
              >
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 text-white rounded-full bg-emerald-600">
                  <FiCheck className="w-10 h-10" />
                </div>
                <h2 className="mb-4 text-2xl font-bold text-emerald-700">Application Submitted!</h2>
                <p className="mb-8 text-gray-700">
                  Thank you for applying to become a property vendor. We'll review your application and get back to you shortly.
                </p>
                <Motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-3 font-medium text-white transition duration-300 rounded-lg shadow-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  Go to Dashboard
                </Motion.button>
              </Motion.div>
            ) : (
              <>
                <div className="mb-8 text-center">
                  <h2 className="mb-2 text-2xl font-bold text-gray-800">Vendor Application</h2>
                  <p className="text-gray-600">Fill out the form below to apply for vendor status</p>
                </div>
                
                <div className="flex items-center p-4 mb-8 border-l-4 border-blue-500 bg-blue-50 rounded-r-md">
                  <div className="flex-shrink-0 mr-3">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <p className="text-sm text-blue-700">
                    Becoming a vendor allows you to list properties, manage bookings, and connect with potential buyers directly.
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="flex items-center p-4 mb-6 text-red-700 bg-red-100 rounded-lg">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                      {error}
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <label className="flex items-center mb-2 font-medium text-gray-700">
                      <FiUser className="w-5 h-5 mr-2 text-emerald-600" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="block w-full px-4 py-3 transition duration-150 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="flex items-center mb-2 font-medium text-gray-700">
                      <FiPhone className="w-5 h-5 mr-2 text-emerald-600" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required
                      className="block w-full px-4 py-3 transition duration-150 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
                    <div>
                      <label className="flex items-center mb-2 font-medium text-gray-700">
                        <FiBriefcase className="w-5 h-5 mr-2 text-emerald-600" />
                        Company Name (if applicable)
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 transition duration-150 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center mb-2 font-medium text-gray-700">
                        <FiKey className="w-5 h-5 mr-2 text-emerald-600" />
                        License Number (if applicable)
                      </label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 transition duration-150 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
                    <div>
                      <label className="flex items-center mb-2 font-medium text-gray-700">
                        <FiClock className="w-5 h-5 mr-2 text-emerald-600" />
                        Years of Experience
                      </label>
                      <select
                        name="yearsExperience"
                        value={formData.yearsExperience}
                        onChange={handleChange}
                        required
                        className="block w-full px-4 py-3 transition duration-150 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">Select</option>
                        <option value="0-1">Less than 1 year</option>
                        <option value="1-3">1-3 years</option>
                        <option value="3-5">3-5 years</option>
                        <option value="5-10">5-10 years</option>
                        <option value="10+">More than 10 years</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="flex items-center mb-2 font-medium text-gray-700">
                        <FiTarget className="w-5 h-5 mr-2 text-emerald-600" />
                        Specialization
                      </label>
                      <select
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        required
                        className="block w-full px-4 py-3 transition duration-150 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">Select</option>
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Industrial">Industrial</option>
                        <option value="Land">Land</option>
                        <option value="Multiple">Multiple Specializations</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="flex items-center mb-2 font-medium text-gray-700">
                      <FiEdit className="w-5 h-5 mr-2 text-emerald-600" />
                      Professional Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="block w-full px-4 py-3 transition duration-150 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Tell us about your experience and background in real estate..."
                    ></textarea>
                  </div>
                  
                  <div className="mb-6">
                    <label className="flex items-center mb-2 font-medium text-gray-700">
                      <FiGlobe className="w-5 h-5 mr-2 text-emerald-600" />
                      Website or Social Media (optional)
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 transition duration-150 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="https://"
                    />
                  </div>
                  
                  <div className="mb-8">
                    <label className="flex items-center mb-2 font-medium text-gray-700">
                      <FiHelpCircle className="w-5 h-5 mr-2 text-emerald-600" />
                      Why do you want to become a vendor?
                    </label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="block w-full px-4 py-3 transition duration-150 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    ></textarea>
                  </div>
                  
                  <Motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-6 py-4 font-medium text-white transition duration-300 rounded-lg shadow-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-emerald-400 disabled:to-teal-400"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : 'Submit Application'}
                  </Motion.button>
                </form>
              </>
            )}
          </Motion.div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already a vendor? <a href="/vendor" className="font-medium transition duration-150 text-emerald-600 hover:text-emerald-700">Go to Vendor Dashboard</a>
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 mt-12 md:grid-cols-3">
            <div className="p-6 text-center bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 text-white bg-blue-600 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-800">List Properties</h3>
              <p className="text-sm text-gray-600">Add and manage your property listings easily</p>
            </div>
            
            <div className="p-6 text-center bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 text-white rounded-full bg-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-800">Manage Bookings</h3>
              <p className="text-sm text-gray-600">Handle viewings and inquiries efficiently</p>
            </div>
            
            <div className="p-6 text-center bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 text-white bg-purple-600 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-800">Connect with Clients</h3>
              <p className="text-sm text-gray-600">Build your network and grow your business</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorApplication;