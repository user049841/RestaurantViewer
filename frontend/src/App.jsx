import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import React from 'react';
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CssBaseline, createTheme, ThemeProvider, Snackbar, useMediaQuery } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

import DinerDashboard from './pages/DinerDashboard';
import DinerViewVouchers from './pages/DinerViewVouchers';
import EateryDashboard from './pages/EateryDashboard';
import EateryProfile from './pages/EateryProfile';
import EateryProfileList from './pages/EateryProfileList';
import EateryViewVouchers from './pages/EateryViewVouchers';
import EditDinerProfile from './pages/EditDinerProfile';
import EditEateryProfile from './pages/EditEateryProfile';
import EditMenu from './pages/EditMenu';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import RegisterEatery from './pages/RegisterEatery';
import RegisterDiner from './pages/RegisterDiner';
import ResetPassword from './pages/ResetPassword';
import EateryLoyaltySystem from './pages/EateryLoyaltySystem';

export const AuthContext = React.createContext();
export const SnackbarContext = React.createContext();

const App = () => {
    const [token, setToken] = React.useState();
    const [userId, setUserId] = React.useState();
    const [isDiner, setIsDiner] = React.useState(false);
    const [location, setLocation] = React.useState({ "latitude": null, "longitude": null });
    const [open, setOpen] = React.useState(false);
    const [message, setMessage] = React.useState("");

    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const [isDarkMode, setIsDarkMode] = React.useState(prefersDarkMode);

    const theme = React.useMemo(
        () =>
        createTheme({
            palette: {
                mode: isDarkMode ? "dark" : "light",
                primary: {
                    main: isDarkMode ? "#6495ED" : "#0047AB",
                    contrastText: "#FFFFFF",
                }
            }
        }),
        [isDarkMode],
    );

    const HandleClose = () => {
        setOpen(false);
    }

    const script = document.createElement("script");
    script.src = "//code.tidio.co/fguhdurc3ybesuslloqgvdgkhbud0ox7.js";
    script.async = true;
    document.body.appendChild(script);

    useEffect(() => {
        // Sets user location, used for location-related functionality.
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(success, error);
          } else {
            setMessage("Geolocation is not permitted by your browser, which may impact your experience. Check your browser permissions.");
            setOpen(true);
          }

          function success(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            setLocation({"latitude": latitude, "longitude": longitude});
          }

          function error() {
            setMessage("Unable to retrieve your location.");
            setOpen(true);
          }

    }, [setMessage, setOpen]);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                    <AuthContext.Provider value={{token, setToken, userId, setUserId, isDiner, setIsDiner, location, setLocation}}>
                        <SnackbarContext.Provider value={{setOpen, setMessage, isDarkMode, setIsDarkMode}}>
                            <div className="App">
                                <Navbar />
                                <Routes>
                                    <Route exact path="/auth/register/diner" element={<RegisterDiner />} />
                                    <Route exact path="/auth/register/eatery" element={<RegisterEatery />}/>
                                    <Route exact path="/auth/reset" element={<ResetPassword />} />
                                    <Route exact path="/auth/login" element={<Login />} />
                                    <Route exact path="/diner/dashboard" element={<DinerDashboard />} />
                                    <Route exact path="/diner/dashboard/vouchers" element={<DinerViewVouchers />} />
                                    <Route exact path="/diner/dashboard/profile" element={<EditDinerProfile />}/>
                                    <Route exact path="/eatery/dashboard" element={<EateryDashboard />} />
                                    <Route exact path="/eatery/dashboard/profile" element={<EditEateryProfile />}/>
                                    <Route exact path="/eatery/dashboard/loyalty" element={<EateryLoyaltySystem />}/>
                                    <Route exact path="/eatery/dashboard/menu" element={<EditMenu />}/>
                                    <Route exact path="/eatery/dashboard/vouchers" element={<EateryViewVouchers />}/>
                                    <Route exact path="/browse/eateries" element={<EateryProfileList />} />
                                    <Route path="/browse/eateries/:id" element={<EateryProfile />} />
                                    <Route exact path="/" element={<Landing />} />
                                </Routes>
                                <Snackbar
                                    open={open}
                                    autoHideDuration={2500}
                                    message={message}
                                    onClose={HandleClose}
                                />
                            </div>
                        </SnackbarContext.Provider>
                    </AuthContext.Provider>
                </BrowserRouter>
            </ThemeProvider>
        </LocalizationProvider>
    )
}

export default App;
