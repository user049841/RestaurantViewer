import React from 'react';
import { useParams } from 'react-router-dom';
import { Link } from "react-router-dom";
import { useContext, useState, useEffect } from 'react';
import { Button, Box, Card, CardActions, CardMedia, CardContent, Divider, Grid, Tooltip, Typography, Stepper, Step, StepLabel } from "@mui/material";
import Carousel from 'react-bootstrap/Carousel';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { AuthContext, SnackbarContext } from '../App';
import Config from "../config.json";
import FetchReviews from '../components/FetchReviews';
import MenuModal from '../components/MenuModal';
import ObtainVoucherModal from '../components/ObtainVoucherModal';

export const EateryContext = React.createContext();
export const PointsContext = React.createContext();

/**
 * The component to display basic information about a single voucher. When clicked, opens a modal to redeem it.
 */
const VoucherItem = (voucher, setCurrentVoucher, setShowVoucherModal, token) => {
    return (
        <Card elevation={4} sx={{
            paddingTop: "5%",
            paddingBottom: "5%",
            cursor: "pointer",
            transition: "all .2s ease-in-out",
            ":hover": {
                transform: "scale(1.1)"
            }
        }} onClick={(e) => {
            e.preventDefault();
            setCurrentVoucher(voucher);
            setShowVoucherModal(true);
        }}>
            <CardContent>
                <Typography className={voucher["num_vouchers"] < 100 ? "warningBlink" : "noBlink"} sx={{ fontSize: "18px" }} gutterBottom>
                    <b>{`${voucher["num_vouchers"]} remaining`}</b>
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: "600", marginBottom: 1, marginTop: 2, }}>
                    {`${voucher["discount"]}% off`}
                </Typography>
                <Typography variant="h6" sx={{ marginBottom: 0 }} color="text.secondary">
                    {voucher["name"]}
                </Typography>
            </CardContent>
            <CardActions sx={{ display: "flex", justifyContent: "center" }}>
                <Button size="small" color="warning">{`Ends on ${voucher["end"]}`}</Button>
            </CardActions>
        </Card>
    )
}

/**
 * The page for a single eatery. Displays all information pertaining to a single eatery.
 */
