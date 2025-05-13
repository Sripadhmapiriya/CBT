// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title NFTTicketing
 * @dev A contract for creating and managing NFT-based event tickets
 */
contract NFTTicketing is ERC721URIStorage, AccessControl {
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");

    // Counter for token IDs
    uint256 private _tokenIdCounter;

    // Event struct
    struct Event {
        uint256 eventId;
        string name;
        string description;
        uint256 date;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 ticketsSold;
        address organizer;
        bool active;
    }

    // Ticket struct
    struct Ticket {
        uint256 tokenId;
        uint256 eventId;
        bool used;
        bool locked;
    }

    // Mapping from event ID to Event
    mapping(uint256 => Event) public events;

    // Mapping from token ID to Ticket
    mapping(uint256 => Ticket) public tickets;

    // Counter for event IDs
    uint256 private _eventIdCounter;

    // Events
    event EventCreated(uint256 indexed eventId, string name, address organizer);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, address owner);
    event TicketUsed(uint256 indexed tokenId, uint256 indexed eventId);
    event TicketLockToggled(uint256 indexed tokenId, bool locked);

    /**
     * @dev Constructor
     */
    constructor() ERC721("NFT Event Ticket", "TICKET") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Create a new event
     * @param name Event name
     * @param description Event description
     * @param date Event date (Unix timestamp)
     * @param ticketPrice Price per ticket in wei
     * @param maxTickets Maximum number of tickets available
     */
    function createEvent(
        string memory name,
        string memory description,
        uint256 date,
        uint256 ticketPrice,
        uint256 maxTickets
    ) public onlyRole(ORGANIZER_ROLE) {
        require(date > block.timestamp, "Event date must be in the future");
        require(maxTickets > 0, "Max tickets must be greater than zero");

        uint256 eventId = _eventIdCounter;
        _eventIdCounter++;

        events[eventId] = Event({
            eventId: eventId,
            name: name,
            description: description,
            date: date,
            ticketPrice: ticketPrice,
            maxTickets: maxTickets,
            ticketsSold: 0,
            organizer: msg.sender,
            active: true
        });

        emit EventCreated(eventId, name, msg.sender);
    }

    /**
     * @dev Mint a new ticket for an event
     * @param eventId ID of the event
     * @param tokenURI URI for the ticket metadata
     */
    function mintTicket(uint256 eventId, string memory tokenURI) public payable {
        Event storage eventData = events[eventId];

        require(eventData.active, "Event is not active");
        require(eventData.date > block.timestamp, "Event has already occurred");
        require(eventData.ticketsSold < eventData.maxTickets, "Event is sold out");
        require(msg.value >= eventData.ticketPrice, "Insufficient payment");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        tickets[tokenId] = Ticket({
            tokenId: tokenId,
            eventId: eventId,
            used: false,
            locked: false
        });

        eventData.ticketsSold++;

        // Transfer payment to event organizer
        payable(eventData.organizer).transfer(msg.value);

        emit TicketMinted(tokenId, eventId, msg.sender);
    }

    /**
     * @dev Mark a ticket as used
     * @param tokenId ID of the ticket token
     */
    function useTicket(uint256 tokenId) public {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved or owner");
        require(!tickets[tokenId].used, "Ticket already used");

        tickets[tokenId].used = true;

        emit TicketUsed(tokenId, tickets[tokenId].eventId);
    }

    /**
     * @dev Verify a ticket (for event organizers)
     * @param tokenId ID of the ticket token
     */
    function verifyTicket(uint256 tokenId) public view returns (
        address owner,
        uint256 eventId,
        bool used,
        bool locked
    ) {
        require(_exists(tokenId), "Ticket does not exist");

        Ticket memory ticket = tickets[tokenId];
        Event memory eventData = events[ticket.eventId];

        require(eventData.organizer == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");

        return (
            ownerOf(tokenId),
            ticket.eventId,
            ticket.used,
            ticket.locked
        );
    }

    /**
     * @dev Toggle the lock status of a ticket
     * @param tokenId ID of the ticket token
     */
    function toggleTicketLock(uint256 tokenId) public {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved or owner");

        tickets[tokenId].locked = !tickets[tokenId].locked;

        emit TicketLockToggled(tokenId, tickets[tokenId].locked);
    }

    /**
     * @dev Check if token exists
     * @param tokenId ID of the token
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        try this.ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @dev Check if address is owner or approved
     * @param spender Address to check
     * @param tokenId ID of the token
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner ||
                isApprovedForAll(owner, spender) ||
                getApproved(tokenId) == spender);
    }

    /**
     * @dev Grant organizer role to an address
     * @param organizer Address to grant the role to
     */
    function addOrganizer(address organizer) public onlyRole(ADMIN_ROLE) {
        grantRole(ORGANIZER_ROLE, organizer);
    }

    /**
     * @dev Revoke organizer role from an address
     * @param organizer Address to revoke the role from
     */
    function removeOrganizer(address organizer) public onlyRole(ADMIN_ROLE) {
        revokeRole(ORGANIZER_ROLE, organizer);
    }

    /**
     * @dev Get event details
     * @param eventId ID of the event
     */
    function getEvent(uint256 eventId) public view returns (Event memory) {
        return events[eventId];
    }

    /**
     * @dev Get ticket details
     * @param tokenId ID of the ticket token
     */
    function getTicket(uint256 tokenId) public view returns (Ticket memory) {
        require(_exists(tokenId), "Ticket does not exist");
        return tickets[tokenId];
    }

    /**
     * @dev Override transfer function to check if ticket is locked
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Skip check for minting (from == address(0))
        if (from != address(0)) {
            require(!tickets[tokenId].locked, "Ticket is locked and cannot be transferred");
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override supportsInterface function
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
