import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';

const NotificationBell = () => {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

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

    // Get recent notifications (last 5)
    const fetchRecentNotifications = async () => {
      try {
        const recentQuery = query(
          notificationsRef,
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
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
      }
    };

    fetchRecentNotifications();

    return () => unsubscribe();
  }, [currentUser]);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (!currentUser) return null;

  return (
    <div className="relative">
      <button
        className="relative p-2 text-gray-600 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-900"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white rounded-full bg-emerald-500 -top-1 -right-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div 
          className="absolute right-0 z-10 mt-2 overflow-hidden bg-white rounded-lg shadow-lg w-80"
          onMouseLeave={() => setShowDropdown(false)}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs text-white rounded-full bg-emerald-500">
                {unreadCount} new
              </span>
            )}
          </div>
          
          <div className="overflow-y-auto max-h-80">
            {recentNotifications.length > 0 ? (
              <div>
                {recentNotifications.map((notification) => (
                  <Link
                    key={notification.id}
                    to={notification.actionUrl || '/notifications'}
                    className={`block p-4 border-b border-gray-100 hover:bg-gray-50 last:border-b-0 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setShowDropdown(false)}
                  >
                    <div className="flex justify-between">
                      <h4 className="font-medium text-gray-800">
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {notification.message}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No recent notifications
              </div>
            )}
          </div>
          
          <div className="p-3 text-center border-t border-gray-100">
            <Link
              to="/notifications"
              className="block w-full px-4 py-2 text-sm font-medium rounded-lg text-emerald-700 hover:bg-emerald-50"
              onClick={() => setShowDropdown(false)}
            >
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;