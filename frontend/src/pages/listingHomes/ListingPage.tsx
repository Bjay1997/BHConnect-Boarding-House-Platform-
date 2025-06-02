import "./listingHomes.css";
import { Link } from "react-router-dom";
import Navbar from "../../Components/Navbar.tsx";


function ListingPage() {
    return (
        <>
            <Navbar/>
            <div className="listing-page-container">
                <h1 className="page-title">List your property</h1>
                {/*<p className="page-subtitle">Select the category that best fits your property</p>*/}

                <div className="property-types">
                    <div className="property-card">
                        <div className="property-icon">🛏️</div>
                        {/*<h2>Bed Spacers</h2>*/}
                        <p>List individual rooms or bed spaces for rent</p>
                        <Link to="/listingProcedure" className="property-link">
                            <button className="list-property-btn">Proceed</button>
                        </Link>
                    </div>

                </div>
            </div>
        </>

    );
}

export default ListingPage;