import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./PaymentPage.css";
import { FiArrowLeft, FiCheck, FiUpload } from "react-icons/fi";

interface RoomDetails {
  room_id: number;
  price: number;
  deposit: number; // Added deposit field
  room_number: string;
  room_type: string;
  number_of_beds: number;
  availability: boolean;
  images: { image_url: string }[];
  property: {
    property_id: number;
    property_type: string;
    owner: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
    };
  };
}

interface BookingDetails {
  booking_id: number;
  room_id: number;
  total_amount: number;
  status: string;
  created_at: string;
  check_in: string;
  check_out: string;
  room: RoomDetails;
}

interface PaymentData {
  booking_id: number;
  user_id: number;
  amount: number;
  receipt: File | null;
}

const PaymentPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const authToken = sessionStorage.getItem("auth_token") || "";
  const storedUser = sessionStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    booking_id: Number(bookingId),
    user_id: user?.user_id || 0,
    amount: 0,
    receipt: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [monthsStayed, setMonthsStayed] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:8000/bookings/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch booking");
        const bookingData: BookingDetails = await res.json();

        setBooking(bookingData);

        // Calculate months stayed based on check_in and check_out dates
        if (bookingData.check_in && bookingData.check_out) {
          const startDate = new Date(bookingData.check_in);
          const endDate = new Date(bookingData.check_out);
          const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         (endDate.getMonth() - startDate.getMonth());
          setMonthsStayed(months > 0 ? months : 1);
        }

        // Calculate total amount (price * months stayed + deposit)
        const total = (bookingData.room?.price * monthsStayed || bookingData.room?.price || 0) + 
                     (bookingData.room?.deposit || 0);
        setPaymentData((prev) => ({
          ...prev,
          amount: total,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [bookingId, authToken]); 

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!paymentData.receipt) {
      setError("Please upload a payment receipt");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("booking_id", paymentData.booking_id.toString());
      formData.append("user_id", paymentData.user_id.toString());
      formData.append("amount", paymentData.amount.toString());
      formData.append("receipt", paymentData.receipt);

      const response = await fetch("http://localhost:8000/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Payment failed");
      }

      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!booking || !booking.room?.property) return <div>No booking found</div>;

  const property = booking.room.property;
  const room = booking.room;

  return (
    <div className="airbnb-payment-container">
      <header className="payment-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back
        </button>
        <h1>Complete Payment</h1>
      </header>

      {success ? (
        <div className="success-card">
          <div className="success-icon"><FiCheck /></div>
          <h2>Payment Successful!</h2>
          <p>Your booking is now confirmed.</p>
          <button onClick={() => navigate("/")}>Back to Home</button>
        </div>
      ) : (
        <div className="payment-content">
          <div className="payment-summary-card">
          <h2>Booking Summary</h2>
          {room.images.length > 0 && (
            <div className="property-image">
              <img
                src={room.images[0].image_url}
                alt="Room"
                onError={(e) =>
                  ((e.target as HTMLImageElement).src = "/default-room.jpg")
                }
              />
            </div>
          )}
          <div className="summary-details">
            <h3>{room.room_type.room_type} Room</h3>
            <div className="detail-row">
              <span>Monthly Price:</span>
              <span>₱{room.price.toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span>Duration:</span>
              <span>{monthsStayed} month(s)</span>
            </div>
            <div className="detail-row">
              <span>Deposit:</span>
              <span>₱{room.deposit.toLocaleString()}</span>
            </div>
            <div className="divider"></div>
            <div className="detail-row total">
              <span>Total Amount:</span>
              <span>₱{paymentData.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

          <div className="payment-method-card">
            <h2>Payment Method</h2>
            <div className="payment-tabs">
              <div className="tab active">GCash</div>
            </div>

            <div className="payment-instructions">
              <h3>How to Pay with GCash</h3>
              <ol>
                <li>Open the GCash app on your phone</li>
                <li>Tap <strong>Pay Bills</strong></li>
                <li>Choose <strong>Others</strong> under categories</li>
                <li>Enter the amount: <strong>₱{paymentData.amount.toLocaleString()}</strong></li>
                <li>Complete your payment</li>
              </ol>

              <div className="owner-contact">
                <h3>Send Payment To</h3>
                <div className="contact-details">
                  <div className="contact-row">
                    <span className="contact-label">GCash Number:</span>
                    <span>{property.owner.phone_number}</span>
                  </div>
                  <div className="contact-row">
                    <span className="contact-label">Owner:</span>
                    <span>{property.owner.first_name} {property.owner.last_name}</span>
                  </div>
                  <div className="contact-row">
                    <span className="contact-label">Email:</span>
                    <span>{property.owner.email}</span>
                  </div>
                </div>
                <p className="contact-note">
                  Please include your booking ID ({booking.booking_id}) in the payment reference.
                </p>
              </div>

              <div className="receipt-upload">
                <h3>Upload Payment Proof</h3>
                <p>Take a screenshot of your payment confirmation and upload it here</p>

                <label className="upload-area">
                  {paymentData.receipt ? (
                    <div className="preview">
                      <img
                        src={URL.createObjectURL(paymentData.receipt)}
                        alt="Receipt Preview"
                      />
                      <span>{paymentData.receipt.name}</span>
                    </div>
                  ) : (
                    <>
                      <FiUpload className="upload-icon" />
                      <span>Click to upload or drag and drop</span>
                      <span className="file-types">PNG, JPG (max 5MB)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPaymentData({
                          ...paymentData,
                          receipt: e.target.files[0],
                        });
                      }
                    }}
                    required
                  />
                </label>
              </div>
            </div>

            <button
              className="pay-now-button"
              onClick={handlePaymentSubmit}
              disabled={!paymentData.receipt || isLoading}
            >
              {isLoading ? "Processing..." : "Pay Now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;