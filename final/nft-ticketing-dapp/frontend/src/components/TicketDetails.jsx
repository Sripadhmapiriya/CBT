import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTicket,
  getEvent,
  getTokenURI,
  getTokenOwner,
  toggleTicketLock,
  useTicket
} from '../utils/contractUtils';
import { ipfsToHttp } from '../utils/ipfsUtils';
import { generateTicketQR } from '../utils/qrUtils';
import { getTicketFallbackImage } from '../utils/fallbackImageUtils';

const TicketDetails = ({ isConnected, account }) => {
  const { tokenId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [event, setEvent] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [owner, setOwner] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Redirect if not connected
    if (isConnected === false) {
      navigate('/');
      return;
    }

    const fetchTicketDetails = async () => {
      try {
        setLoading(true);

        // Get ticket details
        const ticketData = await getTicket(tokenId);
        setTicket(ticketData);

        // Get event details
        const eventData = await getEvent(ticketData.eventId);
        setEvent(eventData);

        // Get token owner
        const ownerAddress = await getTokenOwner(tokenId);
        setOwner(ownerAddress);

        // Check if user is the owner
        const isOwner = ownerAddress.toLowerCase() === account.toLowerCase();

        if (!isOwner) {
          setError('You do not own this ticket.');
          setLoading(false);
          return;
        }

        // Get token URI and metadata
        const tokenURI = await getTokenURI(tokenId);

        try {
          // Convert IPFS URI to HTTP URL
          const httpUrl = ipfsToHttp(tokenURI);
          const response = await fetch(httpUrl);
          const metadataData = await response.json();
          setMetadata(metadataData);
        } catch (err) {
          console.error(`Error fetching metadata for token ${tokenId}:`, err);
          setMetadata({
            name: `Ticket #${tokenId}`,
            description: 'Metadata unavailable',
            image: ''
          });
        }

        // Generate QR code
        const qrCodeData = await generateTicketQR(
          tokenId,
          ticketData.eventId,
          eventData.name,
          ownerAddress
        );
        setQrCode(qrCodeData);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching ticket details:', err);
        setError('Failed to load ticket details. Please try again later.');
        setLoading(false);
      }
    };

    if (isConnected && account) {
      fetchTicketDetails();
    }
  }, [tokenId, isConnected, account, navigate]);

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

  // Toggle ticket lock
  const handleToggleLock = async () => {
    try {
      setProcessing(true);
      await toggleTicketLock(tokenId);

      // Update ticket state
      setTicket({
        ...ticket,
        locked: !ticket.locked
      });

      setProcessing(false);
    } catch (err) {
      console.error('Error toggling ticket lock:', err);
      alert('Failed to toggle ticket lock. Please try again later.');
      setProcessing(false);
    }
  };

  // Mark ticket as used
  const handleUseTicket = async () => {
    try {
      setProcessing(true);
      await useTicket(tokenId);

      // Update ticket state
      setTicket({
        ...ticket,
        used: true
      });

      setProcessing(false);
    } catch (err) {
      console.error('Error marking ticket as used:', err);
      alert('Failed to mark ticket as used. Please try again later.');
      setProcessing(false);
    }
  };

  if (!isConnected) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return <div className="loading">Loading ticket details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!ticket || !event || !metadata) {
    return <div className="error">Ticket not found.</div>;
  }

  return (
    <div className="ticket-details-container">
      <h2>{metadata.name || `Ticket #${tokenId}`}</h2>

      <div className="ticket-content">
        <div className="ticket-image-container">
          <img
            src={
              // Use the metadata image if available (for existing tickets)
              metadata.image ? ipfsToHttp(metadata.image) :
              // Otherwise, use a category-based fallback image
              getTicketFallbackImage(event, tokenId)
            }
            alt={metadata.name || `Ticket #${tokenId}`}
            className="ticket-image"
            onError={(e) => {
              e.target.onerror = null;

              // Determine event type based on keywords
              const eventName = (event.name || '').toLowerCase();
              const eventDescription = (metadata.description || '').toLowerCase();

              // Check for cultural events
              if (eventName.includes('cultural') ||
                  eventName.includes('culture') ||
                  eventDescription.includes('cultural') ||
                  eventDescription.includes('culture')) {
                e.target.src = 'https://img.freepik.com/free-photo/traditional-cultural-dance-performance-stage_53876-138776.jpg';
              }
              // Check for music events
              else if (eventName.includes('music') ||
                  eventName.includes('concert') ||
                  eventName.includes('festival') ||
                  eventDescription.includes('music') ||
                  eventDescription.includes('concert')) {
                e.target.src = 'https://img.freepik.com/free-vector/gradient-music-festival-ticket-template_23-2149000879.jpg';
              }
              // Check for sports events
              else if (eventName.includes('sport') ||
                  eventName.includes('game') ||
                  eventName.includes('match') ||
                  eventDescription.includes('sport') ||
                  eventDescription.includes('game')) {
                e.target.src = 'https://img.freepik.com/free-vector/gradient-football-ticket-template_23-2149000914.jpg';
              }
              // Check for conference events
              else if (eventName.includes('conference') ||
                  eventName.includes('seminar') ||
                  eventName.includes('workshop') ||
                  eventDescription.includes('conference') ||
                  eventDescription.includes('seminar')) {
                e.target.src = 'https://img.freepik.com/free-vector/gradient-webinar-ticket-template_23-2149000909.jpg';
              }
              // Default fallback
              else {
                e.target.src = 'https://img.freepik.com/free-vector/realistic-event-ticket-template-with-tear-off-element_1017-30619.jpg';
              }

              console.log(`Fallback to themed image for ticket ${tokenId}`);
            }}
          />

          {ticket.used && <div className="used-overlay">USED</div>}
          {!isUpcoming(event.date) && !ticket.used && <div className="expired-overlay">EXPIRED</div>}
          {ticket.locked && <div className="locked-badge">🔒 LOCKED</div>}
          {tokenId === 0 && <div className="cultural-badge">Cultural</div>}
        </div>

        <div className="ticket-info">
          <div className="info-group">
            <h3>Event Details</h3>
            <p><strong>Event:</strong> {event.name}</p>
            <p><strong>Date:</strong> {formatDate(event.date)}</p>
            <p><strong>Status:</strong> {isUpcoming(event.date) ? 'Upcoming' : 'Past Event'}</p>
          </div>

          <div className="info-group">
            <h3>Ticket Details</h3>
            <p><strong>Ticket ID:</strong> #{tokenId}</p>
            <p><strong>Status:</strong> {ticket.used ? 'Used' : 'Unused'}</p>
            <p><strong>Transfer:</strong> {ticket.locked ? 'Locked' : 'Unlocked'}</p>
          </div>

          <div className="ticket-actions">
            <button
              onClick={handleToggleLock}
              disabled={processing || ticket.used || !isUpcoming(event.date)}
              className="action-button"
            >
              {ticket.locked ? 'Unlock Ticket' : 'Lock Ticket'}
            </button>

            <button
              onClick={handleUseTicket}
              disabled={processing || ticket.used || !isUpcoming(event.date)}
              className="action-button use-button"
            >
              Mark as Used
            </button>
          </div>
        </div>
      </div>

      <div className="qr-code-section">
        <h3>Ticket QR Code</h3>
        <p>Show this QR code at the venue for entry.</p>

        {qrCode ? (
          <div className="qr-code">
            <img src={qrCode} alt="Ticket QR Code" />
          </div>
        ) : (
          <div className="qr-loading">Generating QR code...</div>
        )}
      </div>

      <div className="ticket-description">
        <h3>Description</h3>
        <p>{metadata.description || 'No description available.'}</p>
      </div>

      {metadata.attributes && (
        <div className="ticket-attributes">
          <h3>Attributes</h3>
          <div className="attributes-grid">
            {metadata.attributes.map((attr, index) => (
              <div key={index} className="attribute">
                <span className="attribute-name">{attr.trait_type}</span>
                <span className="attribute-value">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetails;
