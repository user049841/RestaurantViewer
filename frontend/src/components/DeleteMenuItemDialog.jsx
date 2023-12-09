import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useContext } from 'react';

import { MenuContext } from '../pages/EditMenu';
import { AuthContext, SnackbarContext } from '../App';
import Config from "../config.json";

/**
 * A dialog confirmation component for deleting an item from the menu
 */
const DeleteMenuItemDialog = ({item, category}) => {
    const { menu, setMenu } = useContext(MenuContext);
    const [openDialog, setOpenDialog] = React.useState(false);
    const { setOpen, setMessage } = useContext(SnackbarContext);
    const { token, userId } = useContext(AuthContext);

    const Delete = async () => {
        setOpenDialog(false);
        let temp = JSON.parse(JSON.stringify(menu));
        let tempItemList = temp[menu.indexOf(category)]["items"]
        let menuItemList = menu[menu.indexOf(category)]["items"]
        tempItemList.splice(menuItemList.indexOf(item), 1)
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
    };

    const handleOpenDialog = (event) => {
        event.preventDefault();
        setOpenDialog(true);
    }

    const handleCloseDialog = (event) => {
        event.preventDefault();
        setOpenDialog(false);
    };

    return (
        <>
            <Button onClick={handleOpenDialog}>Delete</Button>
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
            >
                <DialogTitle>
                {"Confirmation"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Delete this item from your menu?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>No</Button>
                    <Button  onClick={Delete} autoFocus>Yes</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
export default DeleteMenuItemDialog;