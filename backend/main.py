import json
from operator import and_, or_
from tokenize import String
from fastapi import FastAPI, Depends, HTTPException, Query,Request,status
from sqlalchemy import update
from sqlalchemy.orm import Session, joinedload
from models import DBUser, Property,Booking,Notification,Payment,Favorite,Review,Room,RoomImage,RoomType
from schemas import UserCreate, UserResponse,PropertyCreate ,BookingCreate,NotificationCreate,NotificationResponse,RoomTypeSchema,RoomResponse,PaymentCreate,FavoriteCreate,FavoritePropertyResponse,ReviewCreate,RoomCreate
from database import SessionLocal, engine,get_db
import bcrypt
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List
import shutil
import os
from fastapi import UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse


SECRET_KEY = "your-secret-key-here"  
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(DBUser).filter(DBUser.username == username).first()
    if not user:
        return False
    if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(DBUser).filter(DBUser.username == username).first()
    if user is None:
        raise credentials_exception
    return user


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)








app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(DBUser).filter(
        (DBUser.email == user.email) | (DBUser.username == user.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")

    # Hash password
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Default URLs
    default_profile = "/static/profile_pictures/default_pp.jpg"
    default_id = "/static/id_documents/default_idpic.jpg"

    # Create user
    db_user = DBUser(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        phone_number=user.phone_number,
        role=user.role,
        profile_picture_url=default_profile,
        id_document_url=default_id
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user



ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"


@app.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    if form_data.username == ADMIN_USERNAME and form_data.password == ADMIN_PASSWORD:

        user = DBUser(
            user_id=1,  
            username=ADMIN_USERNAME,
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            phone_number=None,
            profile_picture_url=None,
            is_verified=True
        )
    else:

        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=400,
                detail="Incorrect username or password"
            )


    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},  
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id, 
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone_number": user.phone_number,
            "profile_picture_url": user.profile_picture_url,
            "is_verified": user.is_verified
        }
    }

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: DBUser = Depends(get_current_user)):
    return current_user

