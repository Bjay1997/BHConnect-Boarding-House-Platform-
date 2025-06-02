import React, { useState, FormEvent, ChangeEvent } from 'react';
import "./listingprocedure.css";
import { useNavigate } from 'react-router-dom';
import Navbar from "../../Components/Navbar.tsx";
import {
  Wifi, Fan, Wind, AirVent, Utensils, ParkingSquare, Dog,
  PersonStanding, BookOpen, Plus, Ban, Cigarette, Clock, Volume2,
  PartyPopper, ShowerHead, Key, CloudSun, Bed, Users, UserX, Flame, Calendar, HandCoins,
  Lock, Trash, Bath, Home, Sofa, Brush, Recycle, Printer, PhoneCall,
} from 'lucide-react';

import { LuCctv } from "react-icons/lu";
import { TbSmokingNo } from "react-icons/tb";
import { MdPets } from "react-icons/md";


interface PropertyFormData {
  title: string;
  description: string;
  address: string;
  city: string;
  state_province: string;
  postal_code: string;
  house_rules: string[];
  amenities: string[];
}

// Define common amenities with their icons
const commonAmenities = [
  { name: "WiFi", icon: <Wifi size={24} /> },
  { name: "Cctv", icon: <LuCctv size={24} /> },
  // { name: "TV", icon: <Tv size={24} /> },
  { name: "Fan", icon: <Fan size={24} /> },
  { name: "Air Conditioning", icon: <Wind size={24} /> },
  { name: "Ventilation", icon: <AirVent size={24} /> },
  { name: "Kitchen", icon: <Utensils size={24} /> },
  { name: "Parking", icon: <ParkingSquare size={24} /> },
  { name: "Pet Friendly", icon: <Dog size={24} /> },
  // { name: "Security Guard", icon: <PersonStanding size={24} /> },
  // { name: "Cafe", icon: <Coffee size={24} /> },
  { name: "Study Area", icon: <BookOpen size={24} /> },
  // { name: "Gym", icon: <Dumbbell size={24} /> },
  // { name: "Laundry", icon: <WashingMachine size={24} /> },
  // { name: "Water Supply", icon: <Waves size={24} /> },
  { name: "Clothes Drying Area / Balcony", icon: <CloudSun size={24} /> },
  { name: "Private Bathroom", icon: <Bath size={24} /> },
  { name: "On-site Caretaker or Landlord", icon: <Home size={24} /> },
  { name: "Living Room / Lounge", icon: <Sofa size={24} /> },
  { name: "Wall fan / Standing fan", icon: <Fan size={24} /> },
  { name: "Room cleaning supplies", icon: <Brush size={24} /> },
  { name: "Recycling bins", icon: <Recycle size={24} /> },
  { name: "Shared printer", icon: <Printer size={24} /> },
  { name: "Individual door locks", icon: <Lock size={24} /> },
  { name: "Smoking area", icon: <Cigarette size={24} /> },
  { name: "Emergency contact info posted", icon: <PhoneCall size={24} /> },
];

// Define common house rules with their icons
const commonHouseRules = [
  { name: "No pets allowed", icon: <MdPets size={24} /> },
  { name: "No smoking", icon: <TbSmokingNo size={24} /> },
  { name: "Quiet hours after 10pm", icon: <Clock size={24} /> },

  { name: "Keep noise level down", icon: <Volume2 size={24} /> },
  { name: "No parties", icon: <PartyPopper size={24} /> },
  { name: "No overnight visitors", icon: <PersonStanding size={24} /> },
  // { name: "Conserve water", icon: <ShowerHead size={24} /> },
  // { name: "Lock doors when leaving", icon: <Key size={24} /> },
  // { name: "No bicycles in rooms", icon: <Bike size={24} /> },
  { name: "Visitors Must Leave by a Set Time", icon: <Users size={24} /> },
  { name: "No Unauthorized Visitors", icon: <UserX size={24} /> },
  { name: "No Candles/Open Flames", icon: <Flame size={24} /> },
  { name: "Rent Must Be Paid on Time", icon: <Calendar size={24} /> },
  { name: "No Theft or Borrowing Without Permission", icon: <HandCoins size={24} /> },
  { name: "Keep Common Areas Clean", icon: <Trash size={24} /> },
  { name: "No Loud Noise/Music", icon: <Volume2 size={24} /> },
];

