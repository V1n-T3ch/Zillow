import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiBell, FiCheck, FiClock, FiHome, FiCalendar, 
  FiUser, FiTrash2, FiMessageCircle, FiAlertCircle,
  FiCheckCircle, FiXCircle, FiEye, FiUsers, FiPlus,
  FiRefreshCw, FiCreditCard, FiSettings
} from 'react-icons/fi';
import { 
  collection, query, where, orderBy, getDocs, 
  doc, deleteDoc, writeBatch, updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { subscribeToPendingApplications } from '../services/notificationService';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';

const Notifications = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupedNotifications, setGroupedNotifications] = useState({
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: []
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login?redirect=notifications');
      return;
    }

    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        setError('');

        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef,
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const notificationsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        setNotifications(notificationsList);

        // Mark all unread notifications as read
        const unreadNotifications = notificationsList.filter(n => !n.read);
        if (unreadNotifications.length > 0) {
          const batch = writeBatch(db);
          unreadNotifications.forEach(notification => {
            const notificationRef = doc(db, 'notifications', notification.id);
            batch.update(notificationRef, { read: true });
          });
          await batch.commit();
          
          // Update local state to mark as read
          notificationsList.forEach(n => n.read = true);
          setNotifications(notificationsList);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications. Please try again.');
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser, navigate]);

  // Add this debugging useEffect after line 73 (after the pending applications useEffect)
  useEffect(() => {
    console.log('🔍 Debug Info:', {
      currentUser: currentUser?.uid,
      currentUserEmail: currentUser?.email,
      userRole: currentUser?.role,
      pendingApplicationsCount: pendingApplications.length,
      notificationsCount: notifications.length,
      isAdmin: userRole === 'admin'
    });
    
    if (pendingApplications.length > 0) {
      console.log('📋 Pending applications:', pendingApplications);
    }
  }, [currentUser, userRole, pendingApplications, notifications]);

  // Subscribe to pending applications for admin users
  useEffect(() => {
    if (currentUser && userRole === 'admin') {
      const unsubscribe = subscribeToPendingApplications((applications) => {
        setPendingApplications(applications);
      });

      return () => unsubscribe();
    }
  }, [currentUser, userRole]);

  // Update grouped notifications when notifications or pending applications change
  useEffect(() => {
    const allNotifications = [...notifications];
    
    // Add pending applications as virtual notifications for admins
    if (userRole === 'admin') {
      const pendingNotifications = pendingApplications.map(app => ({
        id: `pending-${app.id}`,
        type: 'agent_application',
        title: 'New Agent Application',
        message: `${app.agentApplication?.fullName || app.name} has applied to become an agent and is awaiting review.`,
        createdAt: app.agentApplication?.submittedAt?.toDate() || new Date(),
        read: false,
        actionUrl: '/admin',
        data: {
          applicantName: app.agentApplication?.fullName || app.name,
          applicantEmail: app.email,
          applicantId: app.id
        },
        isPending: true
      }));
      
      allNotifications.unshift(...pendingNotifications);
    }
    
    groupNotificationsByDate(allNotifications);
  }, [notifications, pendingApplications, userRole]);

  const groupNotificationsByDate = (notificationsList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const grouped = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: []
    };

    notificationsList.forEach(notification => {
      const notificationDate = new Date(notification.createdAt);
      notificationDate.setHours(0, 0, 0, 0);

      if (notificationDate.getTime() === today.getTime()) {
        grouped.today.push(notification);
      } else if (notificationDate.getTime() === yesterday.getTime()) {
        grouped.yesterday.push(notification);
      } else if (notificationDate > oneWeekAgo) {
        grouped.thisWeek.push(notification);
      } else {
        grouped.earlier.push(notification);
      }
    });

    setGroupedNotifications(grouped);
  };

  const handleDeleteNotification = async (notificationId) => {
    // Don't allow deleting pending applications from here
    if (notificationId.startsWith('pending-')) {
      toast.info('Pending applications can only be managed from the admin dashboard');
      return;
    }

    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      
      // Update local state
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      
      toast.success('Notification deleted');
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
    }
  };

  const handleDeleteAllNotifications = async () => {
    const realNotifications = notifications.filter(n => !n.id?.startsWith('pending-'));
    
    if (realNotifications.length === 0) {
      toast.info('No notifications to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${realNotifications.length} notifications? This action cannot be undone.`)) {
      return;
    }

    try {
      const batch = writeBatch(db);
      
      realNotifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.delete(notificationRef);
      });
      
      await batch.commit();
      
      setNotifications([]);
      
      toast.success('All notifications deleted');
    } catch (err) {
      console.error('Error deleting all notifications:', err);
      toast.error('Failed to delete notifications');
    }
  };

  const handleMarkAsUnread = async (notificationId) => {
    // Don't allow marking pending applications as unread
    if (notificationId.startsWith('pending-')) {
      toast.info('Pending applications are always unread until processed');
      return;
    }

    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: false });
      
      // Update local state
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: false } : n
      );
      setNotifications(updatedNotifications);
      
      toast.success('Marked as unread');
    } catch (err) {
      console.error('Error marking notification as unread:', err);
      toast.error('Failed to update notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'agent_application':
        return <FiUsers className="text-orange-500" />;
      case 'agent_approved':
        return <FiCheckCircle className="text-green-500" />;
      case 'agent_rejected':
        return <FiXCircle className="text-red-500" />;
      case 'property_submitted':
        return <FiPlus className="text-blue-500" />;
      case 'property_approved':
        return <FiHome className="text-emerald-500" />;
      case 'property_rejected':
        return <FiAlertCircle className="text-red-500" />;
      case 'booking_request':
        return <FiCalendar className="text-blue-500" />;
      case 'booking_confirmed':
        return <FiCheck className="text-green-500" />;
      case 'booking_rejected':
        return <FiXCircle className="text-red-500" />;
      case 'booking_canceled':
        return <FiXCircle className="text-red-500" />;
      case 'booking_completed':
        return <FiCheckCircle className="text-green-500" />;
      case 'booking_reminder':
        return <FiClock className="text-yellow-500" />;
      case 'booking_rescheduled':
        return <FiRefreshCw className="text-blue-500" />;
      case 'message_received':
        return <FiMessageCircle className="text-purple-500" />;
      case 'property_view':
        return <FiEye className="text-blue-500" />;
      case 'user_registered':
        return <FiUser className="text-indigo-500" />;
      case 'payment_received':
        return <FiCreditCard className="text-green-500" />;
      case 'system_update':
        return <FiSettings className="text-gray-500" />;
      default:
        return <FiBell className="text-gray-500" />;
    }
  };

  const getNotificationColor = (type, isPending = false) => {
    const baseColor = isPending ? 'border-l-4 border-orange-500 bg-orange-50' : '';
    
    if (baseColor) return baseColor;

    switch (type) {
      case 'agent_approved':
      case 'property_approved':
      case 'booking_confirmed':
      case 'booking_completed':
      case 'payment_received':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'agent_rejected':
      case 'property_rejected':
      case 'booking_rejected':
      case 'booking_canceled':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'booking_reminder':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'agent_application':
      case 'property_submitted':
      case 'booking_request':
        return 'border-l-4 border-blue-500 bg-blue-50';
      default:
        return 'border-l-4 border-gray-300 bg-white';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(date);
  };

  const renderNotificationGroup = (title, notifications) => {
    if (notifications.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
        <div className="overflow-hidden bg-white rounded-lg shadow-sm">
          {notifications.map((notification, index) => (
            <div 
              key={notification.id} 
              className={`${getNotificationColor(notification.type, notification.isPending)} ${index !== notifications.length - 1 ? 'border-b border-gray-100' : ''} ${(!notification.read || notification.isPending) ? 'ring-2 ring-blue-100' : ''} group`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-10 h-10 mr-4 bg-white rounded-full shadow-sm">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900 truncate">{notification.title}</h4>
                          {notification.isPending && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded font-medium">
                              Pending Review
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                        
                        {/* Additional data display */}
                        {notification.data && Object.keys(notification.data).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {notification.data.applicantName && (
                              <span className="inline-block px-2 py-1 mr-2 bg-gray-100 rounded">
                                {notification.data.applicantName}
                              </span>
                            )}
                            {notification.data.applicantEmail && (
                              <span className="inline-block px-2 py-1 mr-2 bg-blue-100 text-blue-700 rounded">
                                {notification.data.applicantEmail}
                              </span>
                            )}
                            {notification.data.propertyTitle && (
                              <span className="inline-block px-2 py-1 mr-2 bg-gray-100 rounded">
                                {notification.data.propertyTitle}
                              </span>
                            )}
                            {notification.data.viewCount && (
                              <span className="inline-block px-2 py-1 mr-2 bg-blue-100 text-blue-700 rounded">
                                {notification.data.viewCount} views
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center ml-4 space-x-2">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                        
                        {/* Action buttons */}
                        {!notification.isPending && (
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {notification.read && (
                              <button 
                                onClick={() => handleMarkAsUnread(notification.id)}
                                className="p-1 text-gray-400 rounded hover:bg-gray-100 hover:text-gray-600"
                                title="Mark as unread"
                              >
                                <FiBell size={14} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="p-1 text-gray-400 rounded hover:bg-gray-100 hover:text-red-600"
                              title="Delete notification"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {notification.actionUrl && (
                      <div className="mt-3">
                        <Link 
                          to={notification.actionUrl} 
                          className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                            notification.isPending 
                              ? 'text-orange-700 bg-orange-100 hover:bg-orange-200'
                              : 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200'
                          }`}
                        >
                          {notification.isPending ? 'Review Application' : 'View Details'}
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const totalNotifications = notifications.length + (userRole === 'admin' ? pendingApplications.length : 0);
  const unreadCount = notifications.filter(n => !n.read).length + (userRole === 'admin' ? pendingApplications.length : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container max-w-4xl px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <div className="mt-1 space-y-1">
              <p className="text-gray-600">
                {totalNotifications > 0 
                  ? `You have ${unreadCount} unread notifications`
                  : 'Stay updated with your latest activities'
                }
              </p>
              {userRole === 'admin' && pendingApplications.length > 0 && (
                <p className="text-sm text-orange-600 font-medium">
                  {pendingApplications.length} agent applications awaiting review
                </p>
              )}
            </div>
          </div>
          
          {totalNotifications > 0 && (
            <div className="flex items-center space-x-3">
              {userRole === 'admin' && pendingApplications.length > 0 && (
                <Link
                  to="/admin"
                  className="flex items-center px-3 py-2 text-sm font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded-lg hover:bg-orange-200 transition-colors"
                >
                  <FiUsers className="mr-2" size={16} />
                  Review Applications
                </Link>
              )}
              <button
                onClick={() => window.location.reload()}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh notifications"
              >
                <FiRefreshCw className="mr-2" size={16} />
                Refresh
              </button>
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAllNotifications}
                  className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <FiTrash2 className="mr-2" size={16} />
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-t-2 border-gray-300 rounded-full animate-spin border-t-emerald-600"></div>
            <span className="ml-3 text-gray-600">Loading notifications...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-red-700 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <FiAlertCircle className="mr-2" />
              <span className="font-medium">Error</span>
            </div>
            <p className="mt-1">{error}</p>
          </div>
        ) : totalNotifications === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm">
            <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FiBell size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No notifications yet</h3>
            <p className="text-gray-500 text-center max-w-md">
              We'll notify you when something important happens with your account, properties, or bookings.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {renderNotificationGroup('Today', groupedNotifications.today)}
            {renderNotificationGroup('Yesterday', groupedNotifications.yesterday)}
            {renderNotificationGroup('This Week', groupedNotifications.thisWeek)}
            {renderNotificationGroup('Earlier', groupedNotifications.earlier)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
