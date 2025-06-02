import "./favorite.css";
import Navbar from "../../Components/Navbar.tsx";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaTrash } from "react-icons/fa";

interface FavoriteProperty {
    property_id: string;
    room_id: string;
    title: string;
    room_number: string;
    price: number | null;
    main_image_url: string | null;
}

const Favorites = () => {
    const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const authToken = sessionStorage.getItem("auth_token");

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const userId = JSON.parse(sessionStorage.getItem("user") || "{}").user_id;
                if (!authToken || !userId) {
                    setLoading(false);
                    return;
                }

                const response = await fetch(`http://localhost:8000/favorites?user_id=${userId}`, {
                    headers: {
                        "Authorization": `Bearer ${authToken}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("Received favorites data:", data); // Debug log
                    setFavorites(data);
                } else {
                    console.error("Failed to fetch favorites");
                }
            } catch (error) {
                console.error("Error fetching favorites:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [authToken]);

    const removeFavorite = async (propertyId: string) => {
        try {
            const response = await fetch(`http://localhost:8000/favorites/${propertyId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${authToken}`,
                },
            });

            if (response.ok) {
                setFavorites(favorites.filter(fav => fav.property_id !== propertyId));
            }
        } catch (error) {
            console.error("Error removing favorite:", error);
        }
    };

    // Function to properly construct image URL
    const getImageUrl = (url: string | null) => {
        if (!url) return "/uploads/default.jpg";
        
        // If URL already has http:// or https://, use as-is
        if (url.startsWith('http')) return url;
        
        // If URL starts with /uploads, prepend server URL
        if (url.startsWith('/uploads')) return `http://localhost:8000${url}`;
        
        // Otherwise, assume it's a relative path
        return `http://localhost:8000/uploads/${url}`;
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="loading">Loading favorites...</div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="favorites-container">
                <h1>Favorite Properties</h1>

                {!authToken ? (
                    <div className="login-prompt">
                        <p>Please log in to view your favorite properties.</p>
                        <Link to="/login" className="login-button">Log In</Link>
                    </div>
                ) : favorites.length === 0 ? (
                    <p className="empty-message">No favorites yet.</p>
                ) : (
                    <div className="favorites-grid">
                        {favorites.map((property) => {
                            const imageUrl = getImageUrl(property.main_image_url);
                            console.log("Image URL:", imageUrl); // Debug log
                            
                            return (
                                <div key={property.property_id} className="favorite-card">
                                    <Link to={`/listingdetails/${property.property_id}`} className="favorite-link">
                                        <div className="favorite-image-container">
                                            <img
                                                src={imageUrl}
                                                alt={property.title}
                                                className="favorite-image"
                                                onError={(e) => {
                                                    console.error("Image failed to load:", imageUrl);
                                                    (e.target as HTMLImageElement).src = "/uploads/default.jpg";
                                                }}
                                            />
                                        </div>
                                        <div className="favorite-info">
                                            <h3>{property.title}</h3>
                                            <p className="room-number">Room: {property.room_number}</p>
                                            <p className="price">
                                                {property.price !== null 
                                                    ? `₱${property.price.toLocaleString()}`
                                                    : "Price not available"}
                                            </p>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            removeFavorite(property.property_id);
                                        }}
                                        className="remove-favorite"
                                        aria-label="Remove favorite"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default Favorites;