function ListingProcedure() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    address: '',
    city: '',
    state_province: '',
    postal_code: '',
    house_rules: [],
    amenities: []
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentRule, setCurrentRule] = useState<string>('');
  const [currentAmenity, setCurrentAmenity] = useState<string>('');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddRule = () => {
    const trimmedRule = currentRule.trim();
    if (trimmedRule && !formData.house_rules.includes(trimmedRule)) {
      setFormData(prev => ({
        ...prev,
        house_rules: [...prev.house_rules, trimmedRule]
      }));
      setCurrentRule('');
    }
  };

  const handleRemoveRule = (index: number) => {
    const newRules = [...formData.house_rules];
    newRules.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      house_rules: newRules
    }));
  };

  const handleAddAmenity = (amenityName: string = currentAmenity) => {
    const trimmedAmenity = amenityName.trim();
    if (trimmedAmenity && !formData.amenities.includes(trimmedAmenity)) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, trimmedAmenity]
      }));
      setCurrentAmenity('');
    }
  };

  const handleRemoveAmenity = (index: number) => {
    const newAmenities = [...formData.amenities];
    newAmenities.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      amenities: newAmenities
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'rule' | 'amenity') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (action === 'rule') {
        handleAddRule();
      } else if (action === 'amenity') {
        handleAddAmenity();
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication token not found');

      const response = await fetch('http://127.0.0.1:8000/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          state_province: formData.state_province,
          postal_code: formData.postal_code,
          house_rules: formData.house_rules,
          amenities: formData.amenities
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create property');
      }

      const data = await response.json();
      navigate('/add-rooms', { state: { propertyId: data.property_id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar/>
      <div className="listing-procedure-container">
        <div className="procedure-header">
          <h1>List Your Property</h1>
          <p>Complete these steps to get your property listed</p>
        </div>

        {error === "Your account is not verified. Please verify your account to list properties." ? (
          <div className="error-box">
            <h3 className="error-title">You're not verified yet.</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={() => navigate('/profile')} className="verify-btn">Verify Now</button>
              <button onClick={() => navigate('/')} className="go-back-btn">Go Back</button>
            </div>
          </div>
        ) : (
          error && <div className="error-message">{error}</div>
        )}

        {!error && (
          <form className="form-section" onSubmit={handleSubmit}>
            <div className="form-group">
              <h2>What's the name of your place?</h2>
              <div className='input-group'>
                <label>Property Name</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Coastal View Apartment"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <h2>Describe your property</h2>
              <div className='input-group'>
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Briefly describe your property..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="minimal-textarea"
                />
              </div>
            </div>

            <div className="form-group">
              <h2>House Rules</h2>
              <div className='input-group'>
                <div className="amenities-icon-grid">
                  {commonHouseRules.map((rule, index) => (
                    <div
                      key={index}
                      className={`amenity-icon-item ${formData.house_rules.includes(rule.name) ? 'selected' : ''}`}
                      onClick={() => {
                        if (formData.house_rules.includes(rule.name)) {
                          handleRemoveRule(formData.house_rules.indexOf(rule.name));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            house_rules: [...prev.house_rules, rule.name]
                          }));
                        }
                      }}
                    >
                      <div className="amenity-icon">
                        {rule.icon}
                      </div>
                      <div className="amenity-name">{rule.name}</div>
                    </div>
                  ))}
                </div>

                <label>Custom House Rules</label>
                <div className="custom-amenity-input">
                  <input
                    type="text"
                    placeholder="Add a house rule (e.g., No pets, No smoking)"
                    value={currentRule}
                    onChange={(e) => setCurrentRule(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'rule')}
                    className="rule-input"
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="add-rule-btn"
                    disabled={!currentRule.trim()}
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>

                {formData.house_rules.length > 0 && (
                  <div>
                    <label>Your Selected House Rules</label>
                    <div className="rules-list">
                      {formData.house_rules.map((rule, index) => (
                        <div key={index} className="rule-item">
                          <span>{rule}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(index)}
                            className="remove-rule-btn"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <h2>Amenities</h2>
              <div className='input-group'>
                <div className="amenities-icon-grid">
                  {commonAmenities.map((amenity, index) => (
                    <div
                      key={index}
                      className={`amenity-icon-item ${formData.amenities.includes(amenity.name) ? 'selected' : ''}`}
                      onClick={() => {
                        if (formData.amenities.includes(amenity.name)) {
                          handleRemoveAmenity(formData.amenities.indexOf(amenity.name));
                        } else {
                          handleAddAmenity(amenity.name);
                        }
                      }}
                    >
                      <div className="amenity-icon">
                        {amenity.icon}
                      </div>
                      <div className="amenity-name">{amenity.name}</div>
                    </div>
                  ))}
                </div>

                <label>Custom Amenities</label>
                <div className="custom-amenity-input">
                  <input
                    type="text"
                    placeholder="Add any other amenity not listed above"
                    value={currentAmenity}
                    onChange={(e) => setCurrentAmenity(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'amenity')}
                    className="rule-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddAmenity()}
                    className="add-rule-btn"
                    disabled={!currentAmenity.trim()}
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>

                {formData.amenities.length > 0 && (
                  <div>
                    <label>Your Selected Amenities</label>
                    <div className="rules-list">
                      {formData.amenities.map((amenity, index) => (
                        <div key={index} className="rule-item">
                          <span>{amenity}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAmenity(index)}
                            className="remove-rule-btn"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <h2>Property Location</h2>
              <div className='input-group'>
                <label>Full Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Street address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />

                <div className="location-grid">
                  <div className="location-input">
                    <label>Municipality</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="e.g. Tagoloan"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="location-input">
                    <label>State/Province</label>
                    <input
                      type="text"
                      name="state_province"
                      placeholder="e.g. Misamis Oriental"
                      value={formData.state_province}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="location-input">
                    <label>Postal/Zip Code</label>
                    <input
                      type="text"
                      name="postal_code"
                      placeholder="e.g. 9001"
                      value={formData.postal_code}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              className="continue-btn"
              type="submit"
              disabled={isSubmitting || formData.house_rules.length === 0 || formData.amenities.length === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Continue to Add Rooms'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

export default ListingProcedure;