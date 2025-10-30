import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiBell, FiCheck, FiClock, FiHome, FiCalendar, 
  FiUser, FiMessageCircle, FiAlertCircle,
  FiCheckCircle, FiXCircle, FiEye, FiUsers, FiPlus,
  FiRefreshCw, FiCreditCard, FiSettings
} from 'react-icons/fi';
import { 
  collection, query, where, orderBy, limit, getDocs, 
  onSnapshot, writeBatch, doc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { subscribeToPendingApplications } from '../services/notificationService';

const NotificationBell = () => {
  const { currentUser, userRole } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingApplications, setPendingApplications] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    // Create a query for unread notifications
    const notificationsRef = collection(db, 'notifications');
    const unreadQuery = query(
      notificationsRef,
      where('userId', '==', currentUser.uid),
      where('read', '==', false)
    );

    // Subscribe to real-time updates for unread count
    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      setUnreadCount(snapshot.size);
    }, (error) => {
      console.error("Error getting unread notifications:", error);
    });

    // Get recent notifications (last 8)
    const fetchRecentNotifications = async () => {
      try {
        setIsLoading(true);
        const recentQuery = query(
          notificationsRef,
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(8)
        );

        const querySnapshot = await getDocs(recentQuery);
        const notificationsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        setRecentNotifications(notificationsList);
      } catch (error) {
        console.error("Error getting recent notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentNotifications();

    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to pending applications for admin users
  useEffect(() => {
    if (currentUser && userRole === 'admin') {
      const unsubscribe = subscribeToPendingApplications((applications) => {
        setPendingApplications(applications);
      });

      return () => unsubscribe();
    }
  }, [currentUser, userRole]);

  const getNotificationIcon = (type) => {
    const iconClass = "w-4 h-4";
    
    switch (type) {
      case 'agent_application':
        return <FiUsers className={`${iconClass} text-orange-500`} />;
      case 'agent_approved':
        return <FiCheckCircle className={`${iconClass} text-green-500`} />;
      case 'agent_rejected':
        return <FiXCircle className={`${iconClass} text-red-500`} />;
      case 'property_submitted':
        return <FiPlus className={`${iconClass} text-blue-500`} />;
      case 'property_approved':
        return <FiHome className={`${iconClass} text-emerald-500`} />;
      case 'property_rejected':
        return <FiAlertCircle className={`${iconClass} text-red-500`} />;
      case 'booking_request':
        return <FiCalendar className={`${iconClass} text-blue-500`} />;
      case 'booking_confirmed':
        return <FiCheck className={`${iconClass} text-green-500`} />;
      case 'booking_rejected':
        return <FiXCircle className={`${iconClass} text-red-500`} />;
      case 'booking_canceled':
        return <FiXCircle className={`${iconClass} text-red-500`} />;
      case 'booking_completed':
        return <FiCheckCircle className={`${iconClass} text-green-500`} />;
      case 'booking_reminder':
        return <FiClock className={`${iconClass} text-yellow-500`} />;
      case 'booking_rescheduled':
        return <FiRefreshCw className={`${iconClass} text-blue-500`} />;
      case 'message_received':
        return <FiMessageCircle className={`${iconClass} text-purple-500`} />;
      case 'property_view':
        return <FiEye className={`${iconClass} text-blue-500`} />;
      case 'user_registered':
        return <FiUser className={`${iconClass} text-indigo-500`} />;
      case 'payment_received':
        return <FiCreditCard className={`${iconClass} text-green-500`} />;
      case 'system_update':
        return <FiSettings className={`${iconClass} text-gray-500`} />;
      default:
        return <FiBell className={`${iconClass} text-gray-500`} />;
    }
  };

  const getNotificationColor = (type, isUnread) => {
    const baseClass = isUnread ? 'bg-blue-50' : '';
    
    switch (type) {
      case 'agent_approved':
      case 'property_approved':
      case 'booking_confirmed':
      case 'booking_completed':
      case 'payment_received':
        return `${baseClass} border-l-2 border-green-400`;
      case 'agent_rejected':
      case 'property_rejected':
      case 'booking_rejected':
      case 'booking_canceled':
        return `${baseClass} border-l-2 border-red-400`;
      case 'booking_reminder':
        return `${baseClass} border-l-2 border-yellow-400`;
      case 'agent_application':
      case 'property_submitted':
      case 'booking_request':
        return `${baseClass} border-l-2 border-orange-400`;
      default:
        return baseClass;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    try {
      const batch = writeBatch(db);
      const unreadNotifications = recentNotifications.filter(n => !n.read);
      
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true });
      });
      
      await batch.commit();
      
      // Update local state
      setRecentNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Create virtual notifications for pending applications (for admins)
  const pendingApplicationNotifications = pendingApplications.map(app => ({
    id: `pending-${app.id}`,
    type: 'agent_application',
    title: 'New Agent Application',
    message: `${app.agentApplication?.fullName || app.name} has applied to become an agent`,
    createdAt: app.agentApplication?.submittedAt?.toDate() || new Date(),
    read: false,
    actionUrl: '/admin',
    data: {
      applicantName: app.agentApplication?.fullName || app.name,
      applicantEmail: app.email
    },
    isPending: true // Mark as pending application
  }));

  // Combine regular notifications with pending applications for admins
  const allNotifications = userRole === 'admin' 
    ? [...pendingApplicationNotifications, ...recentNotifications]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8)
    : recentNotifications;

  // Total count includes pending applications for admins
  const totalNotifications = unreadCount + (userRole === 'admin' ? pendingApplications.length : 0);

  if (!currentUser) return null;

  return (
    <div className="relative">
      <button
        className="relative p-2 text-gray-600 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label={`Notifications${totalNotifications > 0 ? ` (${totalNotifications} unread)` : ''}`}
      >
        <FiBell size={20} />
        {totalNotifications > 0 && (
          <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white rounded-full bg-emerald-500 -top-1 -right-1 animate-pulse">
            {totalNotifications > 99 ? '99+' : totalNotifications}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-2 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-xl w-96">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="font-semibold text-gray-800">Notifications</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  {unreadCount > 0 && <span>{unreadCount} unread</span>}
                  {userRole === 'admin' && pendingApplications.length > 0 && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                      {pendingApplications.length} pending applications
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-1 text-xs font-medium rounded-full text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors"
                    title="Mark all as read"
                  >
                    Mark all read
                  </button>
                )}
                <Link
                  to="/notifications"
                  onClick={() => setShowDropdown(false)}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  View All
                </Link>
              </div>
            </div>
            
            {/* Notifications List */}
            <div className="overflow-y-auto max-h-96">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-6 h-6 border-2 border-t-2 border-gray-300 rounded-full animate-spin border-t-emerald-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading...</span>
                </div>
              ) : allNotifications.length > 0 ? (
                <div>
                  {allNotifications.map((notification) => (
                    <Link
                      key={notification.id}
                      to={notification.actionUrl || '/notifications'}
                      className={`block p-4 border-b border-gray-100 hover:bg-gray-50 last:border-b-0 transition-colors ${
                        getNotificationColor(notification.type, !notification.read || notification.isPending)
                      }`}
                      onClick={() => setShowDropdown(false)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon */}
                        <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-sm flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className={`text-sm font-medium text-gray-800 truncate ${
                              (!notification.read || notification.isPending) ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                              {notification.isPending && (
                                <span className="ml-2 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                                  Pending
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center ml-2 space-x-1 flex-shrink-0">
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              {(!notification.read || notification.isPending) && (
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                              )}
                            </div>
                          </div>
                          
                          <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          {/* Additional data display */}
                          {notification.data && Object.keys(notification.data).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {notification.data.applicantName && (
                                <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                                  {notification.data.applicantName}
                                </span>
                              )}
                              {notification.data.applicantEmail && (
                                <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                  {notification.data.applicantEmail}
                                </span>
                              )}
                              {notification.data.propertyTitle && (
                                <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                  {notification.data.propertyTitle}
                                </span>
                              )}
                              {notification.data.viewCount && (
                                <span className="inline-block px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">
                                  {notification.data.viewCount} views
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-12 h-12 mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <FiBell size={24} className="text-gray-400" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">No notifications yet</h4>
                  <p className="text-xs text-gray-500">We'll notify you when something happens</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            {allNotifications.length > 0 && (
              <div className="p-3 text-center border-t border-gray-100 bg-gray-50">
                {userRole === 'admin' && pendingApplications.length > 0 && (
                  <Link
                    to="/admin/dashboard"
                    className="inline-flex items-center justify-center w-full px-4 py-2 mb-2 text-sm font-medium rounded-lg text-orange-700 bg-orange-100 hover:bg-orange-200 transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    Review {pendingApplications.length} Pending Application{pendingApplications.length !== 1 ? 's' : ''}
                    <FiUsers className="w-4 h-4 ml-1" />
                  </Link>
                )}
                <Link
                  to="/notifications"
                  className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  View All Notifications
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;