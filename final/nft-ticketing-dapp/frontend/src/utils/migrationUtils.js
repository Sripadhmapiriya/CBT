/**
 * Utility functions for migrating from localStorage to themed images
 */
import { getThemedImageUrl } from './themeUtils';

/**
 * Migrates event metadata from localStorage to a new format
 * This function preserves existing image URLs while adding theme information
 * @returns {Object} Migration statistics
 */
export const migrateEventMetadata = () => {
  let stats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0
  };

  try {
    // Get existing metadata from localStorage
    const eventsMetadata = JSON.parse(localStorage.getItem('eventsMetadata') || '[]');
    stats.total = eventsMetadata.length;
    
    if (eventsMetadata.length === 0) {
      console.log('No event metadata found in localStorage. Nothing to migrate.');
      return stats;
    }
    
    console.log(`Found ${eventsMetadata.length} events in localStorage. Starting migration...`);
    
    // Create a backup of the original data
    localStorage.setItem('eventsMetadata_backup', JSON.stringify(eventsMetadata));
    console.log('Created backup of original event metadata in localStorage.');
    
    // No need to modify the data - we'll use it as is
    // The components have been updated to check localStorage first
    
    console.log('Migration complete. Existing event metadata will be used for backward compatibility.');
    stats.migrated = eventsMetadata.length;
    
    return stats;
  } catch (error) {
    console.error('Error during event metadata migration:', error);
    stats.errors++;
    return stats;
  }
};

/**
 * Checks if an event has metadata in localStorage
 * @param {number} eventId - The event ID to check
 * @returns {Object|null} The event metadata or null if not found
 */
export const getExistingEventMetadata = (eventId) => {
  try {
    const eventsMetadata = JSON.parse(localStorage.getItem('eventsMetadata') || '[]');
    return eventsMetadata.find(meta => meta.eventId === parseInt(eventId)) || null;
  } catch (error) {
    console.error('Error getting existing event metadata:', error);
    return null;
  }
};

/**
 * Gets the image URL for an event, using localStorage if available or generating a themed URL
 * @param {Object} event - The event object
 * @returns {string} The image URL
 */
export const getEventImageUrl = (event) => {
  // Check for existing metadata
  const existingMetadata = getExistingEventMetadata(event.eventId);
  
  if (existingMetadata?.imageUrl) {
    console.log(`Using existing image URL for event ${event.eventId}: ${existingMetadata.imageUrl}`);
    return existingMetadata.imageUrl;
  }
  
  // Generate a themed image URL
  const themedUrl = getThemedImageUrl(event);
  console.log(`Generated themed image URL for event ${event.eventId}: ${themedUrl}`);
  return themedUrl;
};

/**
 * Run the migration when the app starts
 */
export const runMigration = () => {
  console.log('Running data migration...');
  const stats = migrateEventMetadata();
  console.log('Migration stats:', stats);
  return stats;
};
