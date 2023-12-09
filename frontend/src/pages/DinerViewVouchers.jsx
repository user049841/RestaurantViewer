import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { Stack, TableContainer, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tooltip } from "@mui/material";
import { TabContext, TabList } from '@mui/lab';
import { AuthContext, SnackbarContext } from '../App';
import { Link } from "react-router-dom";

import Config from "../config.json";

/**
 * Page for a diner to view all owned voucher details, including both claimed vouchers and loyalty reward vouchers.
 */
const DinerViewVouchers = () => {
    const [vouchers, setVouchers] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [tab, setTab] = useState("1");
    const { token } = useContext(AuthContext);
    const { setOpen, setMessage } = useContext(SnackbarContext);

    useEffect(() => {
        const Fetch = async () => {
            let request = {
                method: "POST",
                body: JSON.stringify({"token": token }),
                headers: {
                    "Content-Type": "application/json"
                },
            }
            const response = await fetch(`http://${Config.BACKEND_SERVER}/voucher/view/diner`, request);
            const data = await response.json();
            if (response.status === 200) {
                setVouchers(data);
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
        }
        Fetch()
    }, [token, setMessage, setOpen]);

    useEffect(() => {
        const Fetch = async () => {
            let request = {
                method: "POST",
                body: JSON.stringify({"token": token }),
                headers: {
                    "Content-Type": "application/json"
                },
            }
            const response = await fetch(`http://${Config.BACKEND_SERVER}/diner/loyalty/voucher/view`, request);
            const data = await response.json();
            if (response.status === 200) {
                setRewards(data);
                console.log(data)
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
        }
        Fetch()
    }, [token, setMessage, setOpen]);

    const handleChange = (event, newValue) => {
        setTab(newValue);
    };

    return (
        <>
             <TabContext value={tab}>
                <h1 style={{marginTop: "2%"}}>Your Vouchers</h1>
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="center"
                    marginTop="1%"
                >
                    <TabList sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: "1%" }} onChange={handleChange}>
                        <Tab label="Obtained Vouchers" value="1"/>
                        <Tab label="Loyalty Rewards" value="2" />
                    </TabList>
                </Stack>
                { tab === "1" &&
                    <TableContainer
                    sx={{ marginLeft: "20%", marginRight: "20%", width: "60%"}}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontSize: "2vmin", textAlign: "left"}}>Name</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Eatery</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Discount Rate (%)</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Start Date</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>End Date</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Redeem Code</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {vouchers.map((row) => (
                                    <TableRow
                                        key={row["id"]}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.name}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>
                                            <Link to={`/browse/eateries/${row["eatery_id"]}`} style={{ color: "inherit" }} >
                                                {row.eatery_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.discount_rate}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.start_date}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.end_date}</TableCell>
                                        <Tooltip title="Show this code at the eatery counter during the promo period">
                                            <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.code}</TableCell>
                                        </Tooltip>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {vouchers.length === 0 && <p style={{ marginTop: "50px" }}>You currently have no obtained vouchers.</p>}
                    </TableContainer>}
                { tab === "2" &&
                    <TableContainer
                    sx={{ marginLeft: "25%", marginRight: "25%", width: "50%"}}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontSize: "2vmin", textAlign: "left"}}>Eatery</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Type</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Item</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Redeem Code</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rewards.map((row) => (
                                    <TableRow
                                        key={row["id"]}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>
                                            <Link to={`/browse/eateries/${row["eatery_id"]}`} style={{ color: "inherit" }} >
                                                {row.eatery_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.type === "freeItem" ? "Free item" : "Buy 1 get 1 free"}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.item}</TableCell>
                                        <Tooltip title="Show this code at the eatery counter during the promo period">
                                            <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.code}</TableCell>
                                        </Tooltip>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {rewards.length === 0 && <p style={{ marginTop: "50px" }}>You currently have no obtained rewards.</p>}
                    </TableContainer>}
            </TabContext>
        </>
    )
}

export default DinerViewVouchers;