@app.get("/users/{user_id}", response_model=UserResponse)
async def read_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.user_id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/users/me")
def update_user(
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    phone_number: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None),
    id_document: Optional[UploadFile] = File(None),  
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user),
):
    user = db.query(DBUser).filter(DBUser.user_id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.first_name = first_name
    user.last_name = last_name
    user.email = email
    user.phone_number = phone_number

    if profile_picture:
        # Save profile picture
        profile_picture_location = f"static/profile_pictures/{user.user_id}_{profile_picture.filename}"
        os.makedirs(os.path.dirname(profile_picture_location), exist_ok=True)
        with open(profile_picture_location, "wb") as buffer:
            shutil.copyfileobj(profile_picture.file, buffer)
        user.profile_picture_url = f"/static/profile_pictures/{user.user_id}_{profile_picture.filename}"

    if id_document:
        # Save ID document
        id_document_location = f"static/id_documents/{user.user_id}_{id_document.filename}"
        os.makedirs(os.path.dirname(id_document_location), exist_ok=True)
        with open(id_document_location, "wb") as buffer:
            shutil.copyfileobj(id_document.file, buffer)
        user.id_document_url = f"/static/id_documents/{user.user_id}_{id_document.filename}"

    db.commit()
    db.refresh(user)

    return user



@app.get("/admin/users")
async def get_all_users(db: Session = Depends(get_db)):
    users = db.query(DBUser).all()
    return users

@app.put("/admin/approve-user/{user_id}")
async def approve_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Set the user as verified
    user.is_verified = True
    db.commit()
    db.refresh(user)

    return {"message": "User approved", "user": user}

@app.put("/admin/reject-user/{user_id}")
async def reject_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Set the user as not verified
    user.is_verified = False
    db.commit()
    db.refresh(user)

    return {"message": "User rejected", "user": user}




@app.post("/properties")
def create_property(
    data: PropertyCreate,  # Your existing PropertyCreate model
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is not verified. Please verify your account to list properties."
        )

    try:
        new_property = Property(
            owner_id=current_user.user_id, 
            title=data.title,
            description=data.description,
            address=data.address,
            city=data.city,
            state_province=data.state_province,
            postal_code=data.postal_code,
            is_active=False,
            house_rules=data.house_rules,
            amenities=data.amenities
        )
        db.add(new_property)
        db.commit()
        db.refresh(new_property)

        return {
            "message": "Property created successfully",
            "property_id": new_property.property_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating property: {str(e)}"
        )


@app.get("/room-types", response_model=list[RoomTypeSchema])
def get_room_types(db: Session = Depends(get_db)):
    return db.query(RoomType).all()

# Add new endpoint for room creation
@app.post("/rooms")
def create_room(
    data: RoomCreate,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    try:
        # Verify the property belongs to the user
        property = db.query(Property).filter(
            Property.property_id == data.property_id,
            Property.owner_id == current_user.user_id
        ).first()
        
        if not property:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found or you don't have permission"
            )

        new_room = Room(
            property_id=data.property_id,
            room_number=data.room_number,
            price=data.price,
            deposit=data.deposit,
            availability=data.availability,
            number_of_beds=data.number_of_beds,
            room_type_id=data.room_type_id
        )
        
        db.add(new_room)
        db.commit()
        db.refresh(new_room)
        
        # Handle amenities if needed
        # (You might want to store these differently)
        
        return {
            "message": "Room added successfully",
            "room_id": new_room.room_id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding room: {str(e)}"
        )

UPLOAD_DIR = "uploads/room_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.post("/rooms/{room_id}/images")
async def upload_room_images(
    room_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    try:
        # Verify the room belongs to the user
        room = db.query(Room).join(Property).filter(
            Room.room_id == room_id,
            Property.owner_id == current_user.user_id
        ).first()
        
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found or you don't have permission"
            )

        saved_files = []
        for file in files:
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            filename = f"{room_id}_{timestamp}_{file.filename}"
            file_path = f"{UPLOAD_DIR}/{filename}"

            
            # Save the file
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            # Create database record for the image
            new_image = RoomImage(
                room_id=room_id,
                image_url=f"/uploads/room_images/{filename}"  # ✅ relative path for frontend access
            )
            db.add(new_image)
            saved_files.append(file_path)
        
        db.commit()
        
        return {
            "message": f"{len(saved_files)} images uploaded successfully",
            "saved_files": saved_files
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading images: {str(e)}"
        )



@app.get("/rooms", response_model=List[RoomResponse])
def get_rooms(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None),
    room_type: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    location: Optional[str] = Query(None),
    min_beds: Optional[int] = Query(None),
    min_rating: Optional[float] = Query(None),  # if you implement ratings
):
    query = db.query(Room).join(Property).join(RoomType).options(
        joinedload(Room.property), joinedload(Room.room_type), joinedload(Room.images)
    )

    if search:
        query = query.filter(
            (Property.city.ilike(f"%{search}%")) |
            (Property.state_province.ilike(f"%{search}%")) |
            (Property.title.ilike(f"%{search}%"))
        )
    if location:
        query = query.filter(
            (Property.city.ilike(f"%{location}%")) |
            (Property.state_province.ilike(f"%{location}%"))
        )
    if room_type:
        query = query.filter(RoomType.room_type == room_type)
    if min_price is not None:
        query = query.filter(Room.price >= min_price)
    if max_price is not None:
        query = query.filter(Room.price <= max_price)
    if min_beds is not None:
        query = query.filter(Room.number_of_beds >= min_beds)
    # if you store ratings, add filter for min_rating here

    rooms = query.all()

    room_data = []
    for room in rooms:
        room_data.append({
            "room_id": room.room_id,
            "property_id": room.property_id,
            "room_number": room.room_number,
            "price": room.price,
            "availability": room.availability,
            "number_of_beds": room.number_of_beds,
            "room_type": room.room_type.room_type,
            "rating": None,  # implement rating logic if needed
            "property": {
                "city": room.property.city,
                "state_province": room.property.state_province
            },
            "images": [{"image_url": img.image_url} for img in room.images]
        })

    return room_data
    


