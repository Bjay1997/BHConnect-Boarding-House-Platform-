BHConnect (Boarding House Platform)
Project Title
BHConnect – A modern boarding house listing and booking platform.

Description
BHConnect is a full-stack web platform built using FastAPI (Python) for the backend and React (JavaScript, via Vite) for the frontend. It allows property owners to register, list and manage their boarding houses, and handle tenant bookings. Tenants can view listings, filter by location or price, favorite properties, book stays, and leave reviews. Admin functionality is also included for managing users and listings. The platform is designed to be responsive, scalable, and user-friendly.

Getting Started
Dependencies
Ensure the following tools are installed:

Python 3.10+
FastAPI
Uvicorn
MySQL (You can use XAMPP for local DB)
npm 
Vite 

Installing
1. download the zip and extract
git clone https://github.com/your-username/bhconnect.git
cd bhconnect
2. Install Backend Requirements
cd backend
pip install -r requirements.txt


Executing Program
1. Run Backend API
From the backend/ folder:
uvicorn main:app --reload
This starts the FastAPI backend server at:
http://127.0.0.1:8000

2. Run Frontend (React)
From the frontend/ folder:
npm run dev
This starts the React frontend at:
http://localhost:5173

3. API Documentation 
http://127.0.0.1:8000/docs

Help / Troubleshooting
MySQL not connecting? Make sure the DB server (like XAMPP) is running and credentials are correct.

CORS error? Make sure FastAPI CORS middleware is properly set in main.py

Images not uploading? Check if the upload folder exists and has write permissions.

Authors
[Your Name] – @YourGitHub

🕒 Version History

0.1

Initial release with user authentication and basic listing/booking flow

Favorites and Reviews features

Property image uploads and tenant booking management

UI improvements and bug fixes

