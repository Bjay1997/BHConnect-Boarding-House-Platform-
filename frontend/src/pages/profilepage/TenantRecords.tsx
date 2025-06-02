import React, { useState, useEffect } from "react";
import "./TenantRecords.css";

interface TenantReport {
    id: number;
    bookingId: number;
    tenantId: number;
    tenantName: string;
    propertyId: number;
    propertyName: string;
    room: number;
    status: "pending" | "Paid" | "Unpaid";
}

const TenantReports = () => {
    const [reports, setReports] = useState<TenantReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<TenantReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReports = async () => {
        try {
            const token = sessionStorage.getItem("auth_token");
            const response = await fetch("http://localhost:8000/tenant-records", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error("You don't have permission to view these records");
                }
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            setReports(data);
            setError(null);
        } catch (error) {
            console.error("Failed to fetch reports", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleReportClick = (report: TenantReport) => {
        setSelectedReport(report);
    };

    const handleBackToList = () => {
        setSelectedReport(null);
    };

    if (loading) return <div className="loading-message">Loading reports...</div>;

    if (selectedReport) {
        return (
            <div className="report-detail-container">
                <button onClick={handleBackToList} className="back-button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back
                </button>
                <h2>Tenant Details</h2>
                <div className="report-detail-card">
                    <strong>Booking #:</strong> {selectedReport.bookingId} &nbsp; <br/>
                    <strong>Tenant: </strong> {selectedReport.tenantName} &nbsp; <br/>
                    <strong>Property: </strong> {selectedReport.propertyName} &nbsp; <br/>
                    <strong>Room: </strong> {selectedReport.room} &nbsp; <br/>

                    <strong>Status: </strong>{selectedReport.status}
                    <span className={`status-badge ${selectedReport.status.toLowerCase()}`}>
                            {selectedReport.status}
                        </span>

                    {selectedReport.status === "pending" && (
                        <div className="report-actions">
                            <button className="action-button paid">Mark as Paid</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="tenant-reports-container">
            <h1>Tenant Records</h1>
            {reports.length === 0 ? (
                <p className="empty-message">No reports found.</p>
            ) : (
                <div className="reports-list">
                    {reports.map((report) => (
                        <div
                            key={report.id}
                            className="report-card"
                            onClick={() => handleReportClick(report)}
                        >
                            <div className="report-header">
                                <h3>{report.propertyName}</h3>
                            </div>
                            <div className="report-meta">
                                <div> <strong>Tenant:</strong>  {report.tenantName}</div>
                                <br />

                                <div><strong>Booking #:</strong> {report.bookingId}</div>
                                <br />


                                <div><strong>Status:</strong> {report.status}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TenantReports;