import { Modal } from 'react-bootstrap';
import { Button, Stack, TextField } from '@mui/material';
import React, { useState, useContext } from 'react';

import Config from "../config.json";
import { AuthContext, SnackbarContext } from '../App';

/**
 * The modal component for resetting the password of a logged in user.
 */
const ResetAccountPasswordModal = () => {
    const { token } = useContext(AuthContext);
    const { setOpen, setMessage, isDarkMode } = useContext(SnackbarContext);
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const Submit = async (form) => {
        if (form.newPassword.value !== form.confNewPassword.value) {
            setMessage("Passwords do not match");
            setOpen(true);
            return;
        }

        let request = {
            method: "POST",
            body: JSON.stringify({"token": token, "current_password": form.currPassword.value,"new_password": form.newPassword.value}),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/auth/update/password`, request);
        const data = await response.json();
        if (response.status === 200) {
            setMessage("Reset password succesfully");
            setOpen(true);
            handleClose();
        }
        else {
            setMessage(data["message"]);
            setOpen(true);
        }
    }

    return (
        <>
            <Button variant="contained" size="large" onClick={handleShow}>Reset Password</Button>
            <Modal size="lg" show={show} onHide={handleClose} contentClassName={isDarkMode ? "darkMode" : "lightMode"}>
                <Modal.Header>
                    <Modal.Title>Reset Password</Modal.Title>
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
                            '& .MuiTextField-root':  { width: '30ch' },
                        }}
                    >
                        <TextField
                            name="currPassword"
                            label="Current Password"
                            type="password"
                            size="small"
                        />
                        <TextField
                            name="newPassword"
                            label="New Password"
                            type="password"
                            size="small"
                        />
                        <TextField
                            name="confNewPassword"
                            label="Confirm New Password"
                            type="password"
                            size="small"
                        />
                        <Stack
                            direction="row"
                            spacing={2}
                            style={{
                                marginTop: "4%",
                                marginBottom: "2%"
                            }}
                        >
                            <Button variant="outlined" onClick={handleClose}>Close</Button>
                            <Button variant="contained" size="large" onClick={(event) => {
                                event.preventDefault();
                                Submit(event.currentTarget.parentNode.parentNode.elements);
                            }}>Reset Password</Button>
                        </Stack>
                    </Stack>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default ResetAccountPasswordModal;