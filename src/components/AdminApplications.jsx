import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { subscribeToPendingApplications, sendAgentApprovedNotification, sendAgentRejectedNotification } from '../services/notificationService';
import { toast } from 'react-toastify';
import { FiMail, FiPhone, FiGlobe, FiCheck, FiX, FiClock } from 'react-icons/fi';
import { FaBuilding } from 'react-icons/fa'

const AdminApplications = () => {
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToPendingApplications((applications) => {
      setPendingApplications(applications);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApproveApplication = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to approve ${userName}'s agent application?`)) {
      return;
    }

    setProcessingId(userId);
    try {
      // Update user role and application status
      await updateDoc(doc(db, 'users', userId), {
        role: 'agent',
        'agentApplication.status': 'approved',
        'agentApplication.approvedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send notification to user
      await sendAgentApprovedNotification(userId);

      toast.success(`${userName}'s application has been approved!`);
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectApplication = async (userId, userName) => {
    const reason = window.prompt(`Why are you rejecting ${userName}'s application? (Optional)`);
    
    if (!window.confirm(`Are you sure you want to reject ${userName}'s agent application?`)) {
      return;
    }

    setProcessingId(userId);
    try {
      // Update application status
      await updateDoc(doc(db, 'users', userId), {
        'agentApplication.status': 'rejected',
        'agentApplication.rejectedAt': serverTimestamp(),
        'agentApplication.rejectionReason': reason || '',
        updatedAt: serverTimestamp()
      });

      // Send notification to user
      await sendAgentRejectedNotification(userId, reason);

      toast.success(`${userName}'s application has been rejected.`);
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.toDate()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-t-2 border-gray-300 rounded-full animate-spin border-t-emerald-600"></div>
          <span className="ml-3 text-gray-600">Loading applications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Pending Agent Applications</h2>
          <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            <FiClock className="mr-1" size={16} />
            <span className="text-sm font-medium">{pendingApplications.length} pending</span>
          </div>
        </div>

        {pendingApplications.length === 0 ? (
          <div className="text-center py-12">
            <FiCheck size={48} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No pending agent applications to review.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingApplications.map((application) => (
              <div key={application.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <img
                      src={application.photoURL || '/default-avatar.png'}
                      alt={application.name}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(application.name)}&background=10b981&color=white`;
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {application.agentApplication?.fullName || application.name}
                      </h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center text-gray-600">
                          <FiMail className="mr-2 flex-shrink-0" size={16} />
                          <span>{application.email}</span>
                        </div>
                        {application.agentApplication?.phoneNumber && (
                          <div className="flex items-center text-gray-600">
                            <FiPhone className="mr-2 flex-shrink-0" size={16} />
                            <span>{application.agentApplication.phoneNumber}</span>
                          </div>
                        )}
                        {application.agentApplication?.companyName && (
                          <div className="flex items-center text-gray-600">
                            <FaBuilding className="mr-2 flex-shrink-0" size={16} />
                            <span>{application.agentApplication.companyName}</span>
                          </div>
                        )}
                        {application.agentApplication?.website && (
                          <div className="flex items-center text-gray-600">
                            <FiGlobe className="mr-2 flex-shrink-0" size={16} />
                            <a 
                              href={application.agentApplication.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:underline"
                            >
                              {application.agentApplication.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      Pending Review
                    </span>
                    <p className="text-sm text-gray-500 mt-2">
                      Submitted: {formatDate(application.agentApplication?.submittedAt)}
                    </p>
                  </div>
                </div>

                {/* Bio */}
                {application.agentApplication?.bio && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {application.agentApplication.bio}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-end space-x-3">
                  <button
                    onClick={() => handleRejectApplication(application.id, application.agentApplication?.fullName || application.name)}
                    disabled={processingId === application.id}
                    className="flex items-center px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiX className="mr-2" size={16} />
                    {processingId === application.id ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleApproveApplication(application.id, application.agentApplication?.fullName || application.name)}
                    disabled={processingId === application.id}
                    className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiCheck className="mr-2" size={16} />
                    {processingId === application.id ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApplications;