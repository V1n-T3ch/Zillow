import { db } from '../firebase';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

/**
 * Increment the view count for a property
 * @param {string} propertyId - The ID of the property being viewed
 * @param {string} agentId - The agent ID who owns the property (for analytics)
 */
export const incrementPropertyViews = async (propertyId, agentId) => {
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
    
    // Update the property document's view count only
    const propertyRef = doc(db, 'properties', propertyId);
    await updateDoc(propertyRef, {
      views: increment(1),
      updatedAt: serverTimestamp()
    });
    
    // Remove the separate collection tracking to avoid permission issues
    // The views are now stored directly in the property document

  } catch (error) {
    console.error('Error recording property view:', error);
  }
};

/**
 * Get analytics data for an agent's properties
 * @param {string} agentId - The agent's ID
 * @returns {Promise<Object>} Analytics data
 */
export const getAgentAnalytics = async (agentId) => {
  try {
    // This would query the agent's properties and aggregate views
    // Implementation depends on your needs
    const analytics = {
      totalViews: 0,
      totalProperties: 0,
      // Add more analytics as needed
    };
    return analytics;
  } catch (error) {
    console.error('Error fetching agent analytics:', error);
    return null;
  }
};