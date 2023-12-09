import React from 'react';
import { Button, Stack, Accordion, AccordionSummary, AccordionDetails, Card, Box } from '@mui/material';
import { useContext, useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import EditMenuItemModal from '../components/EditMenuItemModal';
import EditMenuCategoryModal from '../components/EditMenuCategoryModal';
import DeleteMenuItemDialog from '../components/DeleteMenuItemDialog';
import DeleteMenuCategoryDialog from '../components/DeleteMenuCategoryDialog';
import AddMenuItemModal from '../components/AddMenuItemModal';
import AddMenuCategoryModal from '../components/AddMenuCategoryModal';

import { AuthContext, SnackbarContext } from '../App';
import Config from "../config.json";

export const MenuContext = React.createContext();

/**
 * Component for a single menu item display
 */
const MenuItem = (item, category) => {
    const iconStyle = {
        width: "30px",
        height: "30px",
        margin: "0 5px"
    }

    return (
        <Card variant="outlined" sx={{ display: 'flex', justifyContent:"space-between", alignItems:"center", width:"100%", padding: "10px 15px" }} key={item["name"]} >
            <Box sx={{ display: 'flex', alignItems:"center" }}>
                <div style={{ marginRight:"15px", fontWeight:"450" }}>{item["name"]}</div>
                {item["gluten_free"] && <img src="/images/gluten-free-icon.png" style={iconStyle} alt="gluten-free-icon" />}
                {item["vegan"] && <img src="/images/vegan-icon.png" style={iconStyle} alt="vegan-icon" />}
            </Box>
            <Box sx={{ display: 'flex', alignItems:"center" }}>
                <h6 style={{ margin:"0 15px 0 0" }}>${item["price"]}</h6>
                <EditMenuItemModal item={item} category={category}/>
                <DeleteMenuItemDialog item={item} category={category}/>
            </Box>
        </Card>
    )
}

/**
 * Component for a single menu category display
 */
const MenuCategory = (category, isDarkMode) => {
    return (
        <Accordion sx={{ width:"80%", backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.5)" : "#F8F8F8" }} key={category["name"]} >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
            >
            <h5>{category["name"]}</h5>
            </AccordionSummary>
            <AccordionDetails>
                {category["items"].map((item) => MenuItem(item, category))}
                {category["items"].length === 0 && <p>This category is currently empty.</p>}
                <br/>
                <AddMenuItemModal category={category}/>
                <EditMenuCategoryModal category={category}/>
                <DeleteMenuCategoryDialog category={category}/>
            </AccordionDetails>
        </Accordion>
    )
}

/**
 * The edit menu page. Redirects from the eatery dashboard, and allows eatery users to add/edit/delete menu items and categories.
 */
const EditMenu = () => {
    const { setOpen, setMessage, isDarkMode } = useContext(SnackbarContext);
    const { userId } = useContext(AuthContext);
    const [menu, setMenu] = useState([])

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
                setMenu(data);
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
        }
        Fetch()
    }, [userId, setMessage, setOpen]);

    return (
        <MenuContext.Provider value={{ menu, setMenu }}>
            <Stack
                component="form"
                direction="column"
                justifyContent="flex-start"
                alignItems="center"
                style={{
                    marginTop: "3%"
                }}
                sx={{
                    '& .MuiTextField-root':  { width: '30ch' },
                }}
            >
                <h1>Edit Menu</h1>
                <br />
                {menu.map((category) => MenuCategory(category, isDarkMode))}
                <br/>
                <Stack
                    direction="row"
                    spacing={2}
                >
                    <AddMenuCategoryModal />
                    <Button variant="outlined" size="large" component={Link} to="/eatery/dashboard" style={{
                        marginTop: "3%"
                    }}>Back</Button>
                </Stack>
            </Stack>
        </MenuContext.Provider>
    )
}

export default EditMenu;