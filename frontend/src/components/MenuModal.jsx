import { Modal } from 'react-bootstrap';
import { Button, Stack, Accordion, AccordionSummary, AccordionDetails, Card, Box  } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import React, { useState, useEffect, useContext } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { SnackbarContext } from '../App';
import Config from "../config.json";

/**
 * Component for a single menu item display
 */
const MenuItem = (item, isDarkMode) => {
    const iconStyle = {
        width: "30px",
        height: "30px",
        margin: "0 5px",
        filter: isDarkMode ? "brightness(0) invert(1)" : ""
    }

    return (
        <Card variant="outlined" sx={{ display: 'flex', justifyContent:"space-between", alignItems:"center", width:"100%", padding: "10px 15px" }} key={item["name"]}>
            <Box sx={{ display: 'flex', alignItems:"center" }}>
                <div style={{ marginRight:"15px", fontWeight:"450" }}>{item["name"]}</div>
                {item["gluten_free"] && <img src="/images/gluten-free-icon.png" style={iconStyle} alt="gluten-free-icon" />}
                {item["vegan"] && <img src="/images/vegan-icon.png" style={iconStyle} alt="vegan-icon" />}
            </Box>
            <h6 style={{ margin:"0 15px 0 0" }}>${item["price"]}</h6>
        </Card>
    )
}

/**
 * Component for a single menu category display
 */
const MenuCategory = (category, isDarkMode) => {
    return (
        <Accordion sx={{ width:"80%", backgroundColor: isDarkMode ? "" : "#F8F8F8" }} key={category["name"]}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
            >
            <h5>{category["name"]}</h5>
            </AccordionSummary>
            <AccordionDetails>
                {category["items"].map((item) => MenuItem(item, isDarkMode))}
                {category["items"].length === 0 && <p>There are no available items in this category right now.</p>}
            </AccordionDetails>
        </Accordion>
    )
}

/**
 * The modal component for viewing the entire menu of an eatery
 */
const MenuModal = ({id}) => {
    const { setOpen, setMessage, isDarkMode } = useContext(SnackbarContext);
    const [show, setShow] = useState(false);
    const [menu, setMenu] = useState([])
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    useEffect(() => {
        const Fetch = async () => {
            let request = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
            }
            const response = await fetch(`http://${Config.BACKEND_SERVER}/browse/eatery/menu/${id}`, request);
            const data = await response.json();
            if (response.status === 200) {
                setMenu(data);
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
        }
        Fetch()
    }, [id, setMessage, setOpen]);

    return (
        <>
            <Card variant="outlined" sx={{ margin:"auto", height:"100px"}} onClick={handleShow}>
                <div style={{ marginTop: "5px" }}>
                    <MenuBookIcon sx={{ fontSize: '50px' }}/>
                </div>
                <Button variant="filled" size="small">View menu</Button>
            </Card>
            <Modal size="lg" show={show} onHide={handleClose} contentClassName={isDarkMode ? "darkMode" : "lightMode"}>
                <Stack
                    direction="column"
                    justifyContent="flex-start"
                    alignItems="center"
                    style={{
                        marginTop: "3%"
                    }}
                >
                    <h1>Our Menu</h1>
                    <br />
                    {menu.length === 0 && <p>The menu is currently empty</p>}
                    {menu.map((category) => MenuCategory(category, isDarkMode))}
                    <br/>
                    <Button variant="outlined" size="large" onClick={handleClose}>Close</Button>
                </Stack>
                <br/>
            </Modal>
        </>
    )
}

export default MenuModal;