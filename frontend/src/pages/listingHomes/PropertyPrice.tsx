import React, { useState } from "react";
import "./listingHomes.css";

function PropertyPrice() {
  const [basePrice, setBasePrice] = useState<number | string>("");
  const [errorMessage, setErrorMessage] = useState("");

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBasePrice(e.target.value);
  };

  const handleSave = async () => {
    if (!basePrice) {
      setErrorMessage("Please enter a price.");
      return;
    }

    
    const token = sessionStorage.getItem("token");

    if (!token) {
      setErrorMessage("No authorization token found.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/property-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, 
        },
        body: JSON.stringify({ basePrice }),
      });

      if (response.ok) {
        alert("Property price updated successfully!");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Failed to update property price.");
      }
    } catch (err) {
      console.error("Error:", err);
      setErrorMessage("An error occurred while updating the price.");
    }
  };

  return (
    <div className="price-container">
      <div className="price-header">
        <h1>Set Your Property Price</h1>
        <p>Enter your pricing details to attract potential guests</p>
      </div>

      <div className="price-form">
        <div className="price-input-group">
          <label htmlFor="basePrice">Base Price (per night)</label>
          <div className="price-input-container">
            <span className="currency-symbol">₱</span>
            <input
              type="number"
              id="basePrice"
              placeholder="1500"
              min="0"
              className="price-input"
              value={basePrice}
              onChange={handlePriceChange}
            />
          </div>
        </div>

        <div className="price-actions">
          <button className="save-button" onClick={handleSave}>
            Save & Continue
          </button>
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
  );
}

export default PropertyPrice;
