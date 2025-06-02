import "./Search.css";
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { MdOutlineMeetingRoom } from "react-icons/md";
import { FaBed, FaStar } from "react-icons/fa";
import { RiMenuSearchLine } from "react-icons/ri";
import { CgBrowse } from "react-icons/cg";

interface SearchProps {
  onFilterChange: (filters: {
    searchTerm?: string;
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    room_type?: string;  // Changed from propertyType to room_type
    minRating?: number;
  }) => void;
}

function Search({ onFilterChange }: SearchProps) {
    const [activeTab, setActiveTab] = useState('all');
    const [showFilter, setShowFilter] = useState(false);
    const [filters, setFilters] = useState({
        searchTerm: '',
        location: '',
        minPrice: '',
        maxPrice: '',
        room_type: 'any',  // Changed from propertyType to room_type
        minRating: 3.3
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchSubmit = () => {
        onFilterChange({ 
            ...filters,
            // Use room_type instead of propertyType
            room_type: activeTab === 'room' ? 'Single Room' : 
                      activeTab === 'bed' ? 'Bed Spacer' : 'any'
        });
    };

    const handleFilterSubmit = () => {
        onFilterChange({
            ...filters,
            // Ensure room_type stays consistent with active tab
            room_type: activeTab === 'room' ? 'Single Room' : 
                      activeTab === 'bed' ? 'Bed Spacer' : filters.room_type
        });
        setShowFilter(false);
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const type = tab === 'room' ? 'Single Room' : 
                    tab === 'bed' ? 'Bed Spacer' : 'any';
        
        const updatedFilters = { 
            ...filters, 
            room_type: type,  // Changed from propertyType to room_type
            // Reset other filters when changing tabs
            searchTerm: '',
            location: '',
            minPrice: '',
            maxPrice: ''
        };
        
        setFilters(updatedFilters);
        onFilterChange(updatedFilters);
    };

    return (
        <div className="search-container">
            <div className="tabs">
                <div className="search-tabs">
                    <button
                        className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => handleTabChange('all')}
                    >
                        <CgBrowse className="tab-icon" /> Browse
                    </button>
                    <button 
                        className={`tab ${activeTab === 'room' ? 'active' : ''}`} 
                        onClick={() => handleTabChange('room')}
                    >
                        <MdOutlineMeetingRoom className="tab-icon" /> Single Room
                    </button>
                    <button 
                        className={`tab ${activeTab === 'bed' ? 'active' : ''}`} 
                        onClick={() => handleTabChange('bed')}
                    >
                        <FaBed className="tab-icon" /> Bed Spacer
                    </button>
                </div>
            </div>

            {showFilter && (
                <div className="filter-panel">
                    <div className="filter-header">Filters</div>
                    <div className="filter-section">
                        <label>Location</label>
                        <input 
                            type="text" 
                            name="location"
                            placeholder="Enter city or area" 
                            value={filters.location}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="filter-section">
                        <label>Price Range</label>
                        <div className="price-range-inputs">
                            <div className="price-input-wrapper">
                                <input
                                    type="number"
                                    name="minPrice"
                                    placeholder="Min"
                                    min="0"
                                    className="price-input"
                                    value={filters.minPrice}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <span className="price-range-separator">-</span>
                            <div className="price-input-wrapper">
                                <input
                                    type="number"
                                    name="maxPrice"
                                    placeholder="Max"
                                    min="0"
                                    className="price-input"
                                    value={filters.maxPrice}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="filter-section">
                        <label>Room Type</label>
                        <select 
                            className="room-type"
                            name="room_type"  // Changed from propertyType to room_type
                            value={filters.room_type}
                            onChange={handleInputChange}
                            disabled={activeTab !== 'all'} // Disable when specific tab is selected
                        >
                            <option value="any">Any</option>
                            <option value="Single Room">Single Room</option>
                            <option value="Bed Spacer">Bed Spacer</option>
                        </select>
                    </div>
                    <div className="filter-section">
                        <label>Ratings</label>
                        <div className="rating-control">
                            <div className="rating-display">
                                <FaStar className="star-icon" />
                                <span className="rating-value">{filters.minRating}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                step="0.1"
                                name="minRating"
                                className="rating-slider"
                                value={filters.minRating}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                    <div className="filter-actions">
                        <button onClick={() => setShowFilter(false)} className="cancel-btn">Cancel</button>
                        <button onClick={handleFilterSubmit} className="apply-btn">Apply</button>
                    </div>
                </div>
            )}

            <div className="search-bar">
                <div className="search-input-container">
                    <FontAwesomeIcon className="search-icon" icon={faMagnifyingGlass}/>
                    <input
                        type="search"
                        name="searchTerm"
                        className="search-input"
                        placeholder="Looking for a place to stay? Start your search here..."
                        value={filters.searchTerm}
                        onChange={handleInputChange}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    />
                </div>
                <button
                    className="filter-btn"
                    onClick={() => {
                        setShowFilter(prev => !prev);
                        setActiveTab('all'); // Reset to all when opening filters
                    }}
                >
                    <RiMenuSearchLine className="tab-icon" />
                </button>
                <button className="search-btn" onClick={handleSearchSubmit}>Search</button>
            </div>
        </div>
    );
}

export default Search;