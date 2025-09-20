import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiBell, FiCheck, FiClock, FiHome, FiCalendar, 
  FiUser, FiTrash2, FiMessageCircle, FiAlertCircle,
  FiCheckCircle, FiXCircle, FiEye
} from 'react-icons/fi';
import { 
  collection, query, where, orderBy, getDocs, 
  doc, deleteDoc, writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const Notifications = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
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
        groupNotificationsByDate(notificationsList);

        // Mark all unread notifications as read
        const batch = writeBatch(db);
        notificationsList.forEach(notification => {
          if (!notification.read) {
            const notificationRef = doc(db, 'notifications', notification.id);
            batch.update(notificationRef, { read: true });
          }
        });
        await batch.commit();

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications. Please try again.');
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser, navigate]);

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
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      
      // Update local state
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      groupNotificationsByDate(updatedNotifications);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      const batch = writeBatch(db);
      
      notifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.delete(notificationRef);
      });
      
      await batch.commit();
      
      setNotifications([]);
      setGroupedNotifications({
        today: [],
        yesterday: [],
        thisWeek: [],
        earlier: []
      });
    } catch (err) {
      console.error('Error deleting all notifications:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'vendor_approved':
        return <FiCheckCircle className="text-green-500" />;
      case 'vendor_rejected':
        return <FiXCircle className="text-red-500" />;
      case 'property_approved':
        return <FiHome className="text-emerald-500" />;
      case 'property_rejected':
        return <FiAlertCircle className="text-red-500" />;
      case 'booking_requested':
        return <FiCalendar className="text-blue-500" />;
      case 'booking_confirmed':
        return <FiCheck className="text-green-500" />;
      case 'booking_canceled':
        return <FiXCircle className="text-red-500" />;
      case 'message_received':
        return <FiMessageCircle className="text-purple-500" />;
      case 'property_view':
        return <FiEye className="text-blue-500" />;
      default:
        return <FiBell className="text-gray-500" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const renderNotificationGroup = (title, notifications) => {
    if (notifications.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-gray-500">{title}</h3>
        <div className="overflow-hidden bg-white rounded-lg shadow">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-4 border-b border-gray-100 last:border-b-0 ${!notification.read ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-start">
                <div className="flex items-center justify-center w-10 h-10 mr-4 bg-gray-100 rounded-full">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{notification.title}</h4>
                      <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{formatDate(notification.createdAt)}</span>
                      <button 
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="p-1 text-gray-400 rounded hover:bg-gray-100 hover:text-gray-600"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {notification.actionUrl && (
                    <div className="mt-2">
                      <Link 
                        to={notification.actionUrl} 
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        View Details
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container max-w-5xl px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          
          {notifications.length > 0 && (
            <button
              onClick={handleDeleteAllNotifications}
              className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-white border border-gray-300 rounded-lg hover:bg-red-50"
            >
              <FiTrash2 className="mr-2" />
              Clear All
            </button>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-t-2 border-gray-500 rounded-full animate-spin border-t-emerald-600"></div>
            <span className="ml-2 text-gray-500">Loading notifications...</span>
          </div>
        ) : error ? (
          <div className="p-4 text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow">
            <FiBell size={48} className="mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700">No notifications yet</h3>
            <p className="text-gray-500">We'll notify you when something important happens.</p>
          </div>
        ) : (
          <div>
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