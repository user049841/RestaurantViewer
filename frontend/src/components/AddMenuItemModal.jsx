import { Modal } from 'react-bootstrap';
import { Button, Stack, TextField, Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import React, { useState, useContext } from 'react';

import { MenuContext } from '../pages/EditMenu';
import { AuthContext, SnackbarContext } from '../App';
import Config from "../config.json";

/**
 * A modal form component for adding a new item to a category in the menu
 */
const AddMenuItemModal = ({category}) => {
    const { menu, setMenu } = useContext(MenuContext);
    const [show, setShow] = useState(false);
    const [price, setPrice] = useState("");
    const { setOpen, setMessage, isDarkMode } = useContext(SnackbarContext);
    const { token, userId } = useContext(AuthContext);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const Submit = async (form) => {
        if (form.itemName.value === "") {
            setMessage("Please fill in all fields");
            setOpen(true);
            return
        }
        let temp = JSON.parse(JSON.stringify(menu));
        temp[menu.indexOf(category)]["items"].push({
            "name": form.itemName.value,
            "price": form.itemPrice.value,
            "gluten_free": form.isGlutenFree.checked,
            "vegan": form.isVegan.checked
        });
        let request = {
            method: "PUT",
            body: JSON.stringify({
                "token": token,
                "menu": temp
            }),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/user/profile/eatery/edit/menu/${userId}`, request);
        const data = await response.json();
        if (response.status === 200) {
            setMessage("Changes saved");
            setOpen(true);
            setMenu(temp);
        }
        else {
            setMessage(data["message"]);
            setOpen(true);
        }
        handleClose();
    };

    return (
        <>
            <Button variant="outlined" sx={{ margin:"15px" }} onClick={handleShow}>Add Item</Button>
            <Modal size="md" show={show} onHide={handleClose} contentClassName={isDarkMode ? "darkMode" : "lightMode"}>
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
                    onKeyDown={(event) => {
                        if (event.key === "Enter") { 
                            event.preventDefault();
                            Submit(event.currentTarget.elements);
                        }
                    }}
                >
                    <h2>New Item</h2>
                    <TextField
                        name="itemName"
                        label="Item Name"
                        size="small"
                    />
                    <TextField
                        name="itemPrice"
                        label="Item Price"
                        size="small"
                        type="number"
                        value={price}
                        onChange={(e) =>
                            {
                                let value = parseFloat(e.target.value, 10);
                                if (value < 0) value = 0;
                                if (isNaN(value) === false) {
                                    setPrice(value);
                                }
                                else if (e.target.value === "") {
                                    setPrice("");
                                }
                            }
                        }
                    />
                    <FormGroup row={true}>
                        <FormControlLabel control={<Checkbox name="isGlutenFree"/>} label="Gluten Free" />
                        <FormControlLabel control={<Checkbox name="isVegan"/>} label="Vegan" />
                    </FormGroup>
                    <Stack
                        direction="row"
                        spacing={2}
                    >
                        <Button variant="outlined" onClick={handleClose} style={{
                            marginTop: "2%",
                            marginBottom: "3%"
                        }}>Close</Button>
                        <Button variant="contained" size="large" onClick={(event) => {
                            event.preventDefault();
                            Submit(event.currentTarget.parentNode.parentNode.elements);
                        }} style={{
                            marginTop: "2%",
                            marginBottom: "3%"
                        }}>Add</Button>
                    </Stack>
                </Stack>
                <br />
            </Modal>
        </>
    )
}

export default AddMenuItemModal;