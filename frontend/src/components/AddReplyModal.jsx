import { Modal } from 'react-bootstrap';
import { Button, Stack, TextField } from '@mui/material';
import React, { useContext } from 'react';

import Config from "../config.json";
import { AuthContext, SnackbarContext } from '../App';
import { EateryContext } from '../pages/EateryProfile';

/**
 * The component for creating a reply.
 */
const AddReplyModal = (review, setLoading, show, setShow) => {
    const { token } = useContext(AuthContext);
    const { setOpen, setMessage, isDarkMode } = useContext(SnackbarContext);
    const { eatery } = useContext(EateryContext);

    const handleClose = () => setShow(false);

    const Submit = async (form) => {
        let request = {
            method: "POST",
            body: JSON.stringify({
                "token": token,
                "description": form.description.value,
                "review_id": review["review"]["id"],
                "eatery_id": eatery["id"],
                "date": (new Date()).toUTCString()
            }),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/review/reply/create`, request);
        const data = await response.json();
        if (response.status === 200) {
            setMessage("Created reply successfully");
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
                <Modal.Title>Add New Reply</Modal.Title>
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
                    <TextField
                        name="description"
                        label="Your Reply"
                        size="small"
                        multiline
                        minRows={4}
                    />
                    <Stack
                        direction="row"
                        spacing={2}
                    >
                    <Button onClick={handleClose}>Close</Button>
                    <Button variant="contained" size="large" onClick={(event) => {
                            event.preventDefault();
                            Submit(event.currentTarget.parentNode.parentNode.elements);
                        }} style={{
                            marginTop: "2%",
                            marginBottom: "3%"
                        }}>Reply</Button>
                    </Stack>
                </Stack>
            </Modal.Body>
        </Modal>
    )
}

export default AddReplyModal;