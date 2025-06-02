from datetime import datetime
from sqlalchemy import JSON, Column, Integer, String, Boolean, DateTime, DECIMAL, TIMESTAMP, Text, func, ForeignKey,Numeric,Date
from database import Base
from sqlalchemy.orm import relationship
import enum

class DBUser(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(20))
    profile_picture_url = Column(String(255))
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    username = Column(String(50), unique=True)
    id_document_url = Column(String, nullable=True)
    role = Column(String(50),nullable=True)

    # Relationship for properties owned by this user
    notifications = relationship("Notification", back_populates="user")
    favorites = relationship("Favorite", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    properties = relationship("Property", back_populates="owner")
    bookings = relationship("Booking", back_populates="guest")


class Property(Base):
    __tablename__ = "properties"

    property_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("users.user_id"), nullable=False) 
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state_province = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())  
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now()) 
    house_rules = Column(JSON, nullable=False)
    amenities = Column(JSON,nullable=False)

    owner = relationship("DBUser", foreign_keys=[owner_id], back_populates="properties")
    rooms = relationship("Room", back_populates="property")



class RoomType(Base):
    __tablename__ = 'room_type'

    room_type_id = Column(Integer, primary_key=True, autoincrement=True)
    room_type = Column(String(100), nullable=False)

class Room(Base):
    __tablename__ = 'rooms'

    room_id = Column(Integer, primary_key=True, autoincrement=True)
    property_id = Column(Integer, ForeignKey("properties.property_id"), nullable=False)
    room_number = Column(Integer, nullable=True)
    price = Column(Integer, nullable=True)
    availability = Column(String(100), nullable=True)
    number_of_beds = Column(Integer, nullable=True)
    room_type_id = Column(Integer, ForeignKey('room_type.room_type_id'), nullable=True)
    deposit = Column(Integer)

    room_type = relationship("RoomType")
    images = relationship("RoomImage", back_populates="room")
    bookings = relationship("Booking", back_populates="room")
    favorites = relationship("Favorite", back_populates="room")
    property = relationship("Property", back_populates="rooms")

    

class RoomImage(Base):
    __tablename__ = 'room_images'

    image_id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey('rooms.room_id'))
    image_url = Column(String(255), nullable=False)
    is_primary = Column(Boolean, default=False)
    uploaded_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    room = relationship("Room", back_populates="images")


class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.room_id"))
    guest_id = Column(Integer, ForeignKey("users.user_id"))
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    status = Column(String(20), default="pending")
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    rent_start = Column(Date)
    rent_end = Column(Date)
    guest_count = Column(Integer)  

    room = relationship("Room", back_populates="bookings")
    guest = relationship("DBUser", back_populates="bookings")
    notifications = relationship("Notification", back_populates="booking", cascade="all, delete-orphan")




class Notification(Base):
    __tablename__ = "notifications"
    
    notification_id = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    booking_id      = Column(Integer, ForeignKey("bookings.booking_id"), nullable=True)
    message         = Column(Text, nullable=False)
    is_read         = Column(Boolean, default=False)
    created_at      = Column(TIMESTAMP, default=datetime.utcnow)
    role  = Column(String, nullable=False)
    
    user    = relationship("DBUser", back_populates="notifications")
    booking = relationship("Booking", back_populates="notifications")
    


class Payment(Base):
    __tablename__ = 'payments'

    payment_id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(20), nullable=False)
    payment_status = Column(String(20), nullable=False, default='pending')

    gcash_receipt_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)



class Favorite(Base):
    __tablename__ = 'favorites'

    favorite_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'))
    room_id = Column(Integer, ForeignKey('rooms.room_id', ondelete='CASCADE'))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

 
    
    user = relationship("DBUser", back_populates="favorites")
    room = relationship("Room", back_populates="favorites")



class Review(Base):
    __tablename__ = "reviews"

    review_id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.room_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    rating = Column(Integer)
    review = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


    user = relationship("DBUser", back_populates="reviews")