import React from 'react';
import { Button, Stack, TextField, Divider } from '@mui/material';
import { useContext, useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useRef } from 'react';
import fileToDataUrl from '../helpers';

import { AuthContext, SnackbarContext } from '../App';
import Config from "../config.json";

/**
 * The edit diner profile page. Redirects from the diner dashboard, and allows diner users to set all profile details.
 */
/*eslint-disable eqeqeq*/
const EditDinerProfile = () => {
    const { setOpen, setMessage } = useContext(SnackbarContext);
    const { userId } = useContext(AuthContext);

    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [avatar, setAvatar] = useState("");

    const ref = useRef(null);

    useEffect(() => {
        const Fetch = async () => {
            let request = {
                method: "GET",
            }
            const response = await fetch(`http://${Config.BACKEND_SERVER}/user/profile/diner/${userId}`, request);
            const data = await response.json();
            if (response.status === 200) {
                setEmail(data["diner"]["email"]);
                setName(data["diner"]["name"]);
                setAvatar(data["diner"]["avatar"] == undefined ? "" : data["diner"]["avatar"]);
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
        }
        Fetch()
    }, [userId, setMessage, setOpen]);

    const Submit = async (form) => {
        let request = {
            method: "PUT",
            body: JSON.stringify({
                "email": form.email.value,
                "name": form.name.value,
                "avatar": avatar,
            }),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/user/profile/diner/edit/${userId}`, request);
        const data = await response.json();
        if (response.status === 200) {
            setMessage("Changes saved");
            setOpen(true);
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
                marginTop: "3%"
            }}
            sx={{
                '& .MuiTextField-root':  { width: '30ch' },
            }}
        >
            <h1>Edit Diner Profile</h1>
            <h5>Your Avatar</h5>
            <input type="file" name="avatar" accept="image/*" style={{width:"300px"}} onChange={(event) => {
                event.preventDefault();
                if (event.currentTarget.files && event.currentTarget.files[0]) {
                    fileToDataUrl(event.currentTarget.files[0]).then(url => {
                        ref.current.setAttribute("src", url);
                        setAvatar(url);
                    })
                }
            }} className="form-control"></input>
            <img ref={ref} src={avatar} alt="preview" style={{width:"120x", height:"120px"}}/>
            <Divider sx={{ width:"30%", bgcolor: "grey"}} />
            <h5>Your Details</h5>
            <TextField
                value={email}
                onChange={e => setEmail(e.target.value)}
                name="email"
                label="Email"
                size="small"
            />
            <TextField
                value={name}
                onChange={e => setName(e.target.value)}
                name="name"
                label="Diner Name"
                size="small"
            />
            <Stack
                direction="row"
                spacing={2}
            >
                <Button variant="outlined" size="large" component={Link} to="/diner/dashboard" style={{
                    marginTop: "3%"
                }}>Back</Button>
                <Button variant="contained" size="large" onClick={(event) => {
                    event.preventDefault();
                    Submit(event.currentTarget.parentNode.parentNode.elements);
                }} style={{
                    marginTop: "3%"
                }}>Save changes</Button>
            </Stack>
        </Stack>
    )
}

export default EditDinerProfile;