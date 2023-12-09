import React from 'react';
import { Box } from '@mui/material';

/**
 * The landing page. Displays basic information about the site.
 */
const Landing = () => {
    return (
        <Box
            sx={{
                backgroundImage: "url('/images/landing.jpg')",
                backgroundSize: "cover",
                minHeight: "100vh",
                minWidth: "100vw",
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: -1,
                textAlign: "left",
                color: "white"
            }}
        >
            <h1 style={{
                marginTop: "12%",
                marginLeft: "15%",
                fontWeight: 800,
                fontSize: "80px"
            }}>Looking for vouchers?</h1>
            <h2 style={{
                marginTop: "1%",
                marginLeft: "16.5%",
                fontWeight: 600,
                fontSize: "35px"
            }}>We've got you covered.</h2>
            <p style={{
                marginTop: "3%",
                marginLeft: "16.5%",
                fontWeight: 300,
                fontSize: "18px"
            }}>Five Guys is a web platform for diners and restaurants alike to share discount promotions<br/>and give you the best deal on your next meal out.</p>
        </Box>
    )
}

export default Landing;