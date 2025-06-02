import React, { useEffect, useState } from "react";
import "../profilepage/profilepage.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../Components/Navbar.tsx";

interface Room {
    room_id: number;
    property_id: number;
    room_number: string;
    price: number;
    availability: boolean;
    number_of_beds: number;
    room_type: {
        room_type_id: number;
        room_type: string;
    };
    property: {
        title: string;
        city: string;
        state_province: string;
    };
    images: Array<{
        image_url: string;
    }>;
}

const MyListings = () => {
    const [myRooms, setMyRooms] = useState<Room[]>([]);
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchUserAndRooms = async () => {
            const token = sessionStorage.getItem("auth_token");
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                // Fetch user verification status
                const userRes = await fetch("http://127.0.0.1:8000/users/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setIsVerified(userData.is_verified);
                }

                // Fetch user's rooms
                const roomsRes = await fetch("http://localhost:8000/my-rooms", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (roomsRes.ok) {
                    const roomsData = await roomsRes.json();
                    setMyRooms(roomsData);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserAndRooms();
    }, [navigate]);

    // Check for verification status passed via route state
    useEffect(() => {
        if (location.state?.isVerified !== undefined) {
            setIsVerified(location.state.isVerified);
        }
    }, [location.state]);

    const handleDeleteRoom = async (roomId: number) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;

    try {
        const token = sessionStorage.getItem("auth_token");
        if (!token) {
            navigate('/login');
            return;
        }

        const response = await fetch(`http://localhost:8000/delete-room/${roomId}`, {
            method: "DELETE",
            headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Delete failed');
        }

        // Update UI by filtering out the deleted room
        setMyRooms(prev => prev.filter(r => r.room_id !== roomId));
        alert("Room deleted successfully");
        
    } catch (error) {
        console.error("Delete error:", error);
        alert(`Error: ${error.message}`);
    }
};

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="My-listing-container">
                    <div className="loading-message">Loading your listings...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="My-listing-container">
                <div className="section-header">
                    <h1>My Listings</h1>
                    {isVerified ? (
                        <Link to="/listingProcedure">
                            <button className="post-btn">+ Post New Listing</button>
                        </Link>
                    ) : (
                        <div className="verification-notice">
                            <button className="post-btn disabled" disabled>
                                + Post New Listing
                            </button>
                            <span className="tooltip">ID verification required</span>
                        </div>
                    )}
                </div>

                {myRooms.length > 0 ? (
                    <div className="my-listings">
                        {myRooms.map((room) => (
                            <div key={room.room_id} className="mylisting-card">
                                <img
                                    src={`http://localhost:8000${room.images?.[0]?.image_url || "/uploads/default.jpg"}`}
                                    alt={room.property.title}
                                    className="mylisting-image"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/uploads/default.jpg";
                                    }}
                                />
                                <div className="mylisting-info">
                                    <h3>{room.property.title} - Room {room.room_number}</h3>
                                    <p>{room.property.city}, {room.property.state_province}</p>
                                    <p>₱{room.price.toLocaleString()} / month</p>
                                    <p>Beds: {room.number_of_beds} | Type: {room.room_type.room_type}</p>
                                </div>
                                <button
                                    className="myremove-btn"
                                    onClick={() => handleDeleteRoom(room.room_id)} // Now passing room_id
                                    aria-label="Delete listing"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p className="myempty-message">You haven't posted anything yet.</p>
                        {isVerified && (
                            <Link to="/listingProcedure">
                                <button className="post-btn">Post Your First Listing</button>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default MyListings;