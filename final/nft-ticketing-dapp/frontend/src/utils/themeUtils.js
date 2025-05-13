/**
 * Utility functions for determining event themes and generating themed images
 */

// Define theme categories based on event name and description
export const getEventTheme = (eventName, eventDescription) => {
  const name = eventName.toLowerCase();
  const description = eventDescription ? eventDescription.toLowerCase() : '';
  const combinedText = name + ' ' + description;
  
  // Define theme categories and their keywords
  const themes = {
    music: ['concert', 'festival', 'music', 'band', 'performance', 'live', 'dj', 'rock', 'jazz', 'pop', 'singer'],
    sports: ['game', 'match', 'tournament', 'championship', 'sports', 'football', 'basketball', 'soccer', 'tennis', 'baseball', 'athletic'],
    conference: ['conference', 'seminar', 'workshop', 'talk', 'presentation', 'speaker', 'business', 'professional', 'meeting', 'summit'],
    art: ['exhibition', 'gallery', 'art', 'museum', 'creative', 'design', 'painting', 'sculpture', 'photography', 'artistic'],
    food: ['food', 'culinary', 'tasting', 'dining', 'restaurant', 'chef', 'cooking', 'cuisine', 'gastronomy', 'wine', 'beer'],
    technology: ['tech', 'technology', 'digital', 'software', 'hardware', 'coding', 'developer', 'programming', 'innovation', 'startup'],
    education: ['education', 'learning', 'school', 'university', 'college', 'academic', 'course', 'class', 'training', 'lecture'],
    entertainment: ['entertainment', 'show', 'performance', 'theater', 'cinema', 'movie', 'film', 'comedy', 'drama', 'fun'],
    cultural: ['cultural', 'culture', 'heritage', 'traditional', 'history', 'historical', 'ethnic', 'national', 'international', 'global'],
    charity: ['charity', 'fundraiser', 'nonprofit', 'donation', 'volunteer', 'community', 'support', 'cause', 'awareness', 'benefit']
  };
  
  // Check which theme has the most keyword matches
  let bestTheme = 'general';
  let highestMatches = 0;
  
  for (const [theme, keywords] of Object.entries(themes)) {
    const matches = keywords.filter(keyword => combinedText.includes(keyword)).length;
    if (matches > highestMatches) {
      highestMatches = matches;
      bestTheme = theme;
    }
  }
  
  return bestTheme;
};

// Map themes to appropriate Unsplash collections
export const themeCollections = {
  music: '/collection/344799', // Music collection
  sports: '/collection/8687831', // Sports collection
  conference: '/collection/9454911', // Business collection
  art: '/collection/3694365', // Art collection
  food: '/collection/3652377', // Food collection
  technology: '/collection/8469893', // Technology collection
  education: '/collection/345724', // Education collection
  entertainment: '/collection/3106804', // Entertainment collection
  cultural: '/collection/3657445', // Cultural collection
  charity: '/collection/9730087', // Community collection
  general: '/collection/2022043' // Events collection
};

// Generate themed image URL based on event type
export const getThemedImageUrl = (event, width = 800, height = 400) => {
  // Determine the event theme
  const theme = getEventTheme(event.name, event.description);
  
  // Create a consistent seed based on event ID and name
  const seed = `${event.eventId}-${event.name.replace(/\s+/g, '')}`;
  
  // Get the appropriate collection for the theme
  const collection = themeCollections[theme] || themeCollections.general;
  
  // Return the themed image URL
  return `https://source.unsplash.com${collection}/${width}x${height}?${seed}`;
};

// Generate themed image URL based on prompt
export const getThemedImageUrlFromPrompt = (prompt, width = 800, height = 400) => {
  // Determine the theme from the prompt
  const theme = getEventTheme(prompt, '');
  
  // Create a consistent seed based on prompt
  const seed = Date.now();
  
  // Get the appropriate collection for the theme
  const collection = themeCollections[theme] || themeCollections.general;
  
  // Return the themed image URL
  return `https://source.unsplash.com${collection}/${width}x${height}?${seed}`;
};

// Log the theme for debugging
export const logEventTheme = (event) => {
  const theme = getEventTheme(event.name, event.description);
  console.log(`Event "${event.name}" has theme: ${theme}`);
  return theme;
};
