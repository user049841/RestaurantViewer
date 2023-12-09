import { Modal } from 'react-bootstrap';
import { Button, Stack, TextField } from '@mui/material';
import React, { useState, useContext } from 'react';

import { MenuContext } from '../pages/EditMenu';
import { AuthContext, SnackbarContext } from '../App';
import Config from "../config.json";

/**
 * A modal form component for adding a new empty category to menu
 */
const AddMenuCategoryModal = () => {
    const { menu, setMenu } = useContext(MenuContext);
    const [show, setShow] = useState(false);
    const { setOpen, setMessage, isDarkMode } = useContext(SnackbarContext);
    const { token, userId } = useContext(AuthContext);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const Submit = async (form) => {
        if (form.categoryName.value === "") {
            setMessage("Please fill in all fields");
            setOpen(true);
            return
        }
        let temp = JSON.parse(JSON.stringify(menu));
        temp.push({
            "name": form.categoryName.value,
            "items": []
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
            <Button variant="contained" size="large" onClick={handleShow} style={{
                marginTop: "3%"
            }}>Add Category</Button>
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
                    <h2>New Category</h2>
                    <TextField
                        name="categoryName"
                        label="Category Name"
                        size="small"
                        defaultValue=""
                    />
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

export default AddMenuCategoryModal;