@app.get("/my-rooms")
def get_my_rooms(
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    # Get all rooms that belong to properties owned by current user
    rooms = db.query(Room).join(Property).filter(
        Property.owner_id == current_user.user_id
    ).options(
        joinedload(Room.property),
        joinedload(Room.images)
    ).all()
    
    result = []
    for room in rooms:
        room_data = {
            "room_id": room.room_id,
            "property_id": room.property_id,
            "room_number": room.room_number,
            "price": room.price,
            "availability": room.availability,
            "number_of_beds": room.number_of_beds,
            "room_type": room.room_type,
            "property": {
                "title": room.property.title,
                "city": room.property.city,
                "state_province": room.property.state_province,
            },
            "images": [{"image_url": image.image_url} for image in room.images] if room.images else []
        }
        result.append(room_data)
    
    return result

@app.delete("/delete-room/{room_id}")
def delete_room(
        room_id: int,
        db: Session = Depends(get_db),
        current_user: DBUser = Depends(get_current_user)
):
    """
    Delete a room by its room_id (not property_id)
    """
    # Find the room and verify ownership
    room = db.query(Room).join(Property).filter(
        Room.room_id == room_id,
        Property.owner_id == current_user.user_id
    ).first()

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found or you don't have permission"
        )

    try:
        # Delete associated images first if needed
        db.query(RoomImage).filter(RoomImage.room_id == room_id).delete()

        # Then delete the room
        db.delete(room)
        db.commit()

        return {"message": f"Room {room_id} deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting room: {str(e)}"
        )


@app.get("/rooms/{room_id}")
def get_room(room_id: int, db: Session = Depends(get_db)):
    try:
        room = db.query(Room).options(
            joinedload(Room.property),
            joinedload(Room.images)
        ).filter(Room.room_id == room_id).first()
        
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        owner = db.query(DBUser).filter(DBUser.user_id == room.property.owner_id).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found")
        
        return {
            "room_id": room.room_id,
            "property_id": room.property_id,
            "room_number": room.room_number,
            "price": room.price,
            "availability": room.availability,
            "deposit":room.deposit,
            "number_of_beds": room.number_of_beds,
            "room_type": room.room_type,
            "images": [{"image_url": img.image_url} for img in room.images],
            "property": {
                "property_id": room.property.property_id,
                "title": room.property.title,
                "description": room.property.description,
                "city": room.property.city,
                "state_province": room.property.state_province,
                "house_rules": room.property.house_rules,
                "amenities": room.property.amenities,
                "owner": {
                    "first_name": owner.first_name,
                    "last_name": owner.last_name,
                    "email": owner.email,
                    "phone_number": owner.phone_number
                }
            }
        }
    except Exception as e:
        print(f"Error fetching room: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/bookings")
