import { ethers } from 'ethers';
import NFTTicketingABI from '../contracts/NFTTicketing.json';

// Contract address from environment variable with fallback
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0x6710D2C70ba9cE7f70c3655DE3CF7960e942cD21';

// Log the contract address being used
console.log('Using contract address:', contractAddress);

// Get provider and signer
export const getProviderAndSigner = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to use this application.');
  }

  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Check if we're using ethers v5 or v6
    let provider, signer;

    if (ethers.providers) {
      // ethers v5
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
    } else {
      // ethers v6
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
    }

    return { provider, signer };
  } catch (error) {
    console.error('Error connecting to MetaMask:', error);
    throw new Error('Failed to connect to MetaMask. Please make sure it is unlocked and connected to the correct network.');
  }
};

// Get contract instance
export const getContract = async (withSigner = true) => {
  const { provider, signer } = await getProviderAndSigner();
  return new ethers.Contract(
    contractAddress,
    NFTTicketingABI.abi,
    withSigner ? signer : provider
  );
};

// Get current account
export const getCurrentAccount = async () => {
  const { signer } = await getProviderAndSigner();
  return await signer.getAddress();
};

// Check if user has admin role
export const isAdmin = async () => {
  const contract = await getContract();
  const account = await getCurrentAccount();
  const ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));
  return await contract.hasRole(ADMIN_ROLE, account);
};

// Check if user has organizer role
export const isOrganizer = async (address) => {
  const contract = await getContract();
  const ORGANIZER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ORGANIZER_ROLE"));

  // If no address is provided, check the current user
  if (!address) {
    const account = await getCurrentAccount();
    return await contract.hasRole(ORGANIZER_ROLE, account);
  }

  // Check the specified address
  return await contract.hasRole(ORGANIZER_ROLE, address);
};

// Create a new event
export const createEvent = async (name, description, date, ticketPrice, maxTickets) => {
  const contract = await getContract();
  const tx = await contract.createEvent(
    name,
    description,
    Math.floor(new Date(date).getTime() / 1000),
    ethers.utils.parseEther(ticketPrice.toString()),
    maxTickets
  );
  return await tx.wait();
};

// Get event details
export const getEvent = async (eventId) => {
  try {
    const contract = await getContract(false);
    const event = await contract.getEvent(eventId);
    return {
      eventId: event.eventId.toNumber(),
      name: event.name,
      description: event.description,
      date: new Date(event.date.toNumber() * 1000),
      ticketPrice: ethers.utils.formatEther(event.ticketPrice),
      maxTickets: event.maxTickets.toNumber(),
      ticketsSold: event.ticketsSold.toNumber(),
      organizer: event.organizer,
      active: event.active
    };
  } catch (error) {
    console.error(`Error getting event ${eventId}:`, error);
    throw error;
  }
};

