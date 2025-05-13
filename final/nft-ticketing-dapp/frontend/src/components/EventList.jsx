import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllEvents } from '../utils/contractUtils';
import { getEventFallbackImage } from '../utils/fallbackImageUtils';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define fetchEvents outside useEffect so it can be reused
  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log('Starting to fetch events...');

      // Use the getAllEvents function to get all events
      const allEvents = await getAllEvents();
      console.log(`Successfully fetched ${allEvents.length} events from contract`);

      // Process events - add image URLs from metadata and filter/sort
      let eventList = await Promise.all(allEvents.map(async (event) => {
        try {
          // In a real implementation, we would fetch the event metadata from IPFS
          // For now, we'll use a placeholder image with the event name

          // Create a new object with all the event properties
          const processedEvent = {
            ...event,
            // Use a category-based fallback image for existing events
            imageUrl: getEventFallbackImage(event)
          };

          return processedEvent;
        } catch (error) {
          console.warn(`Error fetching metadata for event ${event.eventId}:`, error);
          // Return the event with a fallback image
          return {
            ...event,
            imageUrl: getEventFallbackImage(event)
          };
        }
      }));

      // Filter out inactive events and sort by date (upcoming first)
      eventList = eventList
        .filter(event => event.active && event.name.trim() !== '') // Filter out events with empty names
        .sort((a, b) => a.date - b.date);

      console.log(`Processed ${eventList.length} active events with valid data`);

      setEvents(eventList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch of events
    fetchEvents();

    // Listen for navigation events (popstate) to refresh events
    const handlePopState = () => {
      fetchEvents();
    };

    // Listen for custom event when a new event is created
    const handleEventCreated = () => {
      console.log('Detected new event created, refreshing events list...');
      fetchEvents();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('eventCreated', handleEventCreated);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('eventCreated', handleEventCreated);
    };
  }, []);

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if event is upcoming
  const isUpcoming = (date) => {
    return new Date(date) > new Date();
  };

  return (
    <div className="event-list-container">
      <div className="event-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Upcoming Events</h2>
        <button
          onClick={() => fetchEvents()}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? (
            <>
              <span className="loading-spinner" style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
                borderTopColor: 'white',
                animation: 'spin 1s linear infinite'
              }}></span>
              Refreshing...
            </>
          ) : 'Refresh Events'}
        </button>
      </div>

      {loading ? (
        <div className="loading" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div className="loading-spinner" style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid rgba(0,0,0,0.1)',
            borderRadius: '50%',
            borderTopColor: 'var(--primary-color)',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
          <p>Loading events...</p>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
            This may take a moment as we fetch data from the blockchain
          </p>
        </div>
      ) : error ? (
        <div className="error" style={{
          padding: '1rem',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          <h3>Error Loading Events</h3>
          <p>{error}</p>
          <button
            onClick={() => fetchEvents()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#c62828',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="no-events" style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <h3>No Events Found</h3>
          <p>There are no upcoming events at this time.</p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
            If you just created an event and don't see it here, try clicking the Refresh Events button above.
          </p>
          <Link to="/create-event" style={{
            display: 'inline-block',
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: 'var(--primary-color)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}>
            Create an Event
          </Link>
        </div>
      ) : (
        <div className="events-grid">
          {events.map(event => (
            <div
              key={event.eventId}
              className={`event-card ${!isUpcoming(event.date) ? 'past-event' : ''}`}
              style={{
                border: '1px solid #eee',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer',
                backgroundColor: 'white'
              }}
              onClick={() => window.location.href = `/events/${event.eventId}`}
            >
              <div className="event-image">
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px 8px 0 0'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://cdn.pixabay.com/photo/2016/11/23/15/48/audience-1853662_1280.jpg';
                    console.log('Using default event image due to loading error');
                  }}
                />
              </div>
              <div className="event-content" style={{ padding: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>{event.name}</h3>
                <p className="event-date" style={{ color: '#666' }}>{formatDate(event.date)}</p>
                <p className="event-description" style={{ marginBottom: '1rem' }}>
                  {event.description.length > 100
                    ? `${event.description.substring(0, 100)}...`
                    : event.description}
                </p>
                <div className="event-details" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}>
                  <p>Price: {event.ticketPrice} ETH</p>
                  <p>Tickets: {event.ticketsSold} / {event.maxTickets}</p>
                </div>
                <Link
                  to={`/events/${event.eventId}`}
                  className="view-event-btn"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '0.5rem',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add CSS animation for spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .events-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 2rem;
          }
          .event-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
        `}
      </style>
    </div>
  );
};

export default EventList;
