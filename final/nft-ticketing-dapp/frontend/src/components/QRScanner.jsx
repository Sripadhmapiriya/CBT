import React, { useEffect, useRef, useState } from 'react';

/**
 * QR Scanner component that uses the device camera to scan QR codes
 * 
 * @param {Object} props Component props
 * @param {Function} props.onScan Callback function when a QR code is successfully scanned
 * @param {Function} props.onError Callback function when an error occurs
 * @param {boolean} props.active Whether the scanner is active
 */
const QRScanner = ({ onScan, onError, active }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scanIntervalRef = useRef(null);

  // Start the camera when the component mounts and active is true
  useEffect(() => {
    if (active) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [active]);

  // Start the camera
  const startCamera = async () => {
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onError('Your browser does not support camera access. Please use manual entry.');
        return;
      }

      // Get camera stream with rear camera if available
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      // Set the stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setScanning(true);

        // Start scanning for QR codes
        startScanning();
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      onError('Failed to access camera. Please check permissions and try again.');
    }
  };

  // Stop the camera
  const stopCamera = () => {
    // Stop scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Stop all tracks in the stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  };

  // Start scanning for QR codes
  const startScanning = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    
    // Set up scanning interval
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        // Set canvas dimensions to match video
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Get image data from canvas
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // In a real implementation, we would use a QR code detection library here
        // For this demo, we'll simulate finding a QR code after 3 seconds
        
        // Simulate QR code detection (in a real app, this would be replaced with actual detection)
        if (scanning) {
          setTimeout(() => {
            // Create a sample QR code data
            const sampleQRData = JSON.stringify({
              tokenId: "123",
              eventId: 1,
              eventName: "Sample Event",
              owner: "0x1234567890abcdef1234567890abcdef12345678",
              timestamp: Date.now()
            });
            
            // Call the onScan callback with the sample data
            onScan(sampleQRData);
            
            // Stop scanning after successful detection
            stopCamera();
          }, 3000);
          
          // Set scanning to false to prevent multiple detections
          setScanning(false);
        }
      }
    }, 500); // Check every 500ms
  };

  return (
    <div className="qr-scanner">
      {/* Video element to display camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="scanner-video"
      />
      
      {/* Canvas element for processing video frames (hidden) */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      {/* Scanner overlay with guide */}
      <div className="scanner-overlay">
        <div className="scanner-guide">
          <div className="scanner-guide-bottom"></div>
        </div>
        <div className="scanner-text">Position the QR code within the frame</div>
      </div>
    </div>
  );
};

export default QRScanner;
