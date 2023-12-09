import React from 'react';
import { Button, CircularProgress, Stack, TextField } from '@mui/material';
import { useContext, useState } from 'react';
import { SnackbarContext } from '../App';
import { PageContext } from '../pages/ResetPassword';

import Config from "../config.json";

/**
 * The reset password email form. When submitted, checks if an existing user is connected to that email.
 * If so, sends email with reset code to that email, and transitions to the code form.
 */
/*eslint-disable eqeqeq*/
const ResetPasswordEmailForm = () => {
    const { setStep } = useContext(PageContext);
    const { setOpen, setMessage } = useContext(SnackbarContext);
    const [loading, setLoading] = useState(false);

    /**
     * Sends the information in the form to the backend.
     */
    const Submit = async (form) => {
        setLoading(true);
        let request = {
            method: "POST",
            body: JSON.stringify({"email": form.email.value}),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/auth/reset/email`, request);
        const data = await response.json();
        if (response.status === 200) {
            setMessage("If your email is associated with a Five Guys account, we've sent you an email! Check your inbox");
            setOpen(true);
            setStep(1);
        }
        else {
            setMessage(data["message"]);
            setOpen(true);
        }
        setLoading(false);
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
                name="email"
                label="Email"
                size="small"
            />
            { loading == true && <CircularProgress />}
            { loading == false && 
                <Button variant="contained" size="large" onClick={(event) => {
                    event.preventDefault();
                    Submit(event.currentTarget.parentNode.elements);
                }} style={{
                    marginTop: "2%",
                    marginBottom: "3%"
                }}>Send Reset Code</Button>
            }
        </Stack>
    )
}

export default ResetPasswordEmailForm;