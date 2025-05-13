import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import './App.css';

// Components
import Home from './components/Home';
import EventList from './components/EventList';
import EventDetails from './components/EventDetails';
import CreateEvent from './components/CreateEvent';
import MyTickets from './components/MyTickets';
import TicketDetails from './components/TicketDetails';
import VerifyTicket from './components/VerifyTicket';
import AdminPanel from './components/AdminPanel';
import Register from './components/Register';
import RoleChecker from './components/RoleChecker';
import UserProfile from './components/UserProfile';

// Utils
import { getProviderAndSigner, getCurrentAccount, isAdmin, isOrganizer } from './utils/contractUtils';
import { checkContractConnection, getContractAddress } from './utils/contractChecker';
import { runMigration } from './utils/migrationUtils';

function App() {
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isOrganizerUser, setIsOrganizerUser] = useState(false);
  const [networkName, setNetworkName] = useState('');

  // Connect wallet
  const connectWallet = async () => {
    try {
      const { provider, signer } = await getProviderAndSigner();
      const address = await signer.getAddress();
      setAccount(address);
      setIsConnected(true);

      // Check roles
      checkRoles();

      // Get network
      const network = await provider.getNetwork();
      setNetworkName(network.name);

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      // Listen for network changes
      window.ethereum.on('chainChanged', () => window.location.reload());
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please make sure MetaMask is installed and unlocked.');
    }
  };

  // Handle account changes
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected
      setIsConnected(false);
      setAccount('');
      setIsAdminUser(false);
      setIsOrganizerUser(false);
    } else {
      // Account changed
      setAccount(accounts[0]);
      checkRoles();
    }
  };

  // Check user roles
  const checkRoles = async () => {
    try {
      // First check if the contract is connected
      const isContractConnected = await checkContractConnection();

      if (!isContractConnected) {
        console.warn('Contract not connected. Using address:', getContractAddress());
        return;
      }

      const adminStatus = await isAdmin();
      const organizerStatus = await isOrganizer();

      setIsAdminUser(adminStatus);
      setIsOrganizerUser(organizerStatus);
    } catch (error) {
      console.error('Error checking roles:', error);
    }
  };

  // Check if wallet is connected on load and run data migration
  useEffect(() => {
    // Run data migration for backward compatibility
    runMigration();

    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            checkRoles();

            const { provider } = await getProviderAndSigner();
            const network = await provider.getNetwork();
            setNetworkName(network.name);
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };

    checkConnection();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>NFT Ticketing DApp</h1>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/events">Events</Link>
            {isConnected && <Link to="/my-tickets">My Tickets</Link>}
            {isConnected && <Link to="/create-event">Create Event</Link>}
            {isAdminUser && <Link to="/admin">Admin Panel</Link>}
            {isConnected && <Link to="/verify-ticket">Verify Ticket</Link>}
            {isConnected && !isOrganizerUser && !isAdminUser && <Link to="/register">Register</Link>}
            {isConnected && <Link to="/check-role">Check Role</Link>}
          </nav>
          <div className="wallet-info">
            {isConnected ? (
              <UserProfile
                account={account}
                networkName={networkName}
                isAdmin={isAdminUser}
                isOrganizer={isOrganizerUser}
              />
            ) : (
              <button onClick={connectWallet}>
                <i className="fas fa-wallet"></i> Connect Wallet
              </button>
            )}
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home isConnected={isConnected} connectWallet={connectWallet} />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/events/:eventId" element={<EventDetails isConnected={isConnected} />} />
            <Route path="/create-event" element={<CreateEvent isOrganizer={isOrganizerUser} isAdmin={isAdminUser} />} />
            <Route path="/my-tickets" element={<MyTickets isConnected={isConnected} account={account} />} />
            <Route path="/tickets/:tokenId" element={<TicketDetails isConnected={isConnected} account={account} />} />
            <Route path="/verify-ticket" element={<VerifyTicket isConnected={isConnected} isOrganizer={isOrganizerUser} />} />
            <Route path="/admin" element={<AdminPanel isAdmin={isAdminUser} />} />
            <Route path="/register" element={<Register isConnected={isConnected} />} />
            <Route path="/check-role" element={<RoleChecker />} />
          </Routes>
        </main>

        <footer>
          <p>&copy; {new Date().getFullYear()} NFT Ticketing DApp - Web3 Event Ticketing with NFTs</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
