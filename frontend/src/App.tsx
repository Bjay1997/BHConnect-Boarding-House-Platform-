import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Components/Home";
import "bootstrap-icons/font/bootstrap-icons.css";
import ListingProcedure from "./pages/listingHomes/ListingProcedure";
import ListingPage from "./pages/listingHomes/ListingPage";
import PropertyImages from "./pages/listingHomes/PropertyImages";
import ListedHomes from "./pages/listingHomes/ListedHomes";
import PropertyPrice from "./pages/listingHomes/PropertyPrice";
// import ProfileMenu from "./pages/userProfile/ProfileMenu";
import ProfilePage from "./pages/profilepage/ProfilePage";
import Notifications from "./pages/profilepage/Notifications";
import Favorites from "./pages/profilepage/Favorites";
import MyListings from "./pages/profilepage/MyListings";
import AdminDashboard from "./Components/admin/AdminDashboard";
import ListingDetails from "./pages/listingHomes/ListingDetails";
import PaymentPage from "./pages/payments/PaymentPage";
import Login from "./pages/payments/PaymentPage";
import SignUpSection from "./Components/LoginRegisterMenu/SignUpSection";
import AddRooms from "./pages/listingHomes/AddRooms"



function App() {


  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/signup" element={<SignUpSection/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/listingPage" element={<ListingPage/>}/>
        <Route path="/listingProcedure" element={<ListingProcedure/>}/>
        <Route path="/add-rooms" element={<AddRooms/>}/>
        <Route path='/propertyimages' element={<PropertyImages/>}/>
        <Route path="/listedhomes" element={<ListedHomes/>}/>
        <Route path="/property-images" element={<PropertyImages/>}/>
        <Route path="/propertyprice" element={<PropertyPrice/>}/>
        <Route path="/profile" element={<ProfilePage/>}/>
        <Route path="/notification" element={<Notifications/>}/>
        <Route path="/mylistings" element={<MyListings/>}/>
        <Route path="/favorite" element={<Favorites/>}/>
        <Route path="/admin" element={<AdminDashboard/>}/>
        <Route path="/roomdetails/:id" element={<ListingDetails/>}/>
        <Route path="/payment/:bookingId" element={<PaymentPage/>}/>


      
      </Routes>
    </Router>
  )
}

export default App
