import React from 'react';
import { Button, Stack, TextField } from '@mui/material';
import { useContext } from 'react';
import { Link, useNavigate } from "react-router-dom";

import { AuthContext, SnackbarContext } from '../App';
import Config from "../config.json";

/**
 * The diner register page. When valid details are submitted, authenticate the user and redirect to the dashboard page.
 */
const RegisterDiner = () => {
    const navigate = useNavigate();
    const { setToken, setUserId, setIsDiner } = useContext(AuthContext);
    const { setOpen, setMessage } = useContext(SnackbarContext);

    /**
     * Sends the information in the form to the backend.
     */
    const Submit = async (form) => {
        if (form.password.value !== form.confirmPassword.value) {
            setMessage("Passwords do not match");
            setOpen(true);
            return;
        }
        let request = {
            method: "POST",
            body: JSON.stringify({"email": form.email.value, "password": form.password.value, "name": form.name.value}),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/auth/register/diner`, request);
        const data = await response.json();
        if (response.status === 200) {
            setMessage("Registration successful");
            setOpen(true);
            setToken(data["token"]);
            setUserId(data["user_id"]);
            setIsDiner(true);
            navigate("/diner/dashboard");
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
            <h1>Register as a Diner</h1>
            <TextField
                name="email"
                label="Email"
                size="small"
            />
            <TextField
                name="name"
                label="Username"
                size="small"
            />
            <TextField
                name="password"
                label="Password"
                type="password"
                size="small"
            />
            <TextField
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                size="small"
            />
            <Stack
                direction="row"
                spacing={2}
            >
                <Button variant="outlined" size="large" component={Link} to="/auth/login" style={{
                    marginTop: "3%"
                }}>Back to Login</Button>
                <Button variant="contained" size="large" onClick={(event) => {
                    event.preventDefault();
                    Submit(event.currentTarget.parentNode.parentNode.elements);
                }} style={{
                    marginTop: "3%"
                }}>Create Account</Button>
            </Stack>

        </Stack>
    )
}

export default RegisterDiner;