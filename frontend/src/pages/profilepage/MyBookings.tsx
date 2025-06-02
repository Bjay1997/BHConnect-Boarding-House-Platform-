import React, { useEffect, useState } from "react";
import "./profilepage.css";

type Booking = {
    booking_id: number;
    property_image: string | null;
    property_title: string;
    check_in_date: string;
    check_out_date: string;
    total_amount: number;
    status: string;
    created_at: string;
};

const MyBookings = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const token = sessionStorage.getItem('auth_token');
                if (!token) {
                    setLoading(false);
                    return;
                }

                const response = await fetch('http://localhost:8000/my-bookings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data: Booking[] = await response.json();
                    setBookings(data);
                } else {
                    console.error("Failed to fetch bookings");
                }
            } catch (error) {
                console.error("Error fetching bookings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const getStatusClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return 'status-approved';
            case 'pending':
                return 'status-pending';
            case 'rejected':
                return 'status-rejected';
            default:
                return '';
        }
    };

    if (loading) {
        return <div>Loading your bookings...</div>;
    }

    return (
        <div className="booking-container">
            <h1>My Bookings</h1>

            {bookings.length === 0 ? (
                <p className="empty-message">No current bookings.</p>
            ) : (
                <div className="bookings-list">
                    {bookings.map((booking) => (
                        <div key={booking.booking_id} className="booking-card">
                            {booking.property_image && (
                                <img 
                                    src={`http://localhost:8000${booking.property_image}`} 
                                    alt={booking.property_title}
                                    className="booking-image"
                                />
                            )}
                            <div className="booking-details">
                                <h3>{booking.property_title}</h3>
                              
                                <p>
                                    <strong>Total:</strong> ₱{booking.total_amount.toFixed(2)}
                                </p>
                                <p>
                                    <strong>Status:</strong> {booking.status}
                                </p>
                                <p>
                                    <strong>Booked on:</strong> {new Date(booking.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyBookings;
