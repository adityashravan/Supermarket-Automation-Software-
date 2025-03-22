import React from "react";

export const Spinner: React.FC = () => {
    return (
        <>
            <div style={{ height: "198px", position: "relative", background: "#fff", textAlign: "center" }}>
                <div className="spinner">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </>
    );
};
