import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { Button, Stack, Tab, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, Tooltip } from "@mui/material";
import { TabContext, TabList } from '@mui/lab';
import { AuthContext, SnackbarContext } from '../App';

import Config from "../config.json";

/**
 * Page for an eatery to view all created voucher details.
 */
const EateryViewVouchers = () => {
    const [vouchers, setVouchers] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("1");
    const { token } = useContext(AuthContext);
    const { setOpen, setMessage } = useContext(SnackbarContext);

    useEffect(() => {
        if (!loading) {
            return;
        }
        const Fetch = async () => {
            let request = {
                method: "POST",
                body: JSON.stringify({"token": token }),
                headers: {
                    "Content-Type": "application/json"
                }
            }
            const response = await fetch(`http://${Config.BACKEND_SERVER}/voucher/view/eatery`, request);
            const data = await response.json();
            if (response.status === 200) {
                console.log(data);
                setVouchers(data["vouchers"]);
                setSchedules(data["schedules"]);
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
            setLoading(false);
        }
        Fetch()
    }, [token, setMessage, setOpen, setLoading, loading]);

    const handleChange = (event, newValue) => {
        setTab(newValue);
    };

    const Remove = async (schedule_id) => {
        let request = {
            method: "POST",
            body: JSON.stringify({"schedule_id": schedule_id }),
            headers: {
                "Content-Type": "application/json"
            }
        }
        fetch(`http://${Config.BACKEND_SERVER}/voucher/schedule/stop`, request);
        setMessage("Weekly schedule successfully removed");
        setLoading(true);
    }

    return (
        <>
            <TabContext value={tab}>
                <h1 style={{ marginTop: "2%" }}>View Vouchers</h1>
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="center"
                    marginTop="1%"
                >
                    <TabList sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: "1%" }} onChange={handleChange}>
                        <Tab label="Vouchers" value="1"/>
                        <Tab label="Schedules" value="2" />
                    </TabList>
                </Stack>
                { tab === "1" &&
                    <TableContainer
                    sx={{ marginLeft: "15%", marginRight: "15%", width: "70%"}}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontSize: "2vmin", textAlign: "left"}}>Name</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Description</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Discount Rate (%)</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Start Date</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>End Date</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Number Remaining</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {vouchers.map((row) => (
                                    <TableRow
                                        key={row["id"]}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.name}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.description}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.discount}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.start}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.end}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.num_vouchers}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {vouchers.length === 0 && <p style={{ marginTop: "50px" }}>You currently have no created vouchers.</p>}
                    </TableContainer>
                }
                { tab === "2" &&
                     <TableContainer
                     sx={{ marginLeft: "15%", marginRight: "15%", width: "70%"}}>
                         <Table>
                             <TableHead>
                                 <TableRow>
                                    <TableCell sx={{ fontSize: "2vmin", textAlign: "left"}}>Name</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Description</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Discount Rate (%)</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Day of Week</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Start Time</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>End Time</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Number of Vouchers</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "2vmin", textAlign: "left"}}>Actions</TableCell>
                                 </TableRow>
                             </TableHead>
                             <TableBody>
                                 {schedules.map((row) => (
                                     <TableRow
                                         key={row["id"]}
                                         sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                     >
                                        <TableCell sx={{ fontSize: "2vmin", textAlign: "left"}}>{row.name}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.description}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.discount}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.day}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.start.substring(10)}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.end.substring(10)}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>{row.num_vouchers}</TableCell>
                                        <Tooltip title="Remove the selected recurring weekly schedule">
                                            <TableCell align="right" sx={{ fontSize: "1.5vmin", textAlign: "left"}}>
                                                <Button onClick={(e) => Remove(row.id)}>Remove</Button>
                                            </TableCell>
                                        </Tooltip>
                                     </TableRow>
                                 ))}
                             </TableBody>
                         </Table>
                         {schedules.length === 0 && <p style={{ marginTop: "50px" }}>You currently have no created schedules.</p>}
                     </TableContainer>
                }
            </TabContext>
        </>
    )
}

export default EateryViewVouchers;