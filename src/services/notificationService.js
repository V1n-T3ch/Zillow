import { collection, addDoc, serverTimestamp, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Create a new notification for a user (direct to Firestore)
 */
export const createNotification = async (
  userId,
  type,
  title,
  message,
  data = {},
  actionUrl = null
) => {
  try {
    const notificationData = {
      userId,
      type,
      title,
      message,
      data,
      actionUrl,
      read: false,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Listen to pending agent applications for admins
 * This replaces the need for Cloud Functions
 */
export const subscribeToPendingApplications = (callback) => {
  const q = query(
    collection(db, 'users'),
    where('agentApplication.status', '==', 'pending')
  );

  return onSnapshot(q, (snapshot) => {
    const pendingApplications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    callback(pendingApplications);
  }, (error) => {
    console.error('Error listening to pending applications:', error);
  });
};

/**
 * Get pending agent applications (one-time fetch)
 */
export const getPendingApplications = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('agentApplication.status', '==', 'pending')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting pending applications:', error);
    return [];
  }
};

/**
 * Simple function for agent application submission (no Cloud Functions needed)
 * This is just for consistency - the real work is done by updating the user document
 */
export const sendAgentApplicationNotification = async (applicantId, applicantName, applicantEmail) => {
  // Since we're using real-time listeners, we don't need to do anything here
  // The AdminApplications component will automatically see the new pending application
  console.log(`Agent application submitted by ${applicantName} (${applicantEmail})`);
  return { success: true, message: 'Application submitted successfully' };
};

// Direct user notifications
export const sendAgentApprovedNotification = async (userId) => {
  return createNotification(
    userId,
    'agent_approved',
    'Agent Application Approved',
    'Congratulations! Your application to become an Agent has been approved. You can now list properties on our platform.',
    { approved: true },
    '/agent'
  );
};

export const sendAgentRejectedNotification = async (userId, reason = '') => {
  const message = reason 
    ? `Your Agent application has been rejected. Reason: ${reason}`
    : 'Your Agent application has been rejected. Please contact support for more information.';
  
  return createNotification(
    userId,
    'agent_rejected',
    'Agent Application Rejected',
    message,
    { approved: false },
    '/agent-application'
  );
};

export const sendBookingRequestNotification = async (agentId, bookingId, propertyTitle, userEmail, date, time) => {
  return createNotification(
    agentId,
    'booking_request',
    'New Booking Request',
    `You have a new booking request for "${propertyTitle}" from ${userEmail} on ${date} at ${time}.`,
    { bookingId },
    `/agent/bookings/${bookingId}`
  );
};

export const sendPropertyApprovedNotification = async (agentId, propertyId, propertyTitle) => {
  return createNotification(
    agentId,
    'property_approved',
    'Property Listing Approved',
    `Your property "${propertyTitle}" has been approved and is now live on our platform.`,
    { propertyId },
    `/properties/${propertyId}`
  );
};

export const sendPropertyRejectedNotification = async (agentId, propertyId, propertyTitle, reason = '') => {
  const message = reason 
    ? `Your property "${propertyTitle}" has been rejected. Reason: ${reason}`
    : `Your property "${propertyTitle}" has been rejected. Please review and update your listing.`;
  
  return createNotification(
    agentId,
    'property_rejected',
    'Property Listing Rejected',
    message,
    { propertyId },
    `/agent/properties/${propertyId}/edit`
  );
};

export const sendBookingConfirmedNotification = async (userId, bookingId, propertyTitle, date, time) => {
  return createNotification(
    userId,
    'booking_confirmed',
    'Booking Confirmed',
    `Your booking for "${propertyTitle}" on ${date} at ${time} has been confirmed.`,
    { bookingId },
    `/bookings/${bookingId}`
  );
};

export const sendBookingRejectedNotification = async (userId, bookingId, propertyTitle, reason = '') => {
  const message = reason
    ? `Your booking request for "${propertyTitle}" has been declined. Reason: ${reason}`
    : `Your booking request for "${propertyTitle}" has been declined.`;
  
  return createNotification(
    userId,
    'booking_rejected',
    'Booking Request Declined',
    message,
    { bookingId },
    '/bookings'
  );
};

export const sendMessageReceivedNotification = async (userId, senderId, senderName, messagePreview) => {
  return createNotification(
    userId,
    'message_received',
    'New Message',
    `You have received a new message from ${senderName}: "${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}"`,
    { senderId },
    `/messages/${senderId}`
  );
};