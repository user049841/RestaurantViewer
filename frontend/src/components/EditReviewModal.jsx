import { Modal } from 'react-bootstrap';
import { Box, Button, Rating, Stack, TextField } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import React, { useContext, useEffect } from 'react';

import Config from "../config.json";
import { AuthContext, SnackbarContext } from '../App';

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
 * The component for editing review/reply.
 */
/*eslint-disable eqeqeq*/
const EditReviewModal = (review, setLoading, show, setShow) => {
    const { token } = useContext(AuthContext);
    const { setOpen, setMessage, isDarkMode } = useContext(SnackbarContext);
    const [rating, setRating] = React.useState(-1);
    const [hover, setHover] = React.useState(-1);
    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [text, setText] = React.useState("Review");

    useEffect(() => {
        setRating(review["review"]["rating"]);
        setTitle(review["review"]["title"]);
        setDescription(review["review"]["description"]);
        setText(review["isReply"] ? "Reply" : "Review");
    }, [review]);

    const handleClose = () => setShow(false);

    const Submit = async (form) => {
        let request = {
            method: "PUT",
            body: JSON.stringify({
                "id": review["review"]["id"],
                "token": token,
                "rating": review["isReply"] ? null : form.rating.value,
                "title": review["isReply"] ? null: form.title.value,
                "description": form.description.value
            }),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/review/edit`, request);
        const data = await response.json();
        if (response.status === 200) {
            setMessage(`Edited ${text} successfully`);
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
        <Modal show={show} onHide={handleClose} contentClassName={isDarkMode ? "darkMode" : "lightMode"}>
            <Modal.Header>
                <Modal.Title>Edit Your {text}</Modal.Title>
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
                            alignSelf: "start",
                            marginLeft: "25%",
                        }}
                    >
                        { review["isReply"] == false &&
                            <>
                                <Rating
                                    name="rating"
                                    value={rating ? rating : 0}
                                    getLabelText={getLabelText}
                                    precision={0.5}
                                    size="large"
                                    onChange={(event, newRating) => {
                                        event.preventDefault();
                                        setRating(newRating);
                                    }}
                                    onChangeActive={(event, newHover) => {
                                        event.preventDefault();
                                        setHover(newHover);
                                    }}
                                    emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                                />
                                {rating !== null && (
                                    <Box sx={{ ml: 2, marginTop: "3%" }}>{labels[hover !== -1 ? hover : rating]}</Box>
                                )}
                            </>
                        }
                    </Box>
                    { review["isReply"] == false &&
                        <TextField
                            name="title"
                            label="Review Title"
                            size="small"
                            value={title}
                            onChange={(event) => {
                                setTitle(event.target.value);
                            }}
                        />
                    }
                    <TextField
                        name="description"
                        label={`${text} Description`}
                        size="small"
                        multiline
                        minRows={4}
                        value={description}
                        onChange={(event) => {
                            setDescription(event.target.value);
                        }}
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
                    }}>Confirm</Button>
                    </Stack>
                </Stack>
            </Modal.Body>
        </Modal>
    )
}

export default EditReviewModal;