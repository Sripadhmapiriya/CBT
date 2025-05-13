import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { getEvent, mintTicket } from '../utils/contractUtils';
import {
  uploadImageToIPFS,
  createTicketMetadata,
  uploadMetadataToIPFS,
  ipfsToHttp
} from '../utils/ipfsUtils';
import { getEventFallbackImage, getTicketFallbackImage } from '../utils/fallbackImageUtils';

const EventDetails = ({ isConnected }) => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [eventImage, setEventImage] = useState('');

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        console.log(`Fetching details for event ID: ${eventId}`);

        const eventData = await getEvent(eventId);
        console.log('Event data retrieved:', eventData);

        if (eventData) {
          // Use a category-based fallback image for existing events
          const imageUrl = getEventFallbackImage(eventData);
          console.log(`Using fallback image for event ${eventId}: ${imageUrl}`);

          setEventImage(imageUrl);
        }

        setEvent(eventData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details. Please try again later.');
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

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

  // Purchase ticket
  const purchaseTicket = async () => {
    if (!isConnected) {
      alert('Please connect your wallet to purchase tickets.');
      return;
    }

    try {
      setPurchasing(true);
      setPurchaseStatus('Preparing ticket...');

      // Use a dedicated ticket image that matches the event theme
      // This ensures tickets have an appearance related to the event type
      const ticketImageUrl = getTicketFallbackImage(event, 0); // Use 0 as default ticket ID for preview
      console.log(`Using themed ticket image for event "${event.name}": ${ticketImageUrl}`);

      setPurchaseStatus('Creating ticket metadata...');
      // Create ticket metadata
      const metadata = await createTicketMetadata(
        event.eventId,
        event.name,
        event.date,
        event.ticketPrice,
        ticketImageUrl
      );

      setPurchaseStatus('Uploading metadata to IPFS...');
      // Upload metadata to IPFS
      const tokenURI = await uploadMetadataToIPFS(metadata);

      setPurchaseStatus('Minting ticket NFT...');
      // Mint the ticket
      const tx = await mintTicket(event.eventId, tokenURI, event.ticketPrice);

      setPurchaseStatus('Transaction confirmed! Redirecting to your tickets...');

      // Wait for 2 seconds before redirecting
      setTimeout(() => {
        navigate('/my-tickets');
      }, 2000);
    } catch (err) {
      console.error('Error purchasing ticket:', err);
      setPurchaseStatus('');
      alert('Failed to purchase ticket. Please try again later.');
      setPurchasing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!event) {
    return <div className="error">Event not found.</div>;
  }

  return (
    <div className="event-details-container">
      <h2>{event.name}</h2>

      {eventImage && (
        <div className="event-image-container" style={{ marginBottom: '2rem' }}>
          <img
            src={eventImage || 'https://cdn.pixabay.com/photo/2016/11/23/15/48/audience-1853662_1280.jpg'}
            alt={event.name}
            style={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'cover',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://cdn.pixabay.com/photo/2016/11/23/15/48/audience-1853662_1280.jpg';
              console.log('Fallback to default image due to error loading:', eventImage);
            }}
          />
        </div>
      )}

      <div className="event-info">
        <div className="event-date-time">
          <h3>Date & Time</h3>
          <p>{formatDate(event.date)}</p>
          <p className={isUpcoming(event.date) ? 'upcoming' : 'past'}>
            {isUpcoming(event.date) ? 'Upcoming' : 'Past Event'}
          </p>
        </div>

        <div className="event-tickets">
          <h3>Tickets</h3>
          <p>Price: {event.ticketPrice} ETH</p>
          <p>Available: {event.maxTickets - event.ticketsSold} / {event.maxTickets}</p>
          {event.ticketsSold >= event.maxTickets && (
            <p className="sold-out">Sold Out</p>
          )}
        </div>

        <div className="event-organizer">
          <h3>Organizer</h3>
          <p>{event.organizer.substring(0, 6)}...{event.organizer.substring(event.organizer.length - 4)}</p>
        </div>
      </div>

      <div className="event-description">
        <h3>Description</h3>
        <p>{event.description}</p>
      </div>

      <div className="purchase-section">
        {purchasing ? (
          <div className="purchase-status">
            <p>{purchaseStatus}</p>
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <button
            className="purchase-button"
            onClick={purchaseTicket}
            disabled={
              !isConnected ||
              !isUpcoming(event.date) ||
              event.ticketsSold >= event.maxTickets
            }
          >
            {!isConnected
              ? 'Connect Wallet to Purchase'
              : !isUpcoming(event.date)
                ? 'Event Has Ended'
                : event.ticketsSold >= event.maxTickets
                  ? 'Sold Out'
                  : `Purchase Ticket for ${event.ticketPrice} ETH`
            }
          </button>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
