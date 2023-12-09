import React from 'react';
import { Button, Stack, TextField, Grid, Divider, Chip, Autocomplete, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useContext, useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useRef } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import fileToDataUrl from '../helpers';

import { AuthContext, SnackbarContext } from '../App';
import Config from "../config.json";
import AutocompleteAddressField from '../components/AutocompleteAddressTextField';

/**
 * Component for previewing an uploaded display image.
 */
const DisplayImage = (data, images, setImages) => {
    const imageStyle = {
        maxWidth: "300px",
        maxHeight: "300px",
        margin: "1%"
    }
    return (
        <>
            <img src={data} style={imageStyle} alt="Eatery Display"/>
            <DeleteIcon onClick={(event) => {
                event.preventDefault();
                setImages(images.filter(image => image !== data));
            }}/>
        </>
    )
}

/**
 * The edit eatery profile page. Redirects from the eatery dashboard, and allows eatery users to set most profile details.
 */
const EditEateryProfile = () => {
    const { setOpen, setMessage } = useContext(SnackbarContext);
    const { userId, location } = useContext(AuthContext);

    const [email, setEmail] = useState("");
    const [eateryName, setEateryName] = useState("");
    const [contact, setContact] = useState("");
    const [value, setValue] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [coordinates, setCoordinates] = useState({ "latitude": null, "longitude": null });
    const [description, setDescription] = useState("");
    const [avatar, setAvatar] = useState("");
    const [images, setImages] = useState([]);
    const [tags, setTags] = useState([]);
    const [price, setPrice] = useState("$");
    const [allTags, setAllTags] = useState([]);

    const ref = useRef(null);

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
                setEmail(data["eatery"]["email"]);
                setEateryName(data["eatery"]["name"]);
                setContact(data["eatery"]["phone_number"]);
                setValue(data["eatery"]["address"]);
                setInputValue(data["eatery"]["address"]);
                setCoordinates({ "latitude": data["latitude"], "longitude": data["longitude"] });
                setDescription(data["eatery"]["description"]);
                setAvatar(data["eatery"]["avatar"]);
                if (data["eatery"]["images"]) {
                    setImages(data["eatery"]["images"]);
                }
                if (data["eatery"]["tags"]) {
                    setTags(data["eatery"]["tags"]);
                }
                setPrice(data["eatery"]["pricing"]);
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
                method: "GET"
            }
            const response = await fetch(`http://${Config.BACKEND_SERVER}/eateries/tags`, request);
            const data = await response.json();
            if (response.status === 200) {
                setAllTags(data["tags"])
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
        }
        Fetch()
    }, [setMessage, setOpen]);

    const Submit = async (form) => {
        let request = {
            method: "PUT",
            body: JSON.stringify({
                "email": form.email.value,
                "name": form.name.value,
                "contact": form.contact.value,
                "address": value,
                "avatar": avatar,
                "description": form.description.value,
                "tags": tags,
                "pricing": price,
                "images": images,
                "latitude": coordinates["latitude"],
                "longitude": coordinates["longitude"]
            }),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/user/profile/eatery/edit/${userId}`, request);
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
            <h1>Edit Eatery Profile</h1>
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
                value={eateryName}
                onChange={e => setEateryName(e.target.value)}
                name="name"
                label="Eatery Name"
                size="small"
            />
            <TextField
                value={contact}
                onChange={e => setContact(e.target.value)}
                name="contact"
                label="Contact Number"
                size="small"
            />
            <AutocompleteAddressField name="address" value={value} setValue={setValue}
            inputValue={inputValue} setInputValue={setInputValue} setCoordinates={setCoordinates} />
            <TextField
                value={description}
                onChange={e => setDescription(e.target.value)}
                name="description"
                label="Eatery Description"
                multiline
                rows={4}
                fullWidth
            />
            <Autocomplete
                multiple
                name="tags"
                freeSolo
                options={allTags}
                value={tags}
                onChange={(event, newTags) => {
                    if (newTags.length <= tags.length || (newTags.length > tags.length && tags.length < 5))
                        setTags(newTags)
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Tags"
                        placeholder={tags.length >= 5 ? "" : "Add a tag"}
                        helperText={tags.length >= 5 ? "Maximum number of tags reached" : ""}
                    />
                )}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                }
            />
            <FormControl>
                <InputLabel>Price Range</InputLabel>
                <Select
                    label="Price Range"
                    sx={{ width:"30ch", textAlign:"left" }}
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                >
                    <MenuItem value={"$"}>$</MenuItem>
                    <MenuItem value={"$$"}>$$</MenuItem>
                    <MenuItem value={"$$$"}>$$$</MenuItem>
                </Select>
            </FormControl>

            <Divider sx={{ width:"30%", bgcolor: "grey"}} />
            <h5>Display Images</h5>
            <input type="file" name="images" accept="image/*" style={{width:"300px"}} onChange={(event) => {
                event.preventDefault();
                if (event.currentTarget.files && event.currentTarget.files[0]) {
                    fileToDataUrl(event.currentTarget.files[0]).then(url => {
                        setImages([...images, url]);
                    })
                }
                event.currentTarget.value = null;
            }} className="form-control" />
            <Grid container direction="row" justifyContent="center" style={{width:"750px"}}>
                {images.map(data =>
                    <Grid item>
                        {DisplayImage(data, images, setImages)}
                    </Grid>
                 )}
            </Grid>
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

export default EditEateryProfile;