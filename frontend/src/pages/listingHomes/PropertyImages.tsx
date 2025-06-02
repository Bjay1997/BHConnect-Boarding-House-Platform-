import "./listingHomes.css";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function PropertyImages() {
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Assuming the propertyId is passed via state from the previous page
  const propertyId = location.state?.propertyId;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      const validImages = selected.filter(image => image.size <= 20 * 1024 * 1024); // 10MB max
      if (validImages.length !== selected.length) {
        alert("Some images are too large (max 10MB).");
      }
      setImages((prev) => [...prev, ...validImages]);
    }
  };

  const handleImageRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!propertyId) {
      alert("Property ID is missing.");
      return;
    }
    if (images.length < 5) return alert("Please upload at least 5 images.");

    const formData = new FormData();
    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      setUploading(true);

      const response = await fetch("http://localhost:8000/upload-images", {
        method: "POST",
        body: formData,
        headers: {
          "Property-ID": propertyId.toString(), 
        },
      });

      if (response.ok) {
        alert("Home listed successfully");
        setImages([]); 
        navigate("/"); 
      } else {
        alert("Upload failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="property-images-container">
      <div className="upload-section">
        <h1 className="upload-title">What does your place look like?</h1>
        <p className="upload-subtitle">Upload at least 5 photos to showcase your property</p>

        <div className="upload-area">
          <div className="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <p className="upload-instruction">Drag & drop photos here</p>
          <p className="upload-or">or</p>
          <input
              type="file"
              accept="image/jpeg, image/png"
              multiple
              onChange={handleImageSelect}
              style={{display: "none"}}
              id="fileInput"
          />
          <label htmlFor="fileInput" className="upload-button">Select Photos</label>
          <p className="upload-note">JPG or PNG (Max 10MB each)</p>
        </div>

        <div className="image-upload-container">
          <div className="image-preview-grid">
            {images.map((img, index) => (
                <div key={index} className="image-preview-card">
                  <div className="image-wrapper">
                    <img
                        src={URL.createObjectURL(img)}
                        alt={`Preview ${index}`}
                        className="preview-image"
                    />
                    <button
                        className="remove-image-btn"
                        onClick={() => handleImageRemove(index)}
                        aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                </div>
            ))}
          </div>
        </div>

      </div>

      <div className="action-section">
        <button
            className="continue-button"
            onClick={handleUpload}
            disabled={uploading || images.length < 5}
        >
          {uploading ? "Uploading..." : "Continue"}
        </button>
        <p className="photo-requirement">Minimum 5 photos required</p>
      </div>
    </div>
  );
}

export default PropertyImages;
