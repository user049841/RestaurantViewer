import React from 'react';
import { Button, Chip, Divider, FormHelperText, Stack, TextField } from '@mui/material';
import FaceIcon from '@mui/icons-material/Face';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useContext } from 'react';
import { Link, useNavigate } from "react-router-dom";

import { AuthContext, SnackbarContext } from '../App';
import Config from "../config.json";

/**
 * The login page. When valid credentials are submitted into the form, authenticate the user and redirect to the dashboard page.
 */
/*eslint-disable eqeqeq*/
const Login = () => {
    const navigate = useNavigate();
    const { setToken, setUserId, setIsDiner } = useContext(AuthContext);
    const { setOpen, setMessage } = useContext(SnackbarContext);

    /**
     * Sends the information in the form to the backend.
     */
    const Submit = async (form) => {
        let request = {
            method: "POST",
            body: JSON.stringify({"email": form.email.value, "password": form.password.value}),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/auth/login`, request);
        const data = await response.json();
        if (response.status === 200) {
            setMessage("Login successful");
            setOpen(true);
            setToken(data["token"]);
            setUserId(data["user_id"]);
            setIsDiner(data["is_diner"]);
            if (data["is_diner"] == true) {
                navigate("/diner/dashboard");
            }
            else {
                navigate("/eatery/dashboard");
            }
        }
        else {
            setMessage(data["message"]);
            setOpen(true);
        }
    };

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
            <h1>Login</h1>
            <TextField
                name="email"
                label="Email"
                size="small"
            />
            <TextField
                name="password"
                label="Password"
                type="password"
                size="small"
                helperText={<FormHelperText component={Link} to="/auth/reset">Forgot Your Password?</FormHelperText>}
            />
            <Button variant="contained" size="large" onClick={(event) => {
                event.preventDefault();
                Submit(event.currentTarget.parentNode.elements);
            }} style={{
                marginTop: "2%",
                marginBottom: "3%"
            }}>Submit</Button>
            <h5>Don't have an account yet?</h5>
            <Stack
                direction="row"
                spacing={2}
            >
                <Chip icon={<FaceIcon />} component={Link} to="/auth/register/diner" label="Sign up as a diner" variant="outlined" onClick={() => {return true}}/>
                <Divider orientation="vertical" variant="middle" flexItem />
                <Chip icon={<RestaurantIcon />} component={Link} to="/auth/register/eatery" label="Sign up as an eatery" variant="outlined" onClick={() => {return true}}/>
            </Stack>
        </Stack>
    )
}

export default Login;