import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Create a new notification for a user
 * @param {string} userId - The ID of the user to send the notification to
 * @param {string} type - The notification type
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {Object} data - Additional data to include with the notification
 * @param {string} actionUrl - URL to navigate to when clicking the notification
 * @returns {Promise<string>} - The ID of the new notification
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
 * Create vendor application approved notification
 */
export const sendVendorApprovedNotification = async (userId) => {
  return createNotification(
    userId,
    'vendor_approved',
    'Vendor Application Approved',
    `Congratulations! Your application to become a vendor has been approved. You can now list properties on our platform.`,
    { approved: true },
    '/vendor'
  );
};

/**
 * Create vendor application rejected notification
 */
export const sendVendorRejectedNotification = async (userId, reason = '') => {
  const message = reason 
    ? `Your vendor application has been rejected. Reason: ${reason}`
    : 'Your vendor application has been rejected. Please contact support for more information.';
  
  return createNotification(
    userId,
    'vendor_rejected',
    'Vendor Application Rejected',
    message,
    { approved: false },
    '/vendor-application'
  );
};

/**
 * Create property approved notification
 */
export const sendPropertyApprovedNotification = async (userId, propertyId, propertyTitle) => {
  return createNotification(
    userId,
    'property_approved',
    'Property Listing Approved',
    `Your property "${propertyTitle}" has been approved and is now live on our platform.`,
    { propertyId },
    `/properties/${propertyId}`
  );
};

/**
 * Create property rejected notification
 */
export const sendPropertyRejectedNotification = async (userId, propertyId, propertyTitle, reason = '') => {
  const message = reason 
    ? `Your property "${propertyTitle}" has been rejected. Reason: ${reason}`
    : `Your property "${propertyTitle}" has been rejected. Please review and update your listing.`;
  
  return createNotification(
    userId,
    'property_rejected',
    'Property Listing Rejected',
    message,
    { propertyId },
    `/vendor/properties/${propertyId}/edit`
  );
};

/**
 * Create booking request notification for vendor
 */
export const sendBookingRequestedNotification = async (vendorId, bookingId, propertyTitle, userName, date, time) => {
  return createNotification(
    vendorId,
    'booking_requested',
    'New Booking Request',
    `${userName} has requested a viewing for "${propertyTitle}" on ${date} at ${time}.`,
    { bookingId },
    `/vendor/bookings/${bookingId}`
  );
};

/**
 * Create booking confirmed notification for user
 */
export const sendBookingConfirmedNotification = async (userId, bookingId, propertyTitle, date, time) => {
  return createNotification(
    userId,
    'booking_confirmed',
    'Booking Confirmed',
    `Your booking request for "${propertyTitle}" on ${date} at ${time} has been confirmed.`,
    { bookingId },
    `/bookings/${bookingId}`
  );
};

/**
 * Create booking canceled notification
 */
export const sendBookingCanceledNotification = async (userId, propertyTitle, date, time, canceledBy, reason = '') => {
  const message = reason
    ? `Your booking for "${propertyTitle}" on ${date} at ${time} has been canceled by ${canceledBy}. Reason: ${reason}`
    : `Your booking for "${propertyTitle}" on ${date} at ${time} has been canceled by ${canceledBy}.`;
  
  return createNotification(
    userId,
    'booking_canceled',
    'Booking Canceled',
    message,
    {},
    '/bookings'
  );
};

/**
 * Create new message notification
 */
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

/**
 * Create property view milestone notification for vendor
 */
export const sendPropertyViewMilestoneNotification = async (vendorId, propertyId, propertyTitle, viewCount) => {
  return createNotification(
    vendorId,
    'property_view',
    'Property Milestone',
    `Your property "${propertyTitle}" has reached ${viewCount} views!`,
    { propertyId, viewCount },
    `/vendor/properties/${propertyId}/stats`
  );
};

/**
 * Create booking rejected notification for user
 */
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

/**
 * Create booking completed notification for user
 */
export const sendBookingCompletedNotification = async (userId, bookingId, propertyTitle) => {
  return createNotification(
    userId,
    'booking_completed',
    'Booking Completed',
    `Your viewing for "${propertyTitle}" has been marked as completed. We hope you enjoyed viewing the property!`,
    { bookingId },
    '/bookings'
  );
};

/**
 * Create booking reminder notification (for upcoming bookings)
 */
export const sendBookingReminderNotification = async (userId, bookingId, propertyTitle, date, time) => {
  return createNotification(
    userId,
    'booking_reminder',
    'Booking Reminder',
    `Reminder: You have a scheduled viewing for "${propertyTitle}" tomorrow at ${time}.`,
    { bookingId },
    `/bookings/${bookingId}`
  );
};

/**
 * Create booking rescheduled notification
 */
export const sendBookingRescheduledNotification = async (userId, bookingId, propertyTitle, oldDate, oldTime, newDate, newTime) => {
  return createNotification(
    userId,
    'booking_rescheduled',
    'Booking Rescheduled',
    `Your booking for "${propertyTitle}" has been rescheduled from ${oldDate} at ${oldTime} to ${newDate} at ${newTime}.`,
    { bookingId },
    `/bookings/${bookingId}`
  );
};