// Get all events (helper function)
export const getAllEvents = async () => {
  try {
    const contract = await getContract(false);
    const events = [];
    let eventId = 0;
    let consecutiveErrors = 0;
    let consecutiveEmptyEvents = 0;
    const MAX_CONSECUTIVE_ERRORS = 3; // Stop after 3 consecutive errors
    const MAX_CONSECUTIVE_EMPTY = 5; // Stop after 5 consecutive empty events
    const MAX_EVENTS = 20; // Reduced limit to make fetching faster

    console.log('Starting to fetch events with optimized algorithm...');

    // Try to fetch events until we hit one of our termination conditions
    while (
      consecutiveErrors < MAX_CONSECUTIVE_ERRORS &&
      consecutiveEmptyEvents < MAX_CONSECUTIVE_EMPTY &&
      eventId < MAX_EVENTS
    ) {
      try {
        // Fetch the event
        const event = await contract.getEvent(eventId);

        // Check if the event has valid data
        if (event && event.eventId !== undefined) {
          // Reset consecutive errors counter on success
          consecutiveErrors = 0;

          // Format the event data
          try {
            // Handle different ethers.js versions
            const formatEther = ethers.utils?.formatEther || ethers.formatEther;

            const formattedEvent = {
              eventId: typeof event.eventId.toNumber === 'function' ? event.eventId.toNumber() : Number(event.eventId),
              name: event.name || '',
              description: event.description || '',
              date: new Date(typeof event.date.toNumber === 'function' ? event.date.toNumber() * 1000 : Number(event.date) * 1000),
              ticketPrice: formatEther(event.ticketPrice),
              maxTickets: typeof event.maxTickets.toNumber === 'function' ? event.maxTickets.toNumber() : Number(event.maxTickets),
              ticketsSold: typeof event.ticketsSold.toNumber === 'function' ? event.ticketsSold.toNumber() : Number(event.ticketsSold),
              organizer: event.organizer,
              active: event.active
            };

            // Only add events with valid data
            if (formattedEvent.name.trim() !== '') {
              events.push(formattedEvent);
              console.log(`Successfully fetched event ${eventId}: ${formattedEvent.name}`);
              consecutiveEmptyEvents = 0; // Reset empty events counter
            } else {
              console.log(`Skipping event ${eventId} with empty name`);
              consecutiveEmptyEvents++;
            }
          } catch (formatError) {
            console.error(`Error formatting event ${eventId}:`, formatError);
            consecutiveEmptyEvents++;
          }
        } else {
          console.warn(`Event ${eventId} returned invalid data`);
          consecutiveErrors++;
          consecutiveEmptyEvents++;
        }

        eventId++;
      } catch (error) {
        console.warn(`Error fetching event ${eventId}`);
        consecutiveErrors++;
        consecutiveEmptyEvents++;
        eventId++;
      }
    }

    // Log the reason for termination
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.log(`Stopped fetching: ${MAX_CONSECUTIVE_ERRORS} consecutive errors`);
    } else if (consecutiveEmptyEvents >= MAX_CONSECUTIVE_EMPTY) {
      console.log(`Stopped fetching: ${MAX_CONSECUTIVE_EMPTY} consecutive empty events`);
    } else if (eventId >= MAX_EVENTS) {
      console.log(`Stopped fetching: reached maximum event limit (${MAX_EVENTS})`);
    }

    console.log(`Fetched a total of ${events.length} valid events`);
    return events;
  } catch (error) {
    console.error('Error in getAllEvents function:', error);
    return [];
  }
};

// Mint a ticket
export const mintTicket = async (eventId, tokenURI, ticketPrice) => {
  const contract = await getContract();
  const tx = await contract.mintTicket(eventId, tokenURI, {
    value: ethers.utils.parseEther(ticketPrice.toString())
  });
  return await tx.wait();
};

// Get ticket details
export const getTicket = async (tokenId) => {
  const contract = await getContract(false);
  const ticket = await contract.getTicket(tokenId);
  return {
    tokenId: ticket.tokenId.toNumber(),
    eventId: ticket.eventId.toNumber(),
    used: ticket.used,
    locked: ticket.locked
  };
};

// Toggle ticket lock
export const toggleTicketLock = async (tokenId) => {
  const contract = await getContract();
  const tx = await contract.toggleTicketLock(tokenId);
  return await tx.wait();
};

// Mark ticket as used
export const useTicket = async (tokenId) => {
  const contract = await getContract();
  const tx = await contract.useTicket(tokenId);
  return await tx.wait();
};

// Verify ticket (for organizers)
export const verifyTicket = async (tokenId) => {
  const contract = await getContract();
  return await contract.verifyTicket(tokenId);
};

// Add organizer (admin only)
export const addOrganizer = async (organizerAddress) => {
  const contract = await getContract();
  const tx = await contract.addOrganizer(organizerAddress);
  return await tx.wait();
};

// Remove organizer (admin only)
export const removeOrganizer = async (organizerAddress) => {
  const contract = await getContract();
  const tx = await contract.removeOrganizer(organizerAddress);
  return await tx.wait();
};

// Get token URI
export const getTokenURI = async (tokenId) => {
  const contract = await getContract(false);
  return await contract.tokenURI(tokenId);
};

// Get owner of token
export const getTokenOwner = async (tokenId) => {
  const contract = await getContract(false);
  return await contract.ownerOf(tokenId);
};
