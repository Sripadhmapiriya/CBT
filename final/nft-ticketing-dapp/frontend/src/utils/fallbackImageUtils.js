/**
 * Utility functions for handling fallback images for events and tickets
 */

// Default event image URLs - using direct image URLs that are reliable
const DEFAULT_EVENT_IMAGES = [
  'https://cdn.pixabay.com/photo/2016/11/23/15/48/audience-1853662_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/11/22/19/15/hand-1850120_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/07/21/23/57/concert-2527495_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/11/29/06/17/audience-1867754_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/01/06/23/03/sunrise-1959227_1280.jpg'
];

// Default ticket image URLs - specifically designed for tickets
const DEFAULT_TICKET_IMAGES = [
  'https://img.freepik.com/free-vector/realistic-event-ticket-template-with-tear-off-element_1017-30619.jpg',
  'https://img.freepik.com/free-vector/realistic-golden-ticket-template_52683-35936.jpg',
  'https://img.freepik.com/free-vector/cinema-tickets-set_1017-30634.jpg',
  'https://img.freepik.com/free-vector/realistic-event-ticket-template-with-date-time_1017-30618.jpg',
  'https://img.freepik.com/free-vector/realistic-event-ticket-template-with-abstract-design_1017-30617.jpg'
];

// Cultural-themed images for special tickets
const CULTURAL_TICKET_IMAGES = [
  'https://img.freepik.com/free-photo/traditional-cultural-dance-performance-stage_53876-138776.jpg',
  'https://img.freepik.com/free-photo/group-people-traditional-indian-clothes_23-2149064512.jpg',
  'https://img.freepik.com/free-photo/woman-dancing-traditional-chinese-clothing_23-2149064502.jpg',
  'https://img.freepik.com/free-photo/african-american-jazz-musician-playing-trumpet_23-2149071755.jpg',
  'https://img.freepik.com/free-photo/traditional-mexican-hat-with-decorations_23-2149067702.jpg'
];

// Music-themed ticket images
const MUSIC_TICKET_IMAGES = [
  'https://img.freepik.com/free-vector/music-event-poster-template-with-abstract-shapes_1361-1316.jpg',
  'https://img.freepik.com/free-vector/gradient-music-festival-ticket-template_23-2149000879.jpg',
  'https://img.freepik.com/free-vector/gradient-music-festival-ticket-template_23-2149000877.jpg',
  'https://img.freepik.com/free-vector/music-event-poster-with-photo-template_52683-42065.jpg',
  'https://img.freepik.com/free-vector/gradient-music-festival-ticket-template_23-2149000878.jpg'
];

// Sports-themed ticket images
const SPORTS_TICKET_IMAGES = [
  'https://img.freepik.com/free-vector/gradient-football-ticket-template_23-2149000914.jpg',
  'https://img.freepik.com/free-vector/gradient-basketball-ticket-template_23-2149000913.jpg',
  'https://img.freepik.com/free-vector/gradient-baseball-ticket-template_23-2149000912.jpg',
  'https://img.freepik.com/free-vector/gradient-tennis-ticket-template_23-2149000911.jpg',
  'https://img.freepik.com/free-vector/gradient-cricket-ticket-template_23-2149000910.jpg'
];

// Conference and business-themed ticket images
const CONFERENCE_TICKET_IMAGES = [
  'https://img.freepik.com/free-vector/business-conference-banner-template_23-2149004928.jpg',
  'https://img.freepik.com/free-vector/gradient-webinar-ticket-template_23-2149000909.jpg',
  'https://img.freepik.com/free-vector/gradient-seminar-ticket-template_23-2149000908.jpg',
  'https://img.freepik.com/free-vector/gradient-business-ticket-template_23-2149000907.jpg',
  'https://img.freepik.com/free-vector/gradient-workshop-ticket-template_23-2149000906.jpg'
];

/**
 * Get a fallback image URL for an event based on its ID
 * This is used for events that were created before image upload was required
 *
 * @param {Object} event - The event object with eventId
 * @returns {string} - The fallback image URL
 */
export const getEventFallbackImage = (event) => {
  if (!event) return DEFAULT_EVENT_IMAGES[0];

  // Use the event ID to select a consistent image from the array
  const index = event.eventId % DEFAULT_EVENT_IMAGES.length;
  return DEFAULT_EVENT_IMAGES[index];
};

/**
 * Get a fallback image URL for a ticket based on its event
 *
 * @param {Object} event - The event object
 * @param {number} ticketId - The ticket ID
 * @returns {string} - The fallback image URL
 */
export const getTicketFallbackImage = (event, ticketId) => {
  if (!event) return DEFAULT_TICKET_IMAGES[0];

  // Convert ticketId to a number for consistent indexing
  const numericTicketId = typeof ticketId === 'number' ? ticketId : parseInt(ticketId) || 0;

  // Get event name and description (lowercase for easier matching)
  const eventName = (event.name || '').toLowerCase();
  const eventDescription = (event.description || '').toLowerCase();

  // Determine event type based on keywords in name or description

  // Check for cultural events
  if (eventName.includes('cultural') ||
      eventName.includes('culture') ||
      eventName.includes('traditional') ||
      eventDescription.includes('cultural') ||
      eventDescription.includes('culture') ||
      eventDescription.includes('traditional')) {
    const index = numericTicketId % CULTURAL_TICKET_IMAGES.length;
    return CULTURAL_TICKET_IMAGES[index];
  }

  // Check for music events
  if (eventName.includes('music') ||
      eventName.includes('concert') ||
      eventName.includes('festival') ||
      eventName.includes('band') ||
      eventName.includes('performance') ||
      eventDescription.includes('music') ||
      eventDescription.includes('concert') ||
      eventDescription.includes('festival') ||
      eventDescription.includes('band') ||
      eventDescription.includes('performance')) {
    const index = numericTicketId % MUSIC_TICKET_IMAGES.length;
    return MUSIC_TICKET_IMAGES[index];
  }

  // Check for sports events
  if (eventName.includes('sport') ||
      eventName.includes('game') ||
      eventName.includes('match') ||
      eventName.includes('tournament') ||
      eventName.includes('championship') ||
      eventName.includes('football') ||
      eventName.includes('basketball') ||
      eventName.includes('soccer') ||
      eventName.includes('baseball') ||
      eventDescription.includes('sport') ||
      eventDescription.includes('game') ||
      eventDescription.includes('match') ||
      eventDescription.includes('tournament') ||
      eventDescription.includes('championship')) {
    const index = numericTicketId % SPORTS_TICKET_IMAGES.length;
    return SPORTS_TICKET_IMAGES[index];
  }

  // Check for conference/business events
  if (eventName.includes('conference') ||
      eventName.includes('seminar') ||
      eventName.includes('workshop') ||
      eventName.includes('business') ||
      eventName.includes('meeting') ||
      eventName.includes('summit') ||
      eventDescription.includes('conference') ||
      eventDescription.includes('seminar') ||
      eventDescription.includes('workshop') ||
      eventDescription.includes('business') ||
      eventDescription.includes('meeting') ||
      eventDescription.includes('summit')) {
    const index = numericTicketId % CONFERENCE_TICKET_IMAGES.length;
    return CONFERENCE_TICKET_IMAGES[index];
  }

  // Default case - use generic ticket images
  const index = numericTicketId % DEFAULT_TICKET_IMAGES.length;
  return DEFAULT_TICKET_IMAGES[index];
};
