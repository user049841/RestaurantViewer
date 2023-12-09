import { Modal } from 'react-bootstrap';
import { Button, Stack, TextField } from '@mui/material';
import React, { useState, useContext } from 'react';

import { MenuContext } from '../pages/EditMenu';
import { AuthContext, SnackbarContext } from '../App';
import Config from "../config.json";

/**
 * A modal form component for editing an exisitng category in the menu.
 */
const EditMenuCategoryModal = ({category}) => {
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
        temp[menu.indexOf(category)]["name"] = form.categoryName.value;
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
            <Button variant="outlined" sx={{ margin:"15px" }} onClick={handleShow}>Edit Category</Button>
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
                    <h2>Edit Category</h2>
                    <TextField
                        defaultValue={category["name"]}
                        name="categoryName"
                        label="Category Name"
                        size="small"
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
                        }}>Save Changes</Button>
                    </Stack>
                </Stack>
                <br />
            </Modal>
        </>
    )
}

export default EditMenuCategoryModal;