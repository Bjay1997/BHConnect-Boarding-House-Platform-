import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaHeart, FaTimes, FaStar, FaMapMarkerAlt, FaChevronDown } from "react-icons/fa";
import "./listingdetails.css";
import Navbar from '../../Components/Navbar';
import Login from '../../Components/auth/Login'

interface Room {
    room_id: string;
    property_id: string;
    room_number: string;
    price: number;
    availability: string;
    number_of_beds: number;
    deposit:number;
    room_type: string;
    images: Array<{ image_url: string }>;
    property: {
        property_id: string;
        title: string;
        description: string;
        city: string;
        state_province: string;
        owner_id: string;
        house_rules: string[];
        amenities: string[]
        owner: {
            first_name: string;
            last_name: string;
            email: string;
            phone_number?: string;
        };
    };
}

interface Review {
    review_id: string;
    room_id: string;
    user_id: string;
    user_name: string;
    rating: number;
    review: string;
    created_at: string;
}

interface UserData {
    user_id: string;
    name: string;
    email: string;
}

interface BookingStatus {
    has_approved_booking: boolean;
    has_paid: boolean;
}

const ListingDetails = () => {
    const [showGuestSelector, setShowGuestSelector] = useState(false);
    const [guestCount, setGuestCount] = useState(1);
    const { id } = useParams<{ id: string }>();
    const [room, setRoom] = useState<Room | null>(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [bookingStatus, setBookingStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showAllPhotos, setShowAllPhotos] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [showFavoriteLoginPrompt, setShowFavoriteLoginPrompt] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [bookingCheck, setBookingCheck] = useState<BookingStatus>({
        has_approved_booking: false,
        has_paid: false
    });
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [duration, setDuration] = useState<number>(0);

    // Reviews state
    const [reviews, setReviews] = useState<Review[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [ratingCounts, setRatingCounts] = useState({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
    });
    const [reviewContent, setReviewContent] = useState("");
    const [userRating, setUserRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mapCoordinates, setMapCoordinates] = useState({
        lat: 14.5995,
        lng: 120.9842
    });

    const calculateDuration = (start: string, end: string) => {
        if (!start || !end) return 0;

        const startDateObj = new Date(start);
        const endDateObj = new Date(end);

        // Calculate difference in months
        const months = (endDateObj.getFullYear() - startDateObj.getFullYear()) * 12
        return months + endDateObj.getMonth() - startDateObj.getMonth();
    };

    useEffect(() => {
        if (room?.room_type === "Bed spacer") {
            if (guestCount > room.number_of_beds) {
                setGuestCount(room.number_of_beds);
            }
        } else {
            // For non-bed-spacer rooms, always set to 1
            setGuestCount(1);
        }
    }, [room]);

    useEffect(() => {
        if (startDate && endDate) {
            const calculatedDuration = calculateDuration(startDate, endDate);
            setDuration(calculatedDuration);
        } else {
            setDuration(0);
        }
    }, [startDate, endDate]);

    // Check authentication and booking status
    useEffect(() => {
        const token = sessionStorage.getItem("auth_token");
        const userDataString = sessionStorage.getItem("user");

        if (token && userDataString) {
            try {
                const parsedUserData = JSON.parse(userDataString);
                setUserData(parsedUserData);
            } catch (error) {
                console.error("Error parsing user data:", error);
            }
        }
    }, []);

    useEffect(() => {
        if (userData && room) {
            checkBookingStatus();
        }
    }, [userData, id, room]);

    const checkBookingStatus = async () => {
        const token = sessionStorage.getItem("auth_token");
        if (!token || !room) return;

        try {
            const response = await fetch(`http://localhost:8000/bookings/check?room_id=${room.room_id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setBookingCheck({
                    has_approved_booking: data.has_approved_booking,
                    has_paid: data.has_paid
                });
            }
        } catch (error) {
            console.error("Error checking booking status:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const roomRes = await fetch(`http://localhost:8000/rooms/${id}`);
                if (!roomRes.ok) throw new Error("Failed to fetch room");
                const roomData = await roomRes.json();
                setRoom(roomData);

                // Fetch reviews using property_id from room data
                try {
                    const reviewsRes = await fetch(`http://localhost:8000/rooms/${id}/reviews`);

                    if (reviewsRes.ok) {
                        const reviewsData = await reviewsRes.json();
                        setReviews(reviewsData);

                        if (reviewsData.length > 0) {
                            const total = reviewsData.reduce((sum: number, review: Review) => sum + review.rating, 0);
                            setAverageRating(total / reviewsData.length);

                            const counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
                            reviewsData.forEach((review: Review) => {
                                counts[review.rating] = (counts[review.rating] || 0) + 1;
                            });
                            setRatingCounts(counts);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching reviews:", error);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                alert("Failed to load room details");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        if (room && room.property.city && room.property.state_province) {
            const getCoordinates = async () => {
                try {
                    const cityCoordinates = {
                        "Manila": { lat: 14.5995, lng: 120.9842 },
                        "Quezon City": { lat: 14.6760, lng: 121.0437 },
                        "Cebu City": { lat: 10.3157, lng: 123.8854 },
                        "Davao City": { lat: 7.1907, lng: 125.4553 },
                    };

                    const coords = cityCoordinates[room.property.city] || { lat: 14.5995, lng: 120.9842 };
                    setMapCoordinates(coords);
                } catch (error) {
                    console.error("Error getting coordinates:", error);
                }
            };

            getCoordinates();
        }
    }, [room]);

    const generateMapUrl = () => {
        return `https://maps.google.com/maps?q=${mapCoordinates.lat},${mapCoordinates.lng}&z=15&output=embed`;
    };

    const toggleFavorite = async () => {
        const token = sessionStorage.getItem("auth_token");
        if (!token) {
            setShowFavoriteLoginPrompt(true);
            return;
        }

        try {
            const numericId = Number(id);
            if (isNaN(numericId)) {
                throw new Error("Invalid room ID");
            }

            if (isFavorite) {
                const response = await fetch(`http://localhost:8000/favorites/${numericId}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || "Failed to remove favorite");
                }
                setIsFavorite(false);
            } else {
                const response = await fetch(`http://localhost:8000/favorites`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        room_id: numericId
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || "Failed to add favorite");
                }
                setIsFavorite(true);
            }
        } catch (error) {
            console.error("Favorite error:", error);
            alert(error instanceof Error ? error.message : "Failed to update favorite");
        }
    };

    useEffect(() => {
        const checkFavoriteStatus = async () => {
            const token = sessionStorage.getItem("auth_token");
            if (!token) return;

            try {
                const response = await fetch(`http://localhost:8000/favorites/${id}/check`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setIsFavorite(data.is_favorite);
                }
            } catch (error) {
                console.error("Error checking favorite status:", error);
            }
        };

        checkFavoriteStatus();
    }, [id]);

    const handleBookNow = () => {
        const token = sessionStorage.getItem("auth_token");
        if (!token) {
            setShowLoginPrompt(true);
            return;
        }
        setShowBookingForm(true);
    };

    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!room) return;

        // For bed spacer rooms, validate guest count
        if (room.room_type === "Bed spacer" && guestCount > room.number_of_beds) {
            alert(`Cannot book more than ${room.number_of_beds} bed${room.number_of_beds !== 1 ? 's' : ''}`);
            return;
        }

        // Calculate dates - if not provided, use current date + 1 month
        let bookingStartDate = startDate;
        let bookingEndDate = endDate;
        let calculatedDuration = 1; // Default to 1 month

        if (startDate && endDate) {
            // Validate minimum 1 month duration if dates are provided
            const start = new Date(startDate);
            const end = new Date(endDate);
            calculatedDuration = (end.getFullYear() - start.getFullYear()) * 12 +
                (end.getMonth() - start.getMonth());

            // Check if duration is at least 1 month
            if (calculatedDuration < 1) {
                alert("Please choose a minimum rental duration of 1 month");
                return;
            }
        } else {
            // Set default dates if not provided
            const today = new Date();
            bookingStartDate = today.toISOString().split('T')[0];

            const end = new Date(today);
            end.setMonth(end.getMonth() + 1);
            bookingEndDate = end.toISOString().split('T')[0];
        }

        try {
            const token = sessionStorage.getItem("auth_token");
            if (!token) {
                setShowLoginPrompt(true);
                return;
            }

            const response = await fetch("http://localhost:8000/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    room_id: room.room_id,
                    guest_count: guestCount,
                    start_date: bookingStartDate,
                    end_date: bookingEndDate,
                    total_amount: room.price * calculatedDuration
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setBookingStatus("pending");
                alert("Booking request sent! The owner will review your request.");
                setShowBookingForm(false);
            } else {
                alert(data.detail || "Booking failed. Please try again.");
            }
        } catch (error) {
            console.error("Booking error:", error);
            alert("An error occurred during booking.");
        }
    };

    const handleShowReviewForm = () => {
        const token = sessionStorage.getItem("auth_token");
        if (!token) {
            setShowLoginPrompt(true);
            return;
        }

        if (!bookingCheck.has_approved_booking) {
            alert("Your booking needs to be approved by the owner before you can leave a review.");
            return;
        }

        if (!bookingCheck.has_paid) {
            alert("You need to complete payment for your booking before you can leave a review.");
            return;
        }

        setShowReviewForm(true);
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userData || !room) {
            setShowLoginPrompt(true);
            return;
        }

        if (userRating === 0) {
            alert("Please select a rating");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`http://localhost:8000/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionStorage.getItem("auth_token")}`
                },
                body: JSON.stringify({
                    room_id: room.room_id,
                    rating: userRating,
                    review: reviewContent
                })
            });

            const data = await response.json();

            if (response.ok) {
                setReviews([...reviews, data.review]);
                setReviewContent("");
                setUserRating(0);
                setShowReviewForm(false);

                // Update rating stats
                const newTotal = reviews.reduce((sum, review) => sum + review.rating, 0) + userRating;
                const newCount = reviews.length + 1;
                setAverageRating(newTotal / newCount);

                const updatedCounts = { ...ratingCounts };
                updatedCounts[userRating] = (updatedCounts[userRating] || 0) + 1;
                setRatingCounts(updatedCounts);
            } else {
                alert(data.detail || "Failed to submit review");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRatingClick = (rating: number) => {
        setUserRating(rating);
    };

    const handleLoginSuccess = (token: string, user: UserData) => {
        sessionStorage.setItem("auth_token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
        setUserData(user);
        setShowLoginModal(false);
    };

    if (loading) return <div className="loading">Loading room details...</div>;
    if (!room) return <div className="error">Failed to load room details</div>;

    return (
        <>
            <Navbar/>
            <div className="listing-details">
                <div className="favorite-div">
                    <button
                        onClick={toggleFavorite}
                        className={`favorite-button ${isFavorite ? 'active' : ''}`}
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <FaHeart className="favorite-icon" />
                    </button>
                </div>

                <div className="photo-gallery">
                    <div className="photo-item large">
                        <img
                            src={`http://localhost:8000${room.images[0]?.image_url}`}
                            alt="Room"
                            className="photo-img"
                        />
                    </div>
                    <div className="right-grid">
                        {room.images.slice(1, 5).map((img, index) => (
                            <div className="photo-item small" key={index}>
                                <img
                                    src={`http://localhost:8000${img.image_url}`}
                                    alt={`Room image ${index + 2}`}
                                    className="photo-img"
                                />
                                {index === 3 && room.images.length > 5 && (
                                    <button
                                        className="show-more-btn"
                                        onClick={() => setShowAllPhotos(true)}
                                    >
                                        Show all photos
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {showAllPhotos && (
                    <div className="all-photos-modal" onClick={() => setShowAllPhotos(false)}>
                        <div className="all-photos-content" onClick={(e) => e.stopPropagation()}>
                            <div className="all-photos-header">
                                <h2>All Photos ({room.images.length})</h2>
                                <button
                                    className="close-photos-btn"
                                    onClick={() => setShowAllPhotos(false)}
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="all-photos-grid">
                                {room.images.map((img, index) => (
                                    <div className="all-photo-item" key={index}>
                                        <img
                                            src={`http://localhost:8000/${img.image_url}`}
                                            alt={`Room image ${index + 1}`}
                                            className="all-photo-img"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {showLoginPrompt && (
                    <div className="login-prompt-modal" onClick={() => setShowLoginPrompt(false)}>
                        <div className="login-prompt-content" onClick={(e) => e.stopPropagation()}>
                            <div className="login-prompt-header">
                                <h2>Login Required</h2>
                                <button
                                    className="close-prompt-btn"
                                    onClick={() => setShowLoginPrompt(false)}
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="login-prompt-body">
                                <p>You need to log in to book this room.</p>
                                <div className="login-prompt-actions">
                                    <button
                                        className="login-prompt-button"
                                        onClick={() => {
                                            setShowLoginPrompt(false);
                                            setShowLoginModal(true);
                                        }}
                                    >
                                        Go to Login
                                    </button>
                                    <button
                                        className="login-prompt-button secondary"
                                        onClick={() => setShowLoginPrompt(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showLoginModal && (
                    <div className="login-modal-overlay">
                        <div className="login-modal-content">
                            <button
                                className="close-login-modal"
                                onClick={() => setShowLoginModal(false)}
                            >
                                <FaTimes />
                            </button>
                            <Login
                                onClose={() => setShowLoginModal(false)}
                                onLoginSuccess={handleLoginSuccess}
                            />
                        </div>
                    </div>
                )}

                {showFavoriteLoginPrompt && (
                    <div className="login-prompt-modal" onClick={() => setShowFavoriteLoginPrompt(false)}>
                        <div className="login-prompt-content" onClick={(e) => e.stopPropagation()}>
                            <div className="login-prompt-header">
                                <h2>Login Required</h2>
                                <button
                                    className="close-prompt-btn"
                                    onClick={() => setShowFavoriteLoginPrompt(false)}
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="login-prompt-body">
                                <p>You need to log in to add this room to your favorites.</p>
                                <div className="login-prompt-actions">
                                    <button
                                        className="login-prompt-button"
                                        onClick={() => {
                                            window.location.href = '/login'
                                        }}
                                    >
                                        Go to Login
                                    </button>
                                    <button
                                        className="login-prompt-button secondary"
                                        onClick={() => setShowFavoriteLoginPrompt(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="section">
                    <div className="div1">
                        <div className="property-info">
                            <div className="info-Div">
                                <h1 className="property-title">{room.property.title}</h1>
                                <p className="property-type">
                                    {room.room_type?.room_type} • Room {room.room_number} •
                                    {room.number_of_beds} bed{room.number_of_beds !== 1 ? 's' : ''} •
                                </p>

                                <p className="property-location">
                                    Location: {room.property.city}, {room.property.state_province}
                                </p>
                                <p className="property-location">
                                    Posted By: {room.property.owner.first_name} {room.property.owner.last_name}
                                </p>
                                <p className="property-location">
                                    Contact: {room.property.owner.email}
                                    {room.property.owner.phone_number && ` • ${room.property.owner.phone_number}`}
                                </p>
                            </div>
                        </div>


                        {showBookingForm && (
                            <div className="booking-modal">
                                <div className="booking-form">
                                    <h2>Book This Room</h2>
                                    <form className="form-div" onSubmit={handleBookingSubmit}>
                                        {/*<div className="date-input-container">*/}
                                        {/*    <div className="date-input">*/}
                                        {/*        <label>Start Date</label>*/}
                                        {/*        <input*/}
                                        {/*            type="date"*/}
                                        {/*            required*/}
                                        {/*            className="date-input-field"*/}
                                        {/*            min={new Date().toISOString().split('T')[0]}*/}
                                        {/*            value={startDate}*/}
                                        {/*            onChange={(e) => setStartDate(e.target.value)}*/}
                                        {/*        />*/}
                                        {/*    </div>*/}
                                        {/*    <div className="date-input">*/}
                                        {/*        <label>End Date</label>*/}
                                        {/*        <input*/}
                                        {/*            type="date"*/}
                                        {/*            required*/}
                                        {/*            className="date-input-field"*/}
                                        {/*            min={startDate || new Date().toISOString().split('T')[0]}*/}
                                        {/*            value={endDate}*/}
                                        {/*            onChange={(e) => setEndDate(e.target.value)}*/}
                                        {/*        />*/}
                                        {/*    </div>*/}
                                        {/*</div>*/}
                                        <div className="form-actions">
                                            <button type="submit">Request Booking</button>
                                            <button type="button" onClick={() => setShowBookingForm(false)}>
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                        <div className="description-section">
                            <h3>Description</h3>
                            <p className="property-description">{room.property.description}</p>

                            <h3>House Rules</h3>
                            <ul className="amenities-list">
                                {room.property.house_rules && room.property.house_rules.length > 0 ? (
                                    room.property.house_rules.map((rule, index) => {
                                        // Handle case where rule might be an object
                                        const ruleText = typeof rule === 'string' ? rule : rule.rule || JSON.stringify(rule);
                                        return (
                                            <p key={index} className="amenity-item">
                                                {ruleText}
                                            </p>
                                        );
                                    })
                                ) : (
                                    <p>No house rules specified.</p>
                                )}
                            </ul>
                            <h3>Amenities</h3>
                            <ul className="amenities-list">
                                {room.property.amenities && room.property.amenities.length > 0 ? (
                                    room.property.amenities.map((amenity, index) => {
                                        // Handle case where amenity might be an object
                                        const amenityText = typeof amenity === 'string' ? amenity : amenity.name || JSON.stringify(amenity);
                                        return (
                                            <li key={index} className="amenity-item">
                                                {amenityText}
                                            </li>
                                        );
                                    })
                                ) : (
                                    <p>No amenities specified.</p>
                                )}
                            </ul>

                        </div>

                        <div className="reviews-section">
                            <h3>Reviews</h3>

                            <div className="reviews-summary">
                                <div className="rating-average">
                                    <div className="average-score">{averageRating.toFixed(1)} / 5</div>
                                    <div className="rating-stars">
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar
                                                key={i}
                                                className={i < Math.round(averageRating) ? "star filled" : "star empty"}
                                            />
                                        ))}
                                    </div>
                                    <div className="review-count">{reviews.length} Review{reviews.length !== 1 ? 's' : ''}</div>
                                </div>

                                <div className="rating-distribution">
                                    {[5, 4, 3, 2, 1].map((rating) => (
                                        <div className="rating-bar" key={rating}>
                                            <div className="rating-label">{rating} ★</div>
                                            <div className="rating-progress">
                                                <div
                                                    className="rating-progress-bar"
                                                    style={{
                                                        width: reviews.length > 0
                                                            ? `${(ratingCounts[rating] / reviews.length) * 100}%`
                                                            : '0%'
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="rating-count">({ratingCounts[rating] || 0})</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="write-review">
                                    <button
                                        className="write-review-button"
                                        onClick={handleShowReviewForm}
                                    >
                                        {bookingCheck.has_approved_booking && bookingCheck.has_paid ? "Write Review" : "Book to Review"}
                                    </button>
                                </div>
                            </div>

                            {showReviewForm && (
                                <div className="review-form">
                                    {bookingCheck.has_approved_booking && bookingCheck.has_paid ? (
                                        <>
                                            <h4>Write Your Review</h4>
                                            <div className="star-rating">
                                                {[...Array(5)].map((_, index) => {
                                                    const ratingValue = index + 1;
                                                    return (
                                                        <label key={index}>
                                                            <input
                                                                type="radio"
                                                                name="rating"
                                                                value={ratingValue}
                                                                onClick={() => handleRatingClick(ratingValue)}
                                                            />
                                                            <FaStar
                                                                className="star"
                                                                color={ratingValue <= (hover || userRating) ? "#ffc107" : "#e4e5e9"}
                                                                size={25}
                                                                onMouseEnter={() => setHover(ratingValue)}
                                                                onMouseLeave={() => setHover(0)}
                                                            />
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            <textarea
                                                value={reviewContent}
                                                onChange={(e) => setReviewContent(e.target.value)}
                                                placeholder="Share your experience..."
                                                rows={4}
                                            ></textarea>
                                            <div className="review-form-actions">
                                                <button
                                                    onClick={handleSubmitReview}
                                                    disabled={isSubmitting}
                                                    className="submit-review-button"
                                                >
                                                    {isSubmitting ? "Submitting..." : "Submit Review"}
                                                </button>
                                                <button
                                                    onClick={() => setShowReviewForm(false)}
                                                    className="cancel-review-button"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="booking-required-message">
                                            <p>Please complete your booking and payment before leaving a review.</p>
                                            <div className="review-form-actions">
                                                <button
                                                    onClick={() => {
                                                        setShowReviewForm(false);
                                                        setShowBookingForm(true);
                                                    }}
                                                    className="submit-review-button"
                                                >
                                                    Request to Book
                                                </button>
                                                <button
                                                    onClick={() => setShowReviewForm(false)}
                                                    className="cancel-review-button"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="reviews-list">
                                {reviews.length > 0 ? (
                                    reviews.map((review, index) => (
                                        <div className="review-item" key={index}>
                                            <div className="review-header">
                                                <div className="reviewer-info">
                                                    <div className="reviewer-name">{review.user_name || "Anonymous"}</div>
                                                    <div className="review-date">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="review-rating">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FaStar
                                                            key={i}
                                                            className={i < review.rating ? "star filled" : "star empty"}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="review-content">{review.review}</div>
                                        </div>
                                    ))
                                ) : (
                                    <p>No reviews yet. Be the first to leave a review!</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="div2">
                        <div className="booking-summary airbnb-style">
                            <div className="price-section">
                                <div className="price-row">
                                <span className="price-label">₱{room.price} <span className="per-month">
                                    {room.room_type === "Bed spacer" ? "per bed" : "per room"}
                                </span></span>
                                </div>

                                <div className="divider"></div>

                                <div className="date-range-picker">
                                    <div className="date-input-container">
                                        <div className="date-input">
                                            <label>Start Date</label>
                                            <input
                                                type="date"
                                                className="date-input-field"
                                                min={new Date().toISOString().split('T')[0]}
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="date-input">
                                            <label>End Date</label>
                                            <input
                                                type="date"
                                                className="date-input-field"
                                                min={startDate || new Date().toISOString().split('T')[0]}
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="rental-duration">
                                        <div className="duration-label">Rental Duration:</div>
                                        <div className="duration-value">
                                            {duration > 0 ? `${duration} month${duration !== 1 ? 's' : ''}` : '1 month (default)'}
                                        </div>
                                    </div>
                                    {(!startDate || !endDate) && (
                                        <div className="date-notice">
                                            No dates selected? Default 1-month rental will be applied
                                        </div>
                                    )}
                                </div>
                                <div className="divider"></div>

                                {/* Added deposit display */}
                                <div className="price-details">
                                    <div className="price-row">
                                        <span className="price-label">Deposit:</span>
                                        <span className="price-value">₱{room.deposit}</span>
                                    </div>
                                    <div className="price-row">
                                        <span className="price-label">Monthly Rent:</span>
                                        <span className="price-value">₱{room.price}</span>
                                    </div>
                                    {duration > 0 && (
                                        <div className="price-row">
                                            <span
                                                className="price-label">Total Rent ({duration} month{duration !== 1 ? 's' : ''}):</span>
                                            <span
                                                className="price-value">₱{(room.price * duration).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="divider"></div>

                                <div className="estimated-total">
                                    <div className="total-row">
                                        <span>Estimated Total (Rent + Deposit)</span>
                                        <span>₱{(duration > 0 ? (room.price * duration) + room.deposit : room.price + room.deposit).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>


                            {/* In the booking-summary airbnb-style section, replace the guest-selector-container with this: */}
                            <div className="guest-selector-container">
                                {room.room_type === "Bed spacer" && (
                                    <>
                                        <div
                                            className="guest-selector-toggle"
                                            onClick={() => setShowGuestSelector(!showGuestSelector)}
                                        >
                                            <div className="guest-label">
                                                <span>Beds</span>
                                                <span
                                                    className="guest-count">{guestCount} Bed{guestCount !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="guest-toggle-icon">
                                                {showGuestSelector ? <FaTimes/> : <FaChevronDown/>}
                                            </div>
                                        </div>

                                        {showGuestSelector && (
                                            <div className="guest-selector-dropdown">
                                                <div className="guest-selector-row">
                                                    <div className="guest-type">
                                                        <div className="guest-type-label">Beds</div>
                                                        <div className="guest-type-description">
                                                            Number of beds to book
                                                        </div>
                                                    </div>
                                                    <div className="guest-counter">
                                                        <button
                                                            className="counter-button"
                                                            onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                                                            disabled={guestCount <= 1}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="guest-count">{guestCount}</span>
                                                        <button
                                                            className="counter-button"
                                                            onClick={() => {
                                                                setGuestCount(Math.min(room.number_of_beds, guestCount + 1));
                                                            }}
                                                            disabled={guestCount >= room.number_of_beds}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="max-guests-notice">
                                                    Maximum {room.number_of_beds} bed{room.number_of_beds !== 1 ? 's' : ''} available
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>


                            {bookingStatus === "pending" ? (
                                <div className="booking-status pending">
                                    <div className="status-content">
                                        <i className="status-icon clock-icon"></i>
                                        <span>Your booking is pending approval by the owner</span>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={handleBookNow} className="book-now-button airbnb-btn">
                                    Request to Book
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ListingDetails;