import { Modal } from 'react-bootstrap';
import { Button, Stack, TextField, Typography } from '@mui/material';
import React, { useContext, useState } from 'react';
import { AuthContext, SnackbarContext } from '../App';

import Config from "../config.json";

/**
 * The modal for verifying an individuaal discount voucher.
 */
/*eslint-disable eqeqeq*/
const VerifyDiscountVoucherModal = () => {
    const { token } = useContext(AuthContext);
    const { setOpen, setMessage, isDarkMode } = useContext(SnackbarContext);
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [voucher, setVoucher] = useState(null);

    const Submit = async (form) => {

        let request = {
            method: "POST",
            body: JSON.stringify({
                "code": form.code.value,
                "token": token
            }),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/voucher/redeem`, request);
        const data = await response.json();
        if (response.status === 200) {
            setMessage("Voucher has been redeemed successfully.");
            setOpen(true);
            console.log(data);
            setVoucher(data);
        }
        else {
            setMessage(data["message"]);
            setOpen(true);
        }
    }

    return (
        <>
            <Button variant="contained" size="large" onClick={handleShow}>Verify Voucher</Button>
            <Modal size="lg" show={show} onHide={handleClose} contentClassName={isDarkMode ? "darkMode" : "lightMode"}>
                <Modal.Header>
                    <Modal.Title>{voucher == null ? "Verify Discount Voucher" : "View Verified Voucher"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                { voucher == null &&
                    <Stack
                        component="form"
                        direction="column"
                        justifyContent="flex-start"
                        alignItems="center"
                        spacing={3}
                        style={{
                            marginTop: "2%",
                            marginBottom: "2%"
                        }}
                        sx={{
                            "& .MuiTextField-root":  { width: "40ch" },
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") { 
                                event.preventDefault();
                                Submit(event.currentTarget.elements);
                            }
                        }}
                    >
                        <TextField
                            name="code"
                            label="Voucher Code"
                            size="small"
                        />
                        <Stack
                            direction="row"
                            spacing={2}
                            style={{
                                marginTop: "4%",
                                marginBottom: "2%"
                            }}
                        >
                            <Button onClick={handleClose}>Close</Button>
                            <Button variant="contained" size="large" onClick={(event) => {
                                    event.preventDefault();
                                    Submit(event.currentTarget.parentNode.parentNode.elements);
                            }}>Redeem</Button>
                        </Stack>
                    </Stack>
                }
                { voucher != null &&
                    <Stack
                        component="form"
                        direction="column"
                        justifyContent="flex-start"
                        alignItems="center"
                        spacing={3}
                        style={{
                            marginTop: "2%",
                            marginBottom: "2%"
                        }}
                    >
                        <Typography variant="h5">
                            {voucher["name"]}
                        </Typography>
                        <Typography sx={{ mb: 1 }} color="text.secondary">
                            {`${voucher["discount"]}% off`}
                        </Typography>
                        <Typography variant="body2">
                            {voucher["description"]}
                        </Typography>
                        <Stack
                            direction="row"
                            spacing={2}
                            style={{
                                marginTop: "4%",
                                marginBottom: "2%"
                            }}
                        >
                            <Button onClick={handleClose}>Close</Button>
                            <Button variant="contained" size="large" onClick={(event) => {
                                    event.preventDefault();
                                    setVoucher(null);
                            }}>Return</Button>
                        </Stack>
                    </Stack>
                }
                </Modal.Body>
            </Modal>
        </>
    )
}

export default VerifyDiscountVoucherModal;