import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';

const UserProfile = ({ account, networkName, isAdmin, isOrganizer }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Generate identicon from address (fallback if no profile image)
  const generateIdenticon = (address) => {
    // Simple hash function for demo purposes
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(address));
    const color = `#${hash.substring(2, 8)}`;
    const bgColor = `#${hash.substring(8, 14)}`;
    
    return { color, bgColor };
  };

  // Load profile image from localStorage on component mount
  useEffect(() => {
    const savedImage = localStorage.getItem(`profileImage_${account}`);
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, [account]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle profile image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result;
      setProfileImage(imageData);
      localStorage.setItem(`profileImage_${account}`, imageData);
      setUploading(false);
    };

    reader.onerror = () => {
      console.error('Error reading file');
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  // Remove profile image
  const removeProfileImage = () => {
    setProfileImage(null);
    localStorage.removeItem(`profileImage_${account}`);
    setShowDropdown(false);
  };

  // Get user role
  const getUserRole = () => {
    if (isAdmin) return 'admin';
    if (isOrganizer) return 'organizer';
    return 'user';
  };

  // Format address for display
  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Get identicon style
  const identiconStyle = generateIdenticon(account);

  return (
    <div className="user-profile">
      <div 
        className="profile-image-container"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {profileImage ? (
          <img 
            src={profileImage} 
            alt="Profile" 
            className="profile-image" 
          />
        ) : (
          <div 
            className="identicon" 
            style={{ 
              backgroundColor: identiconStyle.bgColor,
              color: identiconStyle.color
            }}
          >
            {account.substring(2, 4).toUpperCase()}
          </div>
        )}
        <div className={`role-indicator ${getUserRole()}`}></div>
      </div>

      {showDropdown && (
        <div className="profile-dropdown" ref={dropdownRef}>
          <div className="dropdown-header">
            <div className="user-info">
              <span className="user-address">{formatAddress(account)}</span>
              <span className="network-name">{networkName}</span>
            </div>
            <div className={`role-badge ${getUserRole()}`}>
              <i className={`fas ${isAdmin ? 'fa-user-cog' : isOrganizer ? 'fa-user-tie' : 'fa-user'}`}></i>
              {isAdmin ? 'Admin' : isOrganizer ? 'Organizer' : 'User'}
            </div>
          </div>
          
          <div className="dropdown-actions">
            <Link to="/my-tickets" className="dropdown-item">
              <i className="fas fa-ticket-alt"></i> My Tickets
            </Link>
            <Link to="/check-role" className="dropdown-item">
              <i className="fas fa-user-shield"></i> Check Role
            </Link>
            {isAdmin && (
              <Link to="/admin" className="dropdown-item">
                <i className="fas fa-user-cog"></i> Admin Panel
              </Link>
            )}
            <div className="dropdown-divider"></div>
            <button 
              className="dropdown-item"
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
            >
              <i className="fas fa-camera"></i> 
              {uploading ? 'Uploading...' : 'Change Profile Image'}
            </button>
            {profileImage && (
              <button 
                className="dropdown-item text-danger"
                onClick={removeProfileImage}
              >
                <i className="fas fa-trash-alt"></i> Remove Image
              </button>
            )}
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default UserProfile;