const EateryProfile = () => {
    const { id } = useParams();
    const [eatery, setEatery] = useState({});
    const [eateryLoading, setEateryLoading] = useState(true);
    const [showMap, setShowMap] = useState(false);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [currentVoucher, setCurrentVoucher] = useState({});
    const [points, setPoints] = useState(0);
    const [loyalty, setLoyalty] = useState([0, false, "fetching", "fetching", "fetching", "fetching"]);
    const { setOpen, setMessage, isDarkMode } = useContext(SnackbarContext);
    const { location, token, isDiner, userId } = useContext(AuthContext);

    useEffect(() => {
        if (!eateryLoading) {
            return;
        }
        const Fetch = async () => {
            let request = {
                method: "POST",
                body: JSON.stringify({"id": id, "latitude": location["latitude"], "longitude": location["longitude"] }),
                headers: {
                    "Content-Type": "application/json"
                }
            }
            const response = await fetch(`http://${Config.BACKEND_SERVER}/browse/eatery`, request);
            const data = await response.json();
            if (response.status === 200) {
                setEatery(data["eatery"]);
                setLoyalty(data["eatery"]["loyalty_system"]);
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
            setEateryLoading(false);
        }
        Fetch()
    }, [id, location, setMessage, setOpen, eateryLoading]);

    useEffect(() => {
        const Fetch = async () => {
            let request = {
                method: "GET",
            }
            const response = await fetch(`http://${Config.BACKEND_SERVER}/user/profile/diner/${userId}`, request);
            const data = await response.json();
            if (response.status === 200) {
                if (id.toString() in data["diner"]["points"]) {
                    setPoints(data["diner"]["points"][id.toString()])
                }
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
        }
        if (isDiner) {
            Fetch()
        }
    }, [id, userId, setMessage, setOpen, isDiner]);

    const BlackList = async () => {
        let request = {
            method: "POST",
            body: JSON.stringify({
                "token": token,
                "id": id
            }),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/blacklist/eatery`, request);
        const data = await response.json();
        if (response.status === 200) {
            setMessage("This eatery will not be recommended to you anymore");
            setOpen(true);
        }
        else {
            setMessage(data["message"]);
            setOpen(true);
        }
    }

    const Redeem = async () => {
        let request = {
            method: "POST",
            body: JSON.stringify({
                "token": token,
                "eatery_id": id
            }),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/diner/loyalty/obtain`, request);
        const data = await response.json();
        if (response.status === 200) {
            setMessage("Redeemed loyalty reward successfully. View reward in dashboard");
            setPoints(0);
            setOpen(true);
        }
        else {
            setMessage(data["message"]);
            setOpen(true);
        }
    }

    const getDiff = (a, b) => {
        return b - a
    }

    return (
        <PointsContext.Provider value={{loyalty, points, setPoints}}>
            <div style={{ width:"60%", margin:"3% auto 0 auto" }}>
                <Button sx={{ float: "left"}} component={Link} to="/browse/eateries">Back</Button>
                {isDiner && <Button sx={{ float: "right"}} onClick={BlackList}>Don't Recommend</Button>}
                <br />
                {eatery["images"] && eatery["images"].length > 0 && <Carousel style={{ margin:"auto"}} variant={isDarkMode ? "light" : "dark"}>
                    {eatery["images"].map(image =>
                        <Carousel.Item key={eatery["images"].indexOf(image) + 1}>
                            <img src = {image} alt = {image} style={{height: "350px"}}/>
                        </Carousel.Item>
                    )}
                </Carousel>}
                <br />
                <Card variant="outlined" sx={{ width: "100%", margin:"auto", padding:"2%" }}>
                    <Box sx={{display: 'flex'}}>
                        <CardMedia
                            component="img"
                            sx={{ width: "15%", height: "15%", marginRight: "2%" }}
                            image={eatery["avatar"]}
                            alt="Avatar"
                        />
                        <CardContent sx={{width: "80%", textAlign:"left", paddingTop: "0"}}>
                            <h1>{eatery["name"]}</h1>
                            <Divider textAlign="left" sx={{ bgcolor: "grey", margin:"15px 0 15px 0" }} />
                            <p><b>CONTACT US: {eatery["phone_number"]}</b></p>
                            <p>{eatery["description"]}</p>
                        </CardContent>
                    </Box>
                </Card>
                {(eatery["vouchers"] !== undefined && eatery["vouchers"].length > 0) &&
                    <h3 style={{ textAlign: "left", marginTop: "2%" }}>Vouchers</h3>
                }
                <Grid container spacing={2} sx={{
                    marginTop: "1%"
                }}>
                    {eatery["vouchers"] !== undefined && eatery["vouchers"].map((voucher) =>
                    <Grid item key={voucher["id"]} xs={6} md={3} lg={2}>
                        {VoucherItem(voucher, setCurrentVoucher, setShowVoucherModal, token)}
                    </Grid>)
                    }
                </Grid>
                <ObtainVoucherModal voucher={currentVoucher} show={showVoucherModal} setShow={setShowVoucherModal} />
                <Divider sx={{ width:"100%", bgcolor: "grey", marginTop: "2%", marginBottom: "20px" }} />
                {isDiner && loyalty[1] && 
                    <>
                        <Box sx={{ padding: "2%", backgroundColor: isDarkMode ? "#474747" : "#dce0dd"}}>
                            <h3 style={{ textAlign: "left" }}>Loyalty Rewards</h3>
                            <Box sx={{ width: '100%', marginBottom: "3.5%", textAlign: "left" }}>
                                <Box sx={{ marginBottom: "3.5%" }}>
                                    <h6>Make {loyalty[4]} bookings and redeem a {loyalty[2] === "freeItem" ? "free item" : "buy one get one free"} voucher for {loyalty[3]} from {eatery["name"]}!</h6>
                                    <p>{loyalty[5]}</p>
                                </Box>
                                <Tooltip title="You can earn loyalty points for an eatery by redeeming vouchers, or posting your first review!">
                                    <Stepper activeStep={points} alternativeLabel>
                                        {[...Array(loyalty[4])].map((label) => (
                                        <Step key={label}>
                                            <StepLabel/>
                                        </Step>
                                        ))}
                                    </Stepper>
                                </Tooltip>
                            </Box>
                            <Button variant="contained" disabled={points < loyalty[4]} onClick={(event) => {
                                event.preventDefault();
                                Redeem();
                            }}>
                                {loyalty[4] <= points  ? "Redeem" : `${getDiff(points, loyalty[4])} more points to redeem your reward`}
                            </Button>
                        </Box>
                        <Divider sx={{ width:"100%", bgcolor: "grey", marginTop: "2%", marginBottom: "20px" }} />
                    </>
                }
                <Box sx={{ margin: 'auto'}}>
                    <Grid container direction="row" justifyContent="space-between">
                        <Grid item sx={{
                            width:"49%",
                            margin:"5px 0 5px 0",
                            cursor: "pointer",
                            transition: "all .1s ease-in-out",
                            ":hover": {
                                transform: "scale(1.02)"
                            }
                        }}>
                            <MenuModal id={id}/>
                        </Grid>
                        <Grid item sx={{
                            width:"49%",
                            margin:"5px 0 5px 0",
                            cursor: "pointer",
                            transition: "all .1s ease-in-out",
                            ":hover": {
                                transform: "scale(1.01)"
                            }
                        }}>
                            <Card variant="outlined" sx={{ margin:"auto", height:"100px"}} onClick={(e)=> 
                                { showMap ? setShowMap(false) : setShowMap(true) }
                            }>
                                <div style={{ marginTop: "5px" }}>
                                    <LocationOnIcon sx={{ fontSize: '50px' }}/>
                                </div>
                                <Button variant="filled" size="small">Find on map</Button>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
                { showMap &&
                    <>
                        <Divider sx={{ width:"100%", bgcolor: "grey", marginTop: "25px", marginBottom: "20px" }} />
                        <iframe
                            title="myiframe"
                            src={"https://www.google.com/maps?q=" + eatery["latitude"] + "," + eatery["longitude"] + "&hl=es;z%3D14&amp&output=embed"}
                            width="600"
                            height="450"
                            style={{ border: "0" }}
                            allowFullScreen={false}
                            loading="eager"
                        ></iframe>
                    </>
                }
                <Divider sx={{ width:"100%", bgcolor: "grey", marginTop: "25px", marginBottom: "20px" }} />
                <EateryContext.Provider value={{eatery, eateryLoading}}>
                    <FetchReviews />
                </EateryContext.Provider>
            </div>
        </PointsContext.Provider>
    )
}

export default EateryProfile