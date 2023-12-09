import React from 'react';
import { Button, Stack, TextField } from '@mui/material';
import { useContext } from 'react';
import { useNavigate } from "react-router-dom";
import { SnackbarContext } from '../App';
import { PageContext } from '../pages/ResetPassword';

import Config from "../config.json";

/**
 * The component for entering the email code and finalising a password reset.
 */
const ResetPasswordCodeForm = () => {
    const navigate = useNavigate();
    const { setStep } = useContext(PageContext);
    const { setOpen, setMessage } = useContext(SnackbarContext);

    /**
     * Sends the information in the form to the backend.
     */
    const Submit = async (form) => {
        let request = {
            method: "POST",
            body: JSON.stringify({"code": form.code.value, "password": form.password.value}),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/auth/reset/code`, request);
        const data = await response.json();
        if (response.status === 200) {
            setMessage("Reset password succesfully");
            setOpen(true);
            setStep(0);
            navigate("/auth/login");
        }
        else {
            setMessage(data["message"]);
            setOpen(true);
        }
    }

    return (
        <Stack
            component="form"
            direction="column"
            justifyContent="flex-start"
            alignItems="center"
            spacing={3}
            style={{
                marginTop: "5%"
            }}
            sx={{
                '& .MuiTextField-root':  { width: '30ch' },
            }}
        >
            <h1>Reset Password</h1>
            <TextField
                name="code"
                label="Reset Code"
                size="small"
            />
            <TextField
                name="password"
                label="New Password"
                type="password"
                size="small"
            />
            <Button variant="contained" size="large" onClick={(event) => {
                event.preventDefault();
                Submit(event.currentTarget.parentNode.elements);
            }} style={{
                marginTop: "2%",
                marginBottom: "3%"
            }}>Reset Password</Button>
        </Stack>
    )
}

export default ResetPasswordCodeForm;