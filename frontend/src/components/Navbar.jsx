import React from 'react';
import { AppBar, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Toolbar, Typography } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SetMealRoundedIcon from '@mui/icons-material/SetMealRounded';
import { useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AuthContext, SnackbarContext } from '../App';
import Config from "../config.json";

/**
 * The navbar component. When logged in, can also access the logout functionality here.
 */
/*eslint-disable eqeqeq*/
const Navbar = () => {
    
    const { isDiner, token, setToken } = useContext(AuthContext);
    const { setOpen, setMessage, isDarkMode, setIsDarkMode } = useContext(SnackbarContext);
    const [openDialog, setOpenDialog] = React.useState(false);
    const [isLanding, setIsLanding] = React.useState(true);

    const navigate = useNavigate();
    const location = useLocation();
    
    useEffect(() => {
        setIsLanding(location.pathname == "/");
    }, [location, setIsLanding]);

    let background = "url('/images/landing.jpg')";
    if (isDarkMode) {
        background = "#";
    }
    if (isLanding) {
        background = "transparent";
    }

    /**
     * Lets the user logout, freeing their session token and signing them out of the application.
     */
    const Logout = async () => {
        setOpenDialog(false);
        let request = {
            method: "POST",
            body: JSON.stringify({"token": token}),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/auth/logout`, request);
        const data = await response.json();
        if (response.status === 200) {
                setMessage("Logout successful");
                setOpen(true);
                setToken(null);
                navigate("/");
        }
        else {
            setMessage(data["error"]);
            setOpen(true);
        }
    };

    const handleOpenDialog = (event) => {
        event.preventDefault();
        setOpenDialog(true);
    }

    const handleCloseDialog = (event) => {
        event.preventDefault();
        setOpenDialog(false);
    };

    return (
        <AppBar
            position="static"
            sx={{ background: background, paddingLeft: "10%", paddingRight: "10%"}}
        >
            <Toolbar disableGutters>
                <Box component={Link} to="/" sx={{
                    textDecoration: "none",
                    color: "inherit",
                    minWidth: "260",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.33s ease-in-out",
                    ":hover": {
                        transform: "scale(1.01) rotate(2deg)"
                    }
                }}>
                    <SetMealRoundedIcon fontSize="large" edge="start" />
                    <Typography
                        variant="h4"
                        noWrap
                        sx={{
                            marginRight: 4,
                            display: { xs: "none", md: "flex" },
                            fontFamily: "Roboto Mono, monospace",
                            fontWeight: 700,
                            letterSpacing: ".2rem",
                            color: "inherit",
                            textDecoration: "none",
                            marginLeft: 2
                        }}
                    >
                        FIVE GUYS
                    </Typography>
                </Box>
                { token == null &&
                    <Button color="inherit" component={Link} to="/auth/login" size="large" sx={{ fontWeight: 600, mr: 1 }}>Login</Button>
                }
                { token != null &&
                    <Button color="inherit" onClick={handleOpenDialog} size="large" sx={{ fontWeight: 600, mr: 1 }}>Logout</Button>
                }
                <Button color="inherit" component={Link} to="/browse/eateries" size="large" sx={{ fontWeight: 600 }}>Eateries</Button>
                { token != null &&
                    <Button color="inherit" component={Link} to={ isDiner ? "/diner/dashboard" : "/eatery/dashboard"} size="large" sx={{ fontWeight: 600, ml: 1 }}>Dashboard</Button>
                }
                <Box sx={{ flexGrow: 1 }} />
                { !isLanding && 
                    <IconButton edge="end" size="large" onClick={(e) => {
                        isDarkMode ? setIsDarkMode(false) : setIsDarkMode(true);
                    }} sx={{
                        transition: "all .2s ease-in-out",
                        ":hover": {
                            transform: "scale(1.2)"
                        }
                    }}>
                        { isDarkMode &&
                            <Brightness7Icon />
                        }
                        { !isDarkMode &&
                            <Brightness4Icon sx={{ color: "#c9c9c9" }} />
                        }
                    </IconButton>
                }
            </Toolbar>
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
            >
                <DialogTitle>
                {"Confirmation"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to log out?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>No</Button>
                    <Button onClick={Logout} autoFocus>Yes</Button>
                </DialogActions>
            </Dialog>
        </AppBar>
    );
}
export default Navbar;