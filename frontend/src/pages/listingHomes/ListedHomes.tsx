    import React, { useEffect, useState } from "react";
    import "./ListingHomes.css";
    import { Link } from "react-router-dom";
    import { FaStar } from "react-icons/fa";

    interface Filters {
        searchTerm?: string;
        room_type?: string;
        minPrice?: string | number;
        maxPrice?: string | number;
        minRating?: number;
        location?: string;
        minBeds?: number;
    }

    interface Room {
        room_id: string;
        property_id: string;
        room_number: string;
        price: number;
        availability: string;
        number_of_beds: number;
        room_type: string;
        property: {
            city: string;
            state_province: string;
        };
        images?: Array<{ image_url: string }>;
        rating?: number;
    }

    const ListedHomes = ({ filters = {} }: { filters?: Filters }) => {
        const [rooms, setRooms] = useState<Room[]>([]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const fetchRooms = async () => {
                try {
                    setLoading(true);
                    
                    // Build query parameters based on filters
                    const queryParams = new URLSearchParams();
                    
                    if (filters?.searchTerm) queryParams.append('search', filters.searchTerm);
                    if (filters?.room_type && filters.room_type !== 'any') {
                        queryParams.append('room_type', filters.room_type);
                    }
                    if (filters?.minPrice) queryParams.append('min_price', filters.minPrice.toString());
                    if (filters?.maxPrice) queryParams.append('max_price', filters.maxPrice.toString());
                    if (filters?.minRating) queryParams.append('min_rating', filters.minRating.toString());
                    if (filters?.location) queryParams.append('location', filters.location);
                    if (filters?.minBeds) queryParams.append('min_beds', filters.minBeds.toString());
                    
                    const url = `http://localhost:8000/rooms?${queryParams.toString()}`;
                    const response = await fetch(url);
                    
                    if (response.ok) {
                        const data = await response.json();
                        setRooms(data);
                    } else {
                        alert("Failed to fetch rooms");
                    }
                } catch (error) {
                    console.error("Error fetching rooms:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchRooms();
        }, [filters]);

        if (loading) {
            return <div className="loading">Loading rooms...</div>;
        }

        if (rooms.length === 0) {
            return <div className="no-results">No rooms found matching your criteria.</div>;
        }

        return (
            <div className="listing-cards">
                {rooms.map((room) => (
                    <Link className="Link" to={`/roomdetails/${room.room_id}`} key={room.room_id}>
                        <div className="listing-content">
                            <div className="listed-home-images">
                                <img
                                src={`http://localhost:8000${room.images?.[0]?.image_url || "/uploads/default.jpg"}`}
                                alt={`Room ${room.room_number}`}
                                className="listing-image"
                                />

                            </div>
                            <div className="details">
                                <p className="listing-price">
                                    ₱{room.price} {room.room_type === "Bed spacer" ? "per bed" : "per month"}
                                </p>
                                <p className="listing-type">{room.room_type}</p>
                                <p className="listing-location">
                                    {room.property?.city}, {room.property?.state_province}
                                </p>
                                <p className="listing-beds">{room.number_of_beds} beds</p>
                                {room.rating && (
                                    <p className="listing-rating">
                                        <FaStar className="star-icon" /> {room.rating}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        );
    };

    export default ListedHomes;