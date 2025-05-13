import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createEvent, isOrganizer as checkOrganizerRole } from '../utils/contractUtils';
import { uploadImageToIPFS, createEventMetadata, uploadMetadataToIPFS, ipfsToHttp } from '../utils/ipfsUtils';

const CreateEvent = ({ isOrganizer, isAdmin }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    ticketPrice: '',
    maxTickets: '',
    imageUrl: ''
  });

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formStep, setFormStep] = useState(1);
  const [animateForm, setAnimateForm] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);

  // Check if user is authorized to create events (admin or verified organizer)
  const isAuthorized = isAdmin || isOrganizer;

  // Check registration status
  useEffect(() => {
    const checkRegistrationStatus = () => {
      if (!isAuthorized) {
        const requests = JSON.parse(localStorage.getItem('registrationRequests') || '[]');
        const userRequest = requests.find(req => req.walletAddress.toLowerCase() === window.ethereum.selectedAddress.toLowerCase());

        if (userRequest) {
          setRegistrationStatus(userRequest.status);
        } else {
          setRegistrationStatus('not_registered');
        }
      }
    };

    if (window.ethereum && window.ethereum.selectedAddress) {
      checkRegistrationStatus();
    }
  }, [isAuthorized]);

  // Redirect if not authorized and not checking registration
  useEffect(() => {
    if (isAuthorized === false && registrationStatus === null) {
      // Wait for registration check
    } else if (isAuthorized === false && registrationStatus !== 'checking') {
      // User is not authorized and we've checked registration status
      // We'll show a message instead of redirecting
    }
  }, [isAuthorized, registrationStatus, navigate]);

  // Add animation class after component mounts
  useEffect(() => {
    setAnimateForm(true);
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  // Handle image file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WEBP).');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.');
      return;
    }

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setUploadedImage(file);
    setFormData({
      ...formData,
      imageUrl: '' // Clear any previous IPFS URL
    });

    // Clear error
    if (error) {
      setError(null);
    }
  };

  // AI image generation has been removed - only user uploads are allowed

  // Move to next form step
  const nextStep = (e) => {
    e.preventDefault();

    // Validate first step
    if (formStep === 1) {
      if (!formData.name || !formData.description) {
        setError('Please fill in all fields in this section.');
        return;
      }
    }

    // Validate second step (image upload)
    if (formStep === 2) {
      if (!uploadedImage && !imagePreview) {
        setError('Please upload an image for your event.');
        return;
      }
    }

    // Validate third step (date and time)
    if (formStep === 3) {
      if (!formData.date || !formData.time) {
        setError('Please fill in all fields in this section.');
        return;
      }

      // Validate date is in the future
      const eventDateTime = new Date(`${formData.date}T${formData.time}`);
      if (eventDateTime <= new Date()) {
        setError('Event date and time must be in the future.');
        return;
      }
    }

    setError(null);
    setFormStep(formStep + 1);
  };

  // Move to previous form step
  const prevStep = (e) => {
    e.preventDefault();
    setFormStep(formStep - 1);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.name || !formData.description || !formData.date || !formData.time || !formData.ticketPrice || !formData.maxTickets) {
      setError('Please fill in all fields.');
      return;
    }

    // Validate image
    if (!uploadedImage && !imagePreview) {
      setError('Please upload an image for your event.');
      return;
    }

    // Validate date is in the future
    const eventDateTime = new Date(`${formData.date}T${formData.time}`);
    if (eventDateTime <= new Date()) {
      setError('Event date and time must be in the future.');
      return;
    }

    // Validate ticket price is a positive number
    if (parseFloat(formData.ticketPrice) <= 0) {
      setError('Ticket price must be greater than 0.');
      return;
    }

    // Validate max tickets is a positive integer
    if (parseInt(formData.maxTickets) <= 0 || !Number.isInteger(parseFloat(formData.maxTickets))) {
      setError('Maximum tickets must be a positive integer.');
      return;
    }

    try {
      // Double-check organizer role before proceeding
      const hasOrganizerRole = await checkOrganizerRole();
      if (!hasOrganizerRole && !isAdmin) {
        setError('You do not have permission to create events. Please make sure you have been approved as an organizer.');
        return;
      }

      setCreating(true);
      setError(null);

      // Upload image to IPFS
      setSuccess('Uploading image to IPFS...');
      const imageUrl = await uploadImageToIPFS(uploadedImage);

      // Create event metadata
      setSuccess('Creating event metadata...');
      const metadata = await createEventMetadata(
        formData.name,
        formData.description,
        eventDateTime,
        imageUrl
      );

      // Upload metadata to IPFS
      setSuccess('Uploading metadata to IPFS...');
      const metadataUrl = await uploadMetadataToIPFS(metadata);

      // Create event on the blockchain
      setSuccess('Creating event on the blockchain...');
      const tx = await createEvent(
        formData.name,
        formData.description,
        eventDateTime,
        formData.ticketPrice,
        parseInt(formData.maxTickets)
      );

      // Get the event ID from the transaction receipt
      let eventId;

      try {
        // Try to get the event ID from the transaction receipt
        const receipt = await tx.wait();
        const eventCreatedEvent = receipt.events.find(event => event.event === 'EventCreated');

        if (eventCreatedEvent && eventCreatedEvent.args) {
          // The first argument should be the event ID
          eventId = eventCreatedEvent.args[0].toNumber();
          console.log('Extracted event ID from transaction:', eventId);
        } else {
          // Try to find the event ID in the logs
          for (const log of receipt.logs) {
            try {
              const iface = new ethers.utils.Interface([
                "event EventCreated(uint256 indexed eventId, string name, address organizer)"
              ]);
              const parsedLog = iface.parseLog(log);
              if (parsedLog.name === 'EventCreated') {
                eventId = parsedLog.args.eventId.toNumber();
                console.log('Extracted event ID from logs:', eventId);
                break;
              }
            } catch (e) {
              // Not the event we're looking for
            }
          }

          if (eventId === undefined) {
            console.log('Could not extract event ID from transaction, but event was created successfully');
          }
        }
      } catch (err) {
        console.error('Error extracting event ID:', err);
      }

      console.log('Event created successfully with metadata URL:', metadataUrl);

      // Dispatch a custom event to notify other components that a new event was created
      window.dispatchEvent(new CustomEvent('eventCreated'));

      // Show success message with more details
      setSuccess(`Event "${formData.name}" created successfully! Redirecting to events page...`);

      // Show a more detailed success message
      console.log(`
        Event created successfully:
        - Name: ${formData.name}
        - Date: ${eventDateTime}
        - Price: ${formData.ticketPrice} ETH
        - Max Tickets: ${formData.maxTickets}
        - Metadata URL: ${metadataUrl}
      `);

      // Redirect to events page after a short delay
      setTimeout(() => {
        navigate('/events');
      }, 2000);
    } catch (err) {
      console.error('Error creating event:', err);

      // Extract more specific error message if available
      let errorMessage = 'Failed to create event. Please try again later.';

      if (err.message && err.message.includes('execution reverted')) {
        if (err.message.includes('AccessControlUnauthorizedAccount')) {
          errorMessage = 'You do not have permission to create events. Please make sure you have been approved as an organizer.';
        } else if (err.message.includes('Event date must be in the future')) {
          errorMessage = 'Event date must be in the future.';
        } else if (err.message.includes('Max tickets must be greater than zero')) {
          errorMessage = 'Maximum tickets must be greater than zero.';
        } else {
          errorMessage = 'Transaction failed: ' + (err.reason || 'execution reverted');
        }
      }

      setError(errorMessage);
      setCreating(false);
      setSuccess(null);
    }
  };



  // Render form step 1 - Basic Information
  const renderStep1 = () => (
    <>
      <div className="form-group" style={{animation: animateForm ? 'fadeIn 0.5s ease-in-out 0.1s forwards' : 'none', opacity: 0}}>
        <label htmlFor="name">Event Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter event name"
          required
        />
      </div>

      <div className="form-group" style={{animation: animateForm ? 'fadeIn 0.5s ease-in-out 0.2s forwards' : 'none', opacity: 0}}>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter event description"
          rows="4"
          required
        ></textarea>
      </div>

      <button
        onClick={nextStep}
        className="create-event-button"
        style={{animation: animateForm ? 'fadeIn 0.5s ease-in-out 0.3s forwards' : 'none', opacity: 0}}
      >
        Next: Event Image
      </button>
    </>
  );

  // Render form step 2 - Event Image
  const renderStep2 = () => (
    <>
      <div className="form-group" style={{animation: 'slideIn 0.5s ease-in-out 0.1s forwards', opacity: 0}}>
        <label>Event Image</label>
        <p className="form-help-text">Upload an image for your event. This image will be used for both the event listing and tickets.</p>

        {imagePreview && (
          <div className="image-preview-container" style={{marginBottom: '1rem'}}>
            <img
              src={imagePreview}
              alt="Event preview"
              className="image-preview"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
          </div>
        )}

        <div className="image-options" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <div className="upload-option">
            <input
              type="file"
              id="eventImage"
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
              style={{display: 'none'}}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="upload-button"
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Choose Image File
            </button>
            <p className="form-help-text" style={{marginTop: '0.5rem', fontSize: '0.9rem'}}>
              Recommended image size: 800x400 pixels. Max file size: 5MB.
              <br />
              Supported formats: JPEG, PNG, GIF, WEBP
            </p>
          </div>
        </div>
      </div>

      <div className="form-buttons" style={{display: 'flex', gap: '1rem', justifyContent: 'space-between', animation: 'slideIn 0.5s ease-in-out 0.3s forwards', opacity: 0}}>
        <button
          onClick={prevStep}
          className="back-button"
          style={{background: 'var(--light-gray)', color: 'var(--text-color)'}}
        >
          Back
        </button>
        <button
          onClick={nextStep}
          className="create-event-button"
          disabled={!imagePreview}
        >
          Next: Date & Time
        </button>
      </div>
    </>
  );

  // Render form step 3 - Date and Time
  const renderStep3 = () => (
    <>
      <div className="form-row">
        <div className="form-group" style={{animation: 'slideIn 0.5s ease-in-out 0.1s forwards', opacity: 0}}>
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group" style={{animation: 'slideIn 0.5s ease-in-out 0.2s forwards', opacity: 0}}>
          <label htmlFor="time">Time</label>
          <input
            type="time"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-buttons" style={{display: 'flex', gap: '1rem', justifyContent: 'space-between', animation: 'slideIn 0.5s ease-in-out 0.3s forwards', opacity: 0}}>
        <button
          onClick={prevStep}
          className="back-button"
          style={{background: 'var(--light-gray)', color: 'var(--text-color)'}}
        >
          Back
        </button>
        <button
          onClick={nextStep}
          className="create-event-button"
        >
          Next: Ticket Details
        </button>
      </div>
    </>
  );

  // Render form step 4 - Ticket Details
  const renderStep4 = () => (
    <>
      <div className="form-row">
        <div className="form-group" style={{animation: 'slideIn 0.5s ease-in-out 0.1s forwards', opacity: 0}}>
          <label htmlFor="ticketPrice">Ticket Price (ETH)</label>
          <input
            type="number"
            id="ticketPrice"
            name="ticketPrice"
            value={formData.ticketPrice}
            onChange={handleChange}
            placeholder="0.1"
            step="0.001"
            min="0"
            required
          />
        </div>

        <div className="form-group" style={{animation: 'slideIn 0.5s ease-in-out 0.2s forwards', opacity: 0}}>
          <label htmlFor="maxTickets">Maximum Tickets</label>
          <input
            type="number"
            id="maxTickets"
            name="maxTickets"
            value={formData.maxTickets}
            onChange={handleChange}
            placeholder="100"
            min="1"
            step="1"
            required
          />
        </div>
      </div>

      <div className="form-buttons" style={{display: 'flex', gap: '1rem', justifyContent: 'space-between', animation: 'slideIn 0.5s ease-in-out 0.3s forwards', opacity: 0}}>
        <button
          onClick={prevStep}
          className="back-button"
          style={{background: 'var(--light-gray)', color: 'var(--text-color)'}}
        >
          Back
        </button>
        <button
          type="submit"
          className="create-event-button"
          disabled={creating}
        >
          {creating ? 'Creating Event...' : 'Create Event'}
        </button>
      </div>
    </>
  );

  // Render unauthorized message
  const renderUnauthorizedMessage = () => {
    if (registrationStatus === 'pending') {
      return (
        <div className="unauthorized-message pending">
          <div className="status-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="message-content">
            <h3>Registration Pending</h3>
            <p>Your registration request is currently pending approval from an admin.</p>
            <p>Once approved, you'll be able to create events on the platform.</p>
            <p>Please check back later or contact the platform administrator.</p>
            <div className="action-buttons">
              <Link to="/events" className="action-button">
                <i className="fas fa-ticket-alt"></i> Browse Events
              </Link>
              <Link to="/check-role" className="action-button">
                <i className="fas fa-user-shield"></i> Check Role Status
              </Link>
            </div>
          </div>
        </div>
      );
    } else if (registrationStatus === 'rejected') {
      return (
        <div className="unauthorized-message rejected">
          <div className="status-icon">
            <i className="fas fa-times-circle"></i>
          </div>
          <div className="message-content">
            <h3>Registration Rejected</h3>
            <p>Your registration request has been rejected by an admin.</p>
            <p>If you believe this is an error, please contact the platform administrator.</p>
            <div className="action-buttons">
              <Link to="/events" className="action-button">
                <i className="fas fa-ticket-alt"></i> Browse Events
              </Link>
              <Link to="/check-role" className="action-button">
                <i className="fas fa-user-shield"></i> Check Role Status
              </Link>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="unauthorized-message not-registered">
          <div className="status-icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <div className="message-content">
            <h3>Registration Required</h3>
            <p>You need to register and be approved as an event organizer to create events.</p>
            <p>Registration is a simple process that helps us verify organizers on our platform.</p>
            <div className="action-buttons">
              <Link to="/register" className="action-button primary">
                <i className="fas fa-user-plus"></i> Register Now
              </Link>
              <Link to="/check-role" className="action-button">
                <i className="fas fa-user-shield"></i> Check Role Status
              </Link>
            </div>
          </div>
        </div>
      );
    }
  };

  // If not authorized, show appropriate message
  if (!isAuthorized) {
    return (
      <div className="create-event-container">
        <h2>Create New Event</h2>
        {renderUnauthorizedMessage()}
      </div>
    );
  }

  // Show admin or organizer badge
  const renderRoleBadge = () => {
    if (isAdmin) {
      return <span className="role-badge admin">Admin</span>;
    } else if (isOrganizer) {
      return <span className="role-badge organizer">Verified Organizer</span>;
    }
    return null;
  };

  return (
    <div className="create-event-container">
      <h2>
        Create New Event
        {renderRoleBadge()}
      </h2>

      {/* Progress indicator */}
      <div className="progress-indicator" style={{display: 'flex', justifyContent: 'center', marginBottom: '2rem'}}>
        {[1, 2, 3, 4].map(step => (
          <div
            key={step}
            className="step-indicator"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: formStep >= step ? 'var(--primary-color)' : 'var(--light-gray)',
              color: formStep >= step ? 'white' : 'var(--dark-gray)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 0.5rem',
              transition: 'all 0.3s ease',
              fontWeight: 'bold',
              position: 'relative'
            }}
          >
            {step}
            {step < 4 && (
              <div style={{
                position: 'absolute',
                height: '2px',
                width: '30px',
                background: formStep > step ? 'var(--primary-color)' : 'var(--light-gray)',
                left: '100%',
                top: '50%',
                transition: 'all 0.3s ease'
              }}></div>
            )}
          </div>
        ))}
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit} className="create-event-form">
        {formStep === 1 && renderStep1()}
        {formStep === 2 && renderStep2()}
        {formStep === 3 && renderStep3()}
        {formStep === 4 && renderStep4()}
      </form>
    </div>
  );
};

export default CreateEvent;
