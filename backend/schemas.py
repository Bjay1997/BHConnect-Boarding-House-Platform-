from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import date,datetime


class UserCreate(BaseModel):
    username:str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone_number: str
    role:str

class UserResponse(BaseModel):
    user_id: int
    username: str
    email: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None
    is_verified: bool
    role:str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str




class PropertyCreate(BaseModel):
    title: str
    description: str
    address: str
    city: str
    state_province: str
    postal_code: str
    house_rules: List[str]
    amenities: List[str]

class RoomCreate(BaseModel):
    property_id: int
    room_type_id: int
    room_number: int
    price: float
    availability: str = "Available"
    number_of_beds: int
    deposit:int

class RoomTypeSchema(BaseModel):
    room_type_id: int
    room_type: str

    class Config:
        from_attributes = True
class RoomImageSchema(BaseModel):
    image_url: str

    class Config:
        from_attributes = True

class RoomResponse(BaseModel):
    room_id: int
    property_id: int
    room_number: int
    price: float
    availability: str
    number_of_beds: int
    room_type: str
    rating: Optional[float] = None  # if you have a rating system
    property: dict
    images: List[RoomImageSchema] = []

    class Config:
        from_attributes = True

class BookingCreate(BaseModel):
    room_id: int
    guest_count: int
    start_date: str
    end_date: str
    total_amount: float

    

class NotificationCreate(BaseModel):
    user_id: int
    message: str
    booking_id: int | None = None
    recipient_role: str  # "owner" or "user"


class NotificationResponse(BaseModel):
    notification_id: int
    user_id: int
    booking_id: int | None
    message: str
    is_read: bool
    created_at: datetime
    role: str 

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True


class BookingStatusResponse(BaseModel):
    booking_id: int
    status: str

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    booking_id: int
    user_id: int
    amount: float
    payment_method: str
 


class FavoriteCreate(BaseModel):
    room_id: int

class FavoritePropertyResponse(BaseModel):
    property_id: int
    room_id: int
    room_number:int
    title:str
    price: Optional[float]
    main_image_url: Optional[str]



    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    room_id: int
    rating: int
    review: str




class TenantRecordProperty(BaseModel):
    title: str
    address: str
    city: str
    type: str  # "bedspace" or "whole_room"
    beds: Optional[int] = None
    rooms: Optional[int] = None
    price: float

class TenantRecordPayment(BaseModel):
    status: str
    amount: float
    method: Optional[str] = None

class TenantRecordResponse(BaseModel):
    booking_id: int
    tenant: UserResponse  
    property: TenantRecordProperty
    payment: TenantRecordPayment
    booking_date: datetime
    status: str
    
    class Config:
        from_attributes = True