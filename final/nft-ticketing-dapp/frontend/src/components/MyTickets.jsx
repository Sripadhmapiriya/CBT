import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { getContract, getTicket, getEvent, getTokenURI } from '../utils/contractUtils';
import { checkContractConnection, getContractAddress } from '../utils/contractChecker';
import { ipfsToHttp } from '../utils/ipfsUtils';
import { getTicketFallbackImage } from '../utils/fallbackImageUtils';

const MyTickets = ({ isConnected, account }) => {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redirect if not connected
    if (isConnected === false) {
      navigate('/');
      return;
    }

    const fetchUserTickets = async () => {
      try {
        setLoading(true);

        // First check if the contract is connected
        const isContractConnected = await checkContractConnection();

        if (!isContractConnected) {
          console.warn('Contract not connected. Using address:', getContractAddress());
          setError('Failed to connect to the contract. Please check your network connection and make sure you are on the correct network.');
          setLoading(false);
          return;
        }

        const contract = await getContract(false);

        // Get all transfer events where the user is the recipient
        const filter = contract.filters.Transfer(null, account);
        const events = await contract.queryFilter(filter);

        // Get unique token IDs
        const tokenIds = [...new Set(events.map(event => event.args.tokenId.toNumber()))];

        // Check if the user still owns these tokens
        const userTickets = [];

        for (const tokenId of tokenIds) {
          try {
            const currentOwner = await contract.ownerOf(tokenId);

            // Skip if user is not the current owner
            if (currentOwner.toLowerCase() !== account.toLowerCase()) {
              continue;
            }

            // Get ticket details
            const ticket = await getTicket(tokenId);

            // Get event details
            const event = await getEvent(ticket.eventId);

            // Get token URI and metadata
            const tokenURI = await getTokenURI(tokenId);
            let metadata = {};

            try {
              // Convert IPFS URI to HTTP URL
              const httpUrl = ipfsToHttp(tokenURI);
              const response = await fetch(httpUrl);
              metadata = await response.json();
            } catch (err) {
              console.error(`Error fetching metadata for token ${tokenId}:`, err);
              metadata = {
                name: `Ticket #${tokenId}`,
                description: 'Metadata unavailable',
                image: ''
              };
            }

            userTickets.push({
              tokenId,
              eventId: ticket.eventId,
              eventName: event.name,
              eventDate: event.date,
              used: ticket.used,
              locked: ticket.locked,
              metadata
            });
          } catch (err) {
            console.error(`Error processing token ${tokenId}:`, err);
            // Skip this token if there's an error
            continue;
          }
        }

        // Sort tickets by event date (upcoming first)
        userTickets.sort((a, b) => a.eventDate - b.eventDate);

        setTickets(userTickets);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user tickets:', err);
        setError('Failed to load your tickets. Please try again later.');
        setLoading(false);
      }
    };

    if (isConnected && account) {
      fetchUserTickets();
    }
  }, [isConnected, account, navigate]);

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if event is upcoming
  const isUpcoming = (date) => {
    return new Date(date) > new Date();
  };

  if (!isConnected) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return <div className="loading">Loading your tickets...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Group tickets by status
  const upcomingTickets = tickets.filter(ticket => isUpcoming(ticket.eventDate) && !ticket.used);
  const usedTickets = tickets.filter(ticket => ticket.used);
  const expiredTickets = tickets.filter(ticket => !isUpcoming(ticket.eventDate) && !ticket.used);

  // Render a ticket card
  const renderTicketCard = (ticket) => (
    <div
      key={ticket.tokenId}
      className={`ticket-card ${ticket.used ? 'used' : ''} ${!isUpcoming(ticket.eventDate) ? 'past' : ''}`}
    >
      <div className="ticket-image">
        <img
          src={
            // Use the metadata image if available (for existing tickets)
            ticket.metadata.image ? ipfsToHttp(ticket.metadata.image) :
            // Use a category-based fallback image
            getTicketFallbackImage({
              eventId: ticket.eventId,
              name: ticket.eventName,
              description: ticket.metadata.description || ''
            }, ticket.tokenId)
          }
          alt={ticket.metadata.name || `Ticket #${ticket.tokenId}`}
          onError={(e) => {
            e.target.onerror = null;

            // Determine event type based on keywords
            const eventName = ticket.eventName.toLowerCase();
            const eventDescription = (ticket.metadata.description || '').toLowerCase();

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

            console.log(`Fallback to themed image for ticket ${ticket.tokenId}`);
          }}
        />
        {ticket.used && <div className="used-overlay">USED</div>}
        {!isUpcoming(ticket.eventDate) && !ticket.used && <div className="expired-overlay">EXPIRED</div>}
        {ticket.locked && <div className="locked-badge">🔒</div>}

        {/* Add a special badge for ticket #0 */}
        {ticket.tokenId === 0 && (
          <div className="cultural-badge">Cultural</div>
        )}
      </div>

      <div className="ticket-info">
        <h3>{ticket.eventName}</h3>
        <p className="ticket-date">{formatDate(ticket.eventDate)}</p>
        <div className="ticket-details">
          <span className="ticket-id">Ticket #{ticket.tokenId}</span>
          {isUpcoming(ticket.eventDate) && !ticket.used && (
            <span className="ticket-status active">Active</span>
          )}
        </div>

        <Link to={`/tickets/${ticket.tokenId}`} className="view-ticket-btn">
          View Ticket
        </Link>
      </div>
    </div>
  );

  return (
    <div className="my-tickets-container">
      <div className="tickets-header">
        <h2>My Tickets</h2>
        <Link to="/events" className="browse-more-btn">
          Browse More Events
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="no-tickets">
          <div className="no-tickets-icon">🎫</div>
          <h3>You don't have any tickets yet</h3>
          <p>Browse our events and purchase tickets to see them here.</p>
          <Link to="/events" className="browse-events-btn">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="tickets-sections">
          {upcomingTickets.length > 0 && (
            <div className="tickets-section">
              <h3 className="section-title">Upcoming Events</h3>
              <div className="tickets-grid">
                {upcomingTickets.map(renderTicketCard)}
              </div>
            </div>
          )}

          {usedTickets.length > 0 && (
            <div className="tickets-section">
              <h3 className="section-title">Used Tickets</h3>
              <div className="tickets-grid">
                {usedTickets.map(renderTicketCard)}
              </div>
            </div>
          )}

          {expiredTickets.length > 0 && (
            <div className="tickets-section">
              <h3 className="section-title">Expired Tickets</h3>
              <div className="tickets-grid">
                {expiredTickets.map(renderTicketCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyTickets;
