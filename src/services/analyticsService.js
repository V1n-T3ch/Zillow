import { db } from '../firebase';
import { doc, updateDoc, increment, serverTimestamp, collection, addDoc } from 'firebase/firestore';

/**
 * Increment the view count for a property
 * @param {string} propertyId - The ID of the property being viewed
 * @param {string} vendorId - The vendor ID who owns the property (for analytics)
 */
export const incrementPropertyViews = async (propertyId, vendorId) => {
  try {
    // Check if this session has already viewed this property recently
    const sessionKey = `property_viewed_${propertyId}`;
    const lastViewTime = localStorage.getItem(sessionKey);
    const now = Date.now();
    
    // If the property was viewed in the last 30 minutes, don't count it again
    if (lastViewTime && (now - parseInt(lastViewTime)) < 30 * 60 * 1000) {
      return;
    }
    
    // Mark this property as viewed in this session with the current timestamp
    localStorage.setItem(sessionKey, now.toString());
    
    // Update the property document's view count
    const propertyRef = doc(db, 'properties', propertyId);
    await updateDoc(propertyRef, {
      views: increment(1),
      updatedAt: serverTimestamp()
    });
    
    // Record the view in a separate collection for detailed analytics
    await addDoc(collection(db, 'property_views'), {
      propertyId,
      vendorId,
      timestamp: serverTimestamp(),
    });

  } catch (error) {
    console.error('Error recording property view:', error);
  }
};