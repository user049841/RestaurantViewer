import { Modal } from 'react-bootstrap';
import { Box, Button, Rating, Stack, TextField } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import React, { useContext, useState } from 'react';

import Config from "../config.json";
import { AuthContext, SnackbarContext } from '../App';
import { EateryContext } from '../pages/EateryProfile';

const labels = {
    0.5: 'Very Awful',
    1: 'Awful',
    1.5: 'Poor',
    2: 'Underwhelming',
    2.5: 'Ok',
    3: 'Decent',
    3.5: 'Good',
    4: 'Amazing',
    4.5: 'Excellent',
    5: 'Outstanding',
  };

function getLabelText(value) {
    return `${value} Star${value !== 1 ? 's' : ''}, ${labels[value]}`;
}

/**
 * The component for creating a review.
 */
/*eslint-disable eqeqeq*/
const AddReviewModal = ({setLoading, points, setPoints, gainPoint, setGainPoint}) => {
    const { token } = useContext(AuthContext);
    const { setOpen, setMessage, isDarkMode} = useContext(SnackbarContext);
    const { eatery } = useContext(EateryContext);
    const [show, setShow] = useState(false);
    const [rating, setRating] = React.useState(2);
    const [hover, setHover] = React.useState(-1);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const Submit = async (form) => {
        let request = {
            method: "POST",
            body: JSON.stringify({
                "token": token,
                "rating": form.rating.value,
                "title": form.title.value,
                "description": form.description.value,
                "eatery_id": eatery["id"],
                "date": (new Date()).toUTCString()
            }),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/review/create`, request);
        const data = await response.json();
        if (response.status === 200) {
            // If the user is a logged in diner user, and this is their first review at the eatery, gain 1 loyalty point.
            if (gainPoint) {
                setPoints(points + 1);
                setGainPoint(false);
                setMessage("Created review successfully, earned 1 loyalty point");
            }
            else {
                setMessage("Created review successfully");
            }
            setOpen(true);
            handleClose();
            setLoading(true);
        }
        else {
            setMessage(data["message"]);
            setOpen(true);
        }
    }

    return (
        <>
            <Button variant="outlined" size="small" onClick={handleShow}>Write a Review</Button>
            <Modal size="lg" show={show} onHide={handleClose} contentClassName={isDarkMode ? "darkMode" : "lightMode"}>
                <Modal.Header>
                    <Modal.Title>Add New Diner Review</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Stack
                        component="form"
                        direction="column"
                        justifyContent="flex-start"
                        alignItems="center"
                        spacing={3}
                        style={{
                            marginTop: "2%",
                            marginBottom: "2%"
                        }}
                        sx={{
                            "& .MuiTextField-root":  { width: "40ch" },
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") { 
                                event.preventDefault();
                                Submit(event.currentTarget.elements);
                            }
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                marginLeft: "35%",
                                alignSelf: "start",
                            }}
                        >
                            <Rating
                                name="rating"
                                value={rating}
                                getLabelText={getLabelText}
                                precision={0.5}
                                size="large"
                                onChange={(event, newRating) => {
                                    setRating(newRating);
                                }}
                                onChangeActive={(event, newHover) => {
                                    setHover(newHover);
                                }}
                                emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                            />
                            {rating !== null && (
                                <Box sx={{ ml: 2, marginTop: "3%" }}>{labels[hover !== -1 ? hover : rating]}</Box>
                            )}
                        </Box>
                        <TextField
                            name="title"
                            label="Review Title"
                            size="small"
                        />
                        <TextField
                            name="description"
                            label="Review Description"
                            size="small"
                            multiline
                            minRows={4}
                        />
                        <Stack
                            direction="row"
                            spacing={2}
                            style={{
                                marginTop: "4%",
                                marginBottom: "2%"
                            }}
                        >
                        <Button onClick={handleClose}>Close</Button>
                        <Button variant="contained" size="large" onClick={(event) => {
                                event.preventDefault();
                                Submit(event.currentTarget.parentNode.parentNode.elements);
                        }}>Create</Button>
                        </Stack>
                        { gainPoint &&
                            <p style={{color: isDarkMode ? "#6495ED" : "#0047AB", marginTop: "3%" }}>You will gain one loyalty point for submitting this review.</p>
                        }
                    </Stack>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default AddReviewModal;