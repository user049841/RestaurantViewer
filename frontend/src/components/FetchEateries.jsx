import React from 'react';
import { useContext, useEffect, useState } from 'react';
import { Box, Container, Button, Card, Chip, CardHeader, CardMedia, CircularProgress, Grid, Rating, Stack } from '@mui/material';
import DiscountIcon from '@mui/icons-material/Discount';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useNavigate } from "react-router-dom";

import { AuthContext, SnackbarContext } from '../App';
import { EateryContext } from '../pages/EateryProfileList';
import Config from "../config.json";

/**
 * The component for an individual eatery card.
 */
/*eslint-disable eqeqeq*/
const EateryCard = (eatery, navigate) => {
    const handleNavigate = (event) => {
        event.preventDefault();
        navigate(`/browse/eateries/${eatery["id"]}`)
    }

    return (
        <Card sx={{
            textOverflow: "ellipsis",
            height: "100%",
            cursor: "pointer",
            transition: "all .1s ease-in-out",
            ":hover": {
                transform: "scale(1.005)"
            }
        }}
            onClick={handleNavigate}
        >
            <CardMedia
                component="img"
                height="150"
                image={eatery.images && eatery["images"].length > 0 ? eatery["images"][0] : "/images/default-eatery-pic.png"}
                alt="eatery-display-image"
            />
            <CardHeader
                title={
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        style={{ marginLeft: "1%", marginBottom: "2%" }}
                    >
                        <Container style={{ textAlign: "left", padding: 0 }}>
                            <b style={{ marginRight: "5%"}}>{eatery["name"]}</b>
                            { (eatery["num_vouchers"] > 0) &&
                                <Button
                                    variant="contained"
                                    color="info"
                                    size="small"
                                    style={{
                                        fontSize: "10px",
                                        backgroundColor: "#178a45"
                                    }}
                                    startIcon={<DiscountIcon />}
                                >{`${eatery["num_vouchers"]} left`}</Button>
                            }
                        </Container>
                        <i style={{
                            color: "gray", marginLeft: "2%"
                        }}>{eatery["pricing"]}</i>
                    </Stack>
                }
                subheader={
                    <>
                        {eatery["num_reviews"] > 0 && 
                            <Box style={{ display: "flex", "margin": 0 }}>
                                <Rating style={{ marginBottom: "2%" }} value={eatery["rating"]} precision={0.5} readOnly size="small" />
                                {`(${eatery["num_reviews"]})`}
                            </Box>
                        }
                        <LocationOnIcon fontSize="small" style={{
                            marginRight: "2%"
                        }}/>
                        <span>{eatery["address"]}</span>
                        <br />
                        {eatery["tags"] && eatery["tags"].slice(0, 3).map((tag, index) =>
                            <Chip label={tag} sx={{margin: "5px 5px 5px 0px"}} size="small" key={index} />
                        )}
                    </>
                }
                titleTypographyProps={{
                    fontSize: "18px"
                }}
                subheaderTypographyProps={{
                    textAlign: "left",
                    fontSize: "12px"
                }}
            />
        </Card>
    )
}

/**
 * The component for browsing eateries. Returns a list of eateries.
 */
const FetchEateries = () => {
    const [loading, setLoading] = useState(true);
    const { setEateries, showEateries, setShowEateries, page} = useContext(EateryContext);
    const { location } = useContext(AuthContext);
    const { setOpen, setMessage } = useContext(SnackbarContext);

    const navigate = useNavigate();
    useEffect(() => {
        if (!loading) {
            return;
        }
        const Fetch = async () => {
            let request = {
                method: "POST",
                body: JSON.stringify({"latitude": location["latitude"], "longitude": location["longitude"] }),
                headers: {
                    "Content-Type": "application/json"
                }
            }
            let response = await fetch(`http://${Config.BACKEND_SERVER}/browse/eateries`, request);
            let data = await response.json();
            if (response.status === 200) {
                setEateries(data);
                setShowEateries(data);
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
            setLoading(false);
        }
        Fetch()
    }, [setEateries, setShowEateries, loading, setMessage, location, setOpen]);

    return (
        <>
            { loading == true && <CircularProgress style={{
                 margin: 0,
                 position: "absolute",
                 top: "50%",
                 left: "50%",
                 transform: "translateY(-50%), translateX(-50%)"
            }}/>}
            { loading == false &&
                <Grid container spacing={2}>
                    {showEateries.slice((page - 1) * 12, (page - 1) * 12 + 12).map((eatery) =>
                        <Grid item key={eatery["id"]} xs={6} md={3} lg={2}>
                            {EateryCard(eatery, navigate)}
                        </Grid>
                    )}
                    {showEateries.length === 0 && <p style={{
                        margin: "auto",
                        width: "50%"
                    }}>There are no eateries currently matching this search.</p>}
                </Grid>
            }
        </>
    )
}

export default FetchEateries;