async def create_booking(
    booking_data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    try:
        # Validate dates
        if not booking_data.start_date or not booking_data.end_date:
            raise HTTPException(400, "Both start and end dates are required")
        # Parse dates
        start_date = datetime.strptime(booking_data.start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(booking_data.end_date, '%Y-%m-%d').date()

        if start_date >= end_date:
            raise HTTPException(400, "End date must be after start date")

        duration_months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
        if duration_months < 1:
            raise HTTPException(400, "Minimum rental period is 1 month")

        room = db.query(Room).filter(Room.room_id == booking_data.room_id).with_for_update().first()
        if not room:
            raise HTTPException(404, "Room not found")

        # Calculate total amount based on room price and duration
        total_amount = room.price * duration_months

        # Create booking
        new_booking = Booking(
            room_id=booking_data.room_id,
            guest_id=current_user.user_id,  # Automatically set from logged-in user
            total_amount=total_amount,
            status="pending",
            guest_count=booking_data.guest_count,
            rent_start=start_date,
            rent_end=end_date
        )
        
        db.add(new_booking)
        db.commit()

        # Create notification
        notif = Notification(
            user_id=room.property.owner_id,
            booking_id=new_booking.booking_id,
            message=f"{current_user.first_name} booked from {start_date} to {end_date}",
            role="owner"
        )
        db.add(notif)
        db.commit()
        
        return {
            "booking_id": new_booking.booking_id,
            "total_amount": total_amount,
            "duration_months": duration_months
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))





@app.get("/my-bookings")
async def get_user_bookings(
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    bookings = db.query(Booking).options(
    joinedload(Booking.room).joinedload(Room.property),
    joinedload(Booking.room).joinedload(Room.images),
    joinedload(Booking.room).joinedload(Room.room_type)
).filter(Booking.guest_id == current_user.user_id).all()

    result = []
    for booking in bookings:
        room = booking.room
        property = room.property if room else None
        images = room.images if room and room.images else []

        image_url = images[0].image_url if images else None

        # Check payment
        payment_exists = db.query(Payment).filter(Payment.booking_id == booking.booking_id).first() is not None

        result.append({
            "booking_id": booking.booking_id,
            "room_id": booking.room_id,
            "property_title": property.title if property else "Unknown Property",
            "property_image": image_url,
            "total_amount": float(booking.total_amount),
            "status": "Paid" if payment_exists else "Pending",
            "created_at": booking.created_at
        })

    return result
@app.get("/bookings/check")
async def check_booking_status(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    try:
        # Check if user has any approved bookings for this property
        booking = db.query(Booking).filter(
            Booking.room_id == room_id,
            Booking.guest_id == current_user.user_id,
            Booking.status == "paid"
        ).first()

        # Check if payment exists
        has_paid = False
        if booking:
            payment = db.query(Payment).filter(
                Payment.booking_id == booking.booking_id,
                Payment.payment_status == "completed"
            ).first()
            has_paid = payment is not None

        return {
            "has_approved_booking": booking is not None,
            "has_paid": has_paid
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/notifications", response_model=NotificationResponse)
def create_notification(
    payload: NotificationCreate,
    db: Session = Depends(get_db)
):

    if payload.booking_id:
        if not db.get(Booking, payload.booking_id):
            raise HTTPException(404, "Booking not found")

    new_notification = Notification(
        user_id    = payload.user_id,
        booking_id = payload.booking_id,  
        message    = payload.message,
        is_read    = False,
    )
    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)
    return new_notification




@app.get("/notifications", response_model=list[NotificationResponse])
def get_notifications(db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    notifications = db.query(Notification).filter(Notification.user_id == current_user.user_id).all()

    result = []
    for notif in notifications:
        booking_status = None
        if notif.booking_id:
            booking = db.query(Booking).filter(Booking.booking_id == notif.booking_id).first()
            if booking:
                booking_status = booking.status

        result.append(NotificationResponse(
            notification_id=notif.notification_id,
            user_id=notif.user_id,
            booking_id=notif.booking_id,
            message=notif.message,
            is_read=notif.is_read,
            created_at=notif.created_at,  
            role=notif.role,
            status=booking_status  
            
        ))

    return result



@app.put("/mark-all-read")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    try:
        # Fetch all unread notifications for the current user
        notifications = db.query(Notification)\
            .filter(Notification.user_id == current_user.id)\
            .filter(Notification.is_read == False)\
            .all()

        for notif in notifications:
            notif.is_read = True

        db.commit()
        return {"message": "All notifications marked as read."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to mark all notifications as read.")

@app.put("/bookings/{booking_id}/{status}")
def update_booking_status(
    booking_id: int, 
    status: str, 
    db: Session = Depends(get_db), 
    current_user: DBUser = Depends(get_current_user)
):
    # Get the booking
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Get the room
    room = db.query(Room).filter(Room.room_id == booking.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Get the property from the room
    property = db.query(Property).filter(Property.property_id == room.property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    # Ensure current user is the owner of the property
    if property.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You are not the owner of this property")

    # Update booking status
    booking.status = status
    db.commit()

    # Notify the user who booked
    notif = Notification(
        user_id=booking.guest_id,
        booking_id=booking_id,
        message=f"Your booking was {status}.",
        role="user"
    )
    db.add(notif)
    db.commit()

    return {"message": f"Booking status updated to {status}"}



@app.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db)
):
    try:
        notification = db.query(Notification).filter(
            Notification.notification_id == notification_id
        ).first()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
            
        notification.is_read = True
        db.commit()
        
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/bookings/{booking_id}")
async def get_booking_by_id(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    booking = db.query(Booking).filter(
        Booking.booking_id == booking_id,
        Booking.guest_id == current_user.user_id
    ).options(
        joinedload(Booking.room).joinedload(Room.property).joinedload(Property.owner),
        joinedload(Booking.room).joinedload(Room.images)
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return {
        "booking_id": booking.booking_id,
        "room_id": booking.room_id,
        "total_amount": float(booking.total_amount),
        "status": booking.status,
        "created_at": booking.created_at,
        "room": {
            "room_id": booking.room.room_id,
            "price": float(booking.room.price),
            "room_number": booking.room.room_number,
            "room_type": booking.room.room_type,
            "number_of_beds": booking.room.number_of_beds,
            "deposit":booking.room.deposit,
            "availability": booking.room.availability,
            "images": [{"image_url": img.image_url} for img in booking.room.images],
            "property": {
                "property_id": booking.room.property.property_id,
                "owner": {
                    "first_name": booking.room.property.owner.first_name,
                    "last_name": booking.room.property.owner.last_name,
                    "email": booking.room.property.owner.email,
                    "phone_number": booking.room.property.owner.phone_number
                }
            }
        }
    }



@app.put("/bookings/{booking_id}/accept")
async def accept_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.status = "approved"
    db.commit()
    db.refresh(booking)
    return {"message": "Booking accepted"}

@app.put("/bookings/{booking_id}/reject")
async def reject_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.status = "rejected"
    db.commit()
    db.refresh(booking)
    return {"message": "Booking rejected"}

@app.put("/bookings/{booking_id}/proceed_payment")
async def proceed_payment(
    booking_id: int, 
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status != "approved":
        raise HTTPException(status_code=400, detail="Booking is not approved for payment")
    
    # Update status to indicate payment is being processed
    booking.status = "payment_pending"
    db.commit()
    
    # Return payment details needed for the frontend
    property = db.query(Property).filter(Property.property_id == booking.property_id).first()
    return {
        "booking_id": booking.booking_id,
        "amount_due": booking.total_amount,
        "property_title": property.title if property else "",
        "payment_instructions": "Pay via GCash to complete your booking"
    }

@app.put("/bookings/{booking_id}/confirm_payment")
async def confirm_payment(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking:
        booking.payment_status = "paid"
        db.commit()
        return {"detail": "Payment confirmed"}
    raise HTTPException(status_code=404, detail="Booking not found")



@app.post("/payments")
async def create_payment(
    booking_id: int = Form(...),
    user_id: int = Form(...),
    amount: float = Form(...),
    receipt: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # Validate user_id
        if user_id <= 0:
            raise HTTPException(status_code=400, detail="Invalid user ID")

        # 1. Save the receipt file
        upload_dir = "uploads/receipts"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = f"{upload_dir}/{booking_id}_{datetime.now().timestamp()}.jpg"

        with open(file_path, "wb") as buffer:
            buffer.write(await receipt.read())

        # 2. Create payment record
        db_payment = Payment(
            booking_id=booking_id,
            user_id=user_id,
            amount=amount,
            payment_method="gcash",
            payment_status="completed",
            gcash_receipt_url=file_path,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)

        # 3. Update booking status
        booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        booking.status = "paid"
        db.commit()

        # 4. Get room from booking
        room = db.query(Room).filter(Room.room_id == booking.room_id).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        # 5. Get property from room
        property = db.query(Property).filter(Property.property_id == room.property_id).first()
        if not property:
            raise HTTPException(status_code=404, detail="Property not found")

        owner_id = property.owner_id

        # 6. Fetch tenant info
        tenant = db.query(DBUser).filter(DBUser.user_id == user_id).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")

        tenant_name = tenant.first_name

        # 7. Create notification for owner
        owner_notification = Notification(
            user_id=owner_id,
            booking_id=booking_id,
            message=f"{tenant_name} has paid for booking #{booking_id}.",
            is_read=False,
            created_at=datetime.now(),
            role="owner"
        )
        db.add(owner_notification)
        db.commit()

        return {
            "status": "success",
            "payment_id": db_payment.payment_id,
            "data": {
                "booking_id": db_payment.booking_id,
                "amount": db_payment.amount,
                "status": db_payment.payment_status
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment error: {str(e)}")

@app.post("/favorites", response_model=FavoriteCreate)
async def add_favorite(
    favorite: FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    try:

        room = db.query(Room).filter(
            Room.room_id == favorite.room_id
        ).first()
        
        if not property:
            raise HTTPException(
                status_code=404,
                detail="room not found"
            )
        
        # Check if already favorited
        existing_favorite = db.query(Favorite).filter(
            Favorite.user_id == current_user.user_id,
            Favorite.room_id == favorite.room_id
        ).first()
        
        if existing_favorite:
            raise HTTPException(
                status_code=400,
                detail="Room already in favorites"
            )
        
        # Single declaration of new_favorite
        new_favorite = Favorite(
            user_id=current_user.user_id,
            room_id=favorite.room_id
        )
        
        db.add(new_favorite)
        db.commit()
        db.refresh(new_favorite)
        
        return new_favorite
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.delete("/favorites/{property_id}")
async def remove_favorite(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    try:
        # Convert to int if needed
        property_id = int(property_id)
        
        favorite = db.query(Favorite).filter(
            Favorite.user_id == current_user.user_id,
            Favorite.property_id == property_id
        ).first()
        
        if not favorite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Favorite not found"
            )
        
        db.delete(favorite)
        db.commit()
        
        return {"message": "Favorite removed successfully"}
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid property_id format"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/favorites", response_model=List[FavoritePropertyResponse])
async def get_user_favorites(
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    # Query joining Favorite -> Room -> Property
    favorites = db.query(Favorite, Room, Property, RoomImage)\
        .join(Room, Favorite.room_id == Room.room_id)\
        .join(Property, Room.property_id == Property.property_id)\
        .outerjoin(
            RoomImage,
            and_(
                RoomImage.room_id == Room.room_id,
                RoomImage.is_primary == True
            )
        )\
        .filter(Favorite.user_id == current_user.user_id)\
        .all()
    
    result = []
    for favorite, room, property, image in favorites:
        result.append({
            "property_id": property.property_id,  # Include property ID
            "room_id": room.room_id,            # Include room ID
            "title": property.title,             # Property title
            "room_number": room.room_number,     # Room number
            "price": float(room.price) if room.price else None,
            "main_image_url": image.image_url if image else None
        })
    
    return result

@app.get("/favorites/{property_id}/check")
async def check_favorite(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.user_id,
        Favorite.room_id == property_id
    ).first()
    
    return {"is_favorite": favorite is not None}




@app.post("/reviews")
def create_review(
    review: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    # Check if user has an approved booking and a paid payment
    booking = (
        db.query(Booking)
        .join(Payment, Payment.booking_id == Booking.booking_id)
        .filter(
            Booking.room_id == review.room_id,
            Booking.guest_id == current_user.user_id,
            Booking.status == "paid",
            Payment.payment_status == "completed"
        )
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=403,
            detail="You need to have an approved and paid booking for this property before leaving a review"
        )

    # Check if user already left a review for this property
    existing_review = db.query(Review).filter(
        Review.room_id == review.room_id,
        Review.user_id == current_user.user_id
    ).first()

    if existing_review:
        raise HTTPException(
            status_code=400,
            detail="You've already reviewed this property"
        )

    db_review = Review(
        room_id=review.room_id,
        user_id=current_user.user_id,
        rating=review.rating,
        review=review.review
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)

    # Include user information in the response
    review_data = {
        "review_id": db_review.review_id,
        "room_id": db_review.room_id,
        "user_id": db_review.user_id,
        "user_name": f"{current_user.first_name} {current_user.last_name}",
        "rating": db_review.rating,
        "review": db_review.review,
        "created_at": db_review.created_at
    }

    return {"message": "Review submitted successfully", "review": review_data}


@app.get("/rooms/{room_id}/reviews")
def get_reviews(room_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).options(joinedload(Review.user)).filter(Review.room_id == room_id).all()

    return [
        {
            "review_id": review.review_id,
            "rating": review.rating,
            "review": review.review,
            "created_at": review.created_at,
            "user_name": f"{review.user.first_name} {review.user.last_name}" if review.user else "Anonymous"
        }
        for review in reviews
    ]

@app.get("/tenant-records")
def get_tenant_records(
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    # Ensure current_user is an owner
    if current_user.role != "owner":
        return JSONResponse(status_code=403, content={"detail": "Access forbidden"})
    
    # Get only bookings for properties owned by this owner
    bookings = (
    db.query(Booking)
    .join(Booking.room)
    .join(Room.property)
    .filter(Property.owner_id == current_user.user_id)
    .options(
        joinedload(Booking.guest),  # Explicitly load guest relationship
        joinedload(Booking.room).joinedload(Room.property).joinedload(Property.owner)
    )
    .all()
)

    records = []
    for booking in bookings:
        record = {
            "id": booking.booking_id,
            "bookingId": booking.booking_id,
            "tenantId": booking.guest.user_id,
            "tenantName": booking.guest.username,
            "propertyId": booking.room.property.property_id,
            "propertyName": booking.room.property.title,
            "room": booking.room.room_number,
            "status": booking.status
        }
        records.append(record)

    return JSONResponse(content=records)

