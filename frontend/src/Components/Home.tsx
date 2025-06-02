import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import "../assets/background.jpg";
import "./Home.css";
import Search from "./search/Search.tsx";
import ListedHomes from '../pages/listingHomes/ListedHomes.tsx';

// Define the type for your filters
interface Filters {
  searchTerm?: string;
  propertyType?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: number;
  location?: string;
}

const Home: React.FC = () => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [filters, setFilters] = useState<Filters>({});

  const handleShowRegister = () => {
    setShowRegisterModal(true);
  };

  const handleShowLogin = () => {
    setShowLoginModal(true);
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  return (
    <>
      <Navbar 

      />

      <div className="search-div">
        <Search 
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
        />
      </div>

      <div className='home-div'>
        <ListedHomes filters={filters} />
      </div>
    </>
  );
};

export default Home;