import { Modal } from 'react-bootstrap';
import { Button, Divider, Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AuthContext, SnackbarContext } from '../App';
import { PointsContext } from '../pages/EateryProfile';
import Config from "../config.json";

/**
 * The component for obtaining vouchers. Can only be accessed by diners.
 */
/*eslint-disable eqeqeq*/
const ObtainVoucherModal = ({voucher, show, setShow}) => {
    const { token, isDiner } = useContext(AuthContext);
    const { setOpen, setMessage, isDarkMode } = useContext(SnackbarContext);
    const { loyalty } = useContext(PointsContext);
    const Submit = async () => {
        let request = {
            method: "POST",
            body: JSON.stringify({
                "voucher_id": voucher["id"],
                "token": token,
                "discount": voucher["discount"]
            }),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/voucher/obtain`, request);
        const data = await response.json();
        if (response.status === 200) {
            setMessage(`Obtained voucher successfully. View voucher in user dashboard for the promo code.`);
            setOpen(true);
            setShow(false);
        }
        else {
            setMessage(data["message"]);
            setOpen(true);
        }
    }

    return (
        <>
            <Modal size="small" show={show} onHide={(e) => {setShow(false);}} contentClassName={isDarkMode ? "darkMode" : "lightMode"}>
            <Modal.Header>
                <Modal.Title>View Voucher</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{
                marginLeft: "5%",
                marginRight: "5%",
                textAlign: "center"
            }}>
                <Typography sx={{ fontSize: 14, marginBottom: 2, marginTop: 1 }} color="text.secondary" gutterBottom>
                    {`Promotion Period: ${voucher["start"]} to ${voucher["end"]}`}
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: "600", marginBottom: 1 }}>
                    {`${voucher["discount"]}% off`}
                </Typography>
                <Typography variant="h5" sx={{ marginBottom: 2 }} color="text.secondary">
                    {voucher["name"]}
                </Typography>
                <Divider textAlign="left" sx={{ bgcolor: "grey", margin:"5px 0 5px 5" }} />
                <Typography variant="body2" sx={{
                    textAlign: "left",
                    marginTop: 2,
                    fontSize: 15,
                    paddingLeft: "3%",
                    paddingRight: "3%",
                    paddingTop: "2%"
                }}>
                    {voucher["description"]}
                </Typography>
                <Stack
                    direction="row"
                    spacing={2}
                    style={{
                        marginTop: "4%",
                        justifyContent: "space-evenly"
                    }}
                >
                    <Button size="large" onClick={(e) => {
                        e.preventDefault();
                        setShow(false);
                    }}>Close</Button>
                    { isDiner == true &&
                    <Button variant="contained" size="large" onClick={(event) => {
                        event.preventDefault();
                        Submit();
                    }}>Claim Voucher</Button>
                    }
                    { isDiner != true &&
                        <Button variant="contained" size="large" disabled>Claim Voucher</Button>
                    }
                </Stack>
                { isDiner != true &&
                    <p style={{color: "red", marginTop: "3%" }}>You must be a diner to claim vouchers!</p>
                }
                {loyalty[1] && isDiner && <p style={{ marginTop: "3%" }}><i>Claim and redeem this voucher to get +1 point</i></p>}
            </Modal.Body>
            </Modal>
        </>
    )
}

export default ObtainVoucherModal;