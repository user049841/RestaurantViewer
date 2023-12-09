import React from 'react';
import { Button, Stack, TextField, Autocomplete, Select, MenuItem, FormControl, FormControlLabel, Switch, InputLabel } from '@mui/material';
import { useContext, useState, useEffect } from 'react';
import { Link } from "react-router-dom";

import { AuthContext, SnackbarContext } from '../App';
import Config from "../config.json";

/**
 * Page for editing eatery loyalty system. Allows eatery users to set all loyalty system details and disable/enable system.
 */
const EateryLoyaltySystem = () => {
    const { setOpen, setMessage } = useContext(SnackbarContext);
    const { userId, token, location } = useContext(AuthContext);
    const [enabled, setEnabled] = useState(false);
    const [rewardType, setRewardType] = useState("freeItem");
    const [menuItems, setMenuItems] = useState([])
    const [item, setItem] = useState("");
    const [points, setPoints] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        const Fetch = async () => {
            let request = {
                method: "POST",
                body: JSON.stringify({ "id": userId, "latitude": location["latitude"], "longitude": location["longitude"] }),
                headers: {
                    "Content-Type": "application/json"
                }
            }
            const response = await fetch(`http://${Config.BACKEND_SERVER}/browse/eatery`, request);
            const data = await response.json();
            if (response.status === 200) {
                setEnabled(data["eatery"]["loyalty_system"][1]);
                setRewardType(data["eatery"]["loyalty_system"][2] == null ? "freeItem" : data["eatery"]["loyalty_system"][2]);
                setItem(data["eatery"]["loyalty_system"][3] == null ? "" : data["eatery"]["loyalty_system"][3]);
                setPoints(data["eatery"]["loyalty_system"][4] == null ? 0 : data["eatery"]["loyalty_system"][4]);
                setDescription(data["eatery"]["loyalty_system"][5] == null ? "" : data["eatery"]["loyalty_system"][5]);
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
        }
        Fetch()
    }, [userId, setMessage, setOpen, location]);

    useEffect(() => {
        const Fetch = async () => {
            let request = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }
            const response = await fetch(`http://${Config.BACKEND_SERVER}/browse/eatery/menu/${userId}`, request);
            const data = await response.json();
            if (response.status === 200) {
                let temp = []
                data.forEach((category) => {
                    category["items"].forEach((item) => {
                        temp.push(item["name"]);
                    })
                })
                setMenuItems(temp);
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
        }
        Fetch()
    }, [userId, setMessage, setOpen]);

    const Submit = async (form) => {
        if (!points || points <= 0) {
            setMessage("Points must be an integer value above 0");
            setOpen(true);
            return
        }
        if (!item || !description) {
            setMessage("Please fill in all fields");
            setOpen(true);
            return
        }
        let request = {
            method: "POST",
            body: JSON.stringify({
                "token": token,
                "enabled": enabled,
                "type": rewardType,
                "item": item,
                "pointGoal": points,
                "description": description
            }),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/eatery/loyalty/edit`, request);
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
            <h1>Edit Loyalty System</h1>
            <FormControlLabel control={<Switch checked={enabled} onChange={(event) => setEnabled(event.target.checked) } />} label="Loyalty System Enabled" />
            <FormControl name="rewardType">
            <InputLabel size="small">Reward Type</InputLabel>
                <Select label="Reward Type" size="small" sx={{ width:"30ch", textAlign:"left" }} value={rewardType} onChange={e => setRewardType(e.target.value)}>
                    <MenuItem value={"freeItem"}>Free Item</MenuItem>
                    <MenuItem value={"buyOneGetOneFree"}>Buy One Get One Free</MenuItem>
                </Select>
            </FormControl>
            <Autocomplete
                name="item"
                size="small"
                freeSolo
                options={menuItems}
                filterOptions={(x) => x}
                filterSelectedOptions
                noOptionsText="No menu items"
                value={item}
                onChange={(event, newItem) => {
                    setItem(newItem)
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Reward Item"
                        onChange={e => setItem(e.target.value)}
                    />
                )}
            />
            <TextField
                name="targetPoints"
                label="Points Needed (max 15)"
                size="small"
                type="number"
                value={points}
                onChange={(e) =>
                    {
                        let value = parseInt(e.target.value, 10);
                        if (value > 15) value = 15;
                        if (value < 0) value = 0;
                        if (isNaN(value) === false) {
                            setPoints(value);
                        }
                        else if (e.target.value === "") {
                            setPoints("");
                        }
                    }
                }
            />
            <TextField
                name="loyaltyDescription"
                label="Loyalty System Description"
                multiline
                rows={4}
                fullWidth
                value={description}
                onChange={e => setDescription(e.target.value)}
            />
            <Stack
                direction="row"
                spacing={2}
            >
                <Button variant="outlined" size="large" component={Link} to="/eatery/dashboard" style={{
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

export default EateryLoyaltySystem;