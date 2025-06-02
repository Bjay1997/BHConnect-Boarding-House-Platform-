import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from "../../Components/Navbar.tsx";
import { Image } from 'lucide-react';
import "./addrooms.css";

interface RoomType {
  room_type_id: number;
  room_type: string;
}

interface RoomFormData {
  room_type_id: number | '';
  room_number: string;
  price: string;
  deposit: string;
  number_of_beds: string;
  photos: File[];
}

function AddRooms() {
  const location = useLocation();
  const navigate = useNavigate();
  const propertyId = location.state?.propertyId;

  const [formData, setFormData] = useState<RoomFormData>({
    room_type_id: '',
    room_number: '',
    price: '',
    deposit: '',
    number_of_beds: '',
    photos: []
  });

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  if (!propertyId) {
    navigate('/listingprocedure');
    return null;
  }

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/room-types");
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.statusText}`);
        }
        const data = await res.json();
        setRoomTypes(data);
      } catch (err) {
        console.error("Failed to fetch room types", err);
      }
    };

    fetchRoomTypes();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'room_type_id') {
      const selectedTypeId = parseInt(value);
      const selectedRoomType = roomTypes.find(rt => rt.room_type_id === selectedTypeId);
      
      setFormData(prev => ({
        ...prev,
        [name]: selectedTypeId,
        // Auto-set beds to 1 for Single Room, clear for other types
        number_of_beds: selectedRoomType?.room_type.toLowerCase() === 'single room' ? '1' : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + formData.photos.length > 10) {
        setError('You can upload a maximum of 10 photos');
        return;
      }

      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...files]
      }));
      setError('');
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...formData.photos];
    newPhotos.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      photos: newPhotos
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    if (!formData.room_type_id || formData.room_type_id === '') {
      setError('Please select a room type');
      setIsSubmitting(false);
      return;
    }

    if (formData.photos.length < 1) {
      setError('Please upload at least one photo');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication token not found');

      const selectedRoomType = roomTypes.find(rt => rt.room_type_id === formData.room_type_id);

      const roomData = {
        property_id: Number(propertyId),
        room_type_id: Number(formData.room_type_id),
        room_number: formData.room_number ? parseInt(formData.room_number) : null,
        price: formData.price ? parseFloat(formData.price) : null,
        deposit: formData.deposit ? parseFloat(formData.deposit) : null,
        // Always set to available
        availability: 'Available',
        // Only include number_of_beds if room type requires it
        ...(selectedRoomType && {
          number_of_beds: formData.number_of_beds ? parseInt(formData.number_of_beds) : null
        })
      };

      const response = await fetch('http://127.0.0.1:8000/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roomData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      const roomResponse = await response.json();
      const roomId = roomResponse.room_id;

      const photoFormData = new FormData();
      formData.photos.forEach(photo => {
        photoFormData.append('files', photo);
      });

      const photoResponse = await fetch(`http://127.0.0.1:8000/rooms/${roomId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: photoFormData
      });

      if (!photoResponse.ok) {
        throw new Error('Room created, but failed to upload images');
      }

      setSuccess('Room and images added successfully!');
      setFormData({
        room_type_id: '',
        room_number: '',
        price: '',
        deposit: '',
        number_of_beds: '',
        photos: []
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    navigate('/');
  };

  const selectedRoomType = roomTypes.find(rt => rt.room_type_id === formData.room_type_id);
  const showNumberOfBeds = selectedRoomType && 
    (selectedRoomType.room_type.toLowerCase() === 'bed spacer' || 
     selectedRoomType.room_type.toLowerCase() === 'single room');

  return (
    <>
      <Navbar />
      <div className="add-rooms-container">
        <div className="procedure-header">
          <h1>Add Rooms to Your Property</h1>
          <p>Provide basic details about each room</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form className="form-section" onSubmit={handleSubmit}>
          <div className="form-group">
            <h2>Room Details</h2>

            <div className="inputss-groupss">
              <label>Room Type</label>
              <select
                name="room_type_id"
                value={formData.room_type_id}
                onChange={handleChange}
                required
              >
                <option value="">Select room type</option>
                {roomTypes.map(rt => (
                  <option key={rt.room_type_id} value={rt.room_type_id}>
                    {rt.room_type}
                  </option>
                ))}
              </select>
            </div>

            <br/>
            <div className="input-grid">
              <div className="inputss-groupss">
                <label>Room Number</label>
                <input
                  type="number"
                  name="room_number"
                  value={formData.room_number}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              <div className="inputss-groupss">
                <label>Price (per month)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              <div className="inputss-groupss">
                <label>Deposit Amount</label>
                <input
                  type="number"
                  name="deposit"
                  value={formData.deposit}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              {showNumberOfBeds && (
                <div className="inputss-groupss">
                  <label>Number of Beds</label>
                  <input
                    type="number"
                    name="number_of_beds"
                    value={formData.number_of_beds}
                    onChange={handleChange}
                    min="1"
                    required
                    disabled={selectedRoomType?.room_type.toLowerCase() === 'single room'}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <h2>Room Photos</h2>
            <div className="inputss-groupss">
              <label>Upload Photos (Max 10, at least 1 required)</label>
              <div className="photo-upload-container">
                <label className="file-upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={formData.photos.length >= 10}
                  />
                  <div className="file-upload-box">
                    <Image size={24} />
                    <span>Click to upload</span>
                    <p>JPEG, PNG (max 10 photos)</p>
                  </div>
                </label>

                <div className="photo-preview-container">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="photo-preview">
                      <img src={URL.createObjectURL(photo)} alt={`Preview ${index}`} />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="remove-photo-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <p className="photo-count">{formData.photos.length}/10 photos selected</p>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={isSubmitting} className="submit-btn">
              {isSubmitting ? 'Adding Room...' : 'Add Room'}
            </button>
            <button type="button" onClick={handleFinish} className="finish-btn">
              I'm Done Adding Rooms
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default AddRooms;