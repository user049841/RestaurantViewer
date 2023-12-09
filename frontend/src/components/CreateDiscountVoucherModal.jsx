import { Modal } from 'react-bootstrap';
import { Autocomplete, Button, Stack, TextField, ToggleButtonGroup, ToggleButton } from '@mui/material';
import React, { useState, useContext } from 'react';
import { DateTimePicker, TimePicker } from '@mui/x-date-pickers';

import Config from "../config.json";
import { AuthContext, SnackbarContext } from '../App';

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * The component for the form to create a discount voucher.
 */
/*eslint-disable eqeqeq*/
const CreateDiscountVoucherModal = () => {

    /**
     * Sends the information in the form to the backend.
     */
    const { token } = useContext(AuthContext);
    const { setOpen, setMessage, isDarkMode } = useContext(SnackbarContext);
    const [show, setShow] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [day, setDay] = useState(weekdays[0]);
    const [discount, setDiscount] = useState(0);
    const [inputDay, setInputDay] = React.useState('');
    const [type, setType] = useState(0); // 0 - one-time, 1 - weekly, 2 - test 
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const Submit = async (form) => {
        // Weekly Recurring Voucher
        if (type == 1) {
            if (startTime == null || endTime == null) {
                setMessage("The start and end time fields must be non-empty.");
                setOpen(true);
                return;
            }
            if (startTime["$d"] >= endTime["$d"]) {
                setMessage("The end time must be after the start time.");
                setOpen(true);
                return;
            }
            let startTimeString = startTime["$d"].getHours() + ":" + startTime["$d"].getMinutes() + ":" + startTime["$d"].getSeconds();
            let endTimeString = endTime["$d"].getHours() + ":" + endTime["$d"].getMinutes() + ":" + endTime["$d"].getSeconds();
            let request = {
                method: "POST",
                body: JSON.stringify({
                    "token": token,
                    "name": form.name.value,
                    "discount": form.discount.value,
                    "description": form.description.value,
                    "number": form.number.value,
                    "weekday": day,
                    "start": startTimeString,
                    "end": endTimeString
                }),
                headers: {
                    "Content-Type": "application/json"
                },
            }
            const response = await fetch(`http://${Config.BACKEND_SERVER}/voucher/schedule/create`, request);
            const data = await response.json();
            if (response.status === 200) {
                setMessage("Weekly voucher schedule successfully created");
                setOpen(true);
                handleClose();
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
        }
        // One-Time Voucher
        else if (type == 0) {
            if (startDate == null || endDate == null) {
                setMessage("The start and end date fields must be non-empty.");
                setOpen(true);
                return;
            }
            if (startDate["$d"] >= endDate["$d"]) {
                setMessage("The end date must be after the start date.");
                setOpen(true);
                return;
            }
            let startDateString = startDate["$d"].getDate() + "-" + (1 + startDate["$d"].getMonth()) + "-" + startDate["$d"].getFullYear()
                                + " " + startDate["$d"].getHours() + ":" + startDate["$d"].getMinutes() + ":" + startDate["$d"].getSeconds();
            let endDateString = endDate["$d"].getDate() + "-" + (1 + endDate["$d"].getMonth()) + "-" + endDate["$d"].getFullYear()
                                + " " + endDate["$d"].getHours() + ":" + endDate["$d"].getMinutes() + ":" + endDate["$d"].getSeconds();
            let request = {
                method: "POST",
                body: JSON.stringify({
                    "token": token,
                    "name": form.name.value,
                    "discount": form.discount.value,
                    "description": form.description.value,
                    "number": form.number.value,
                    "start": startDateString,
                    "end": endDateString
                }),
                headers: {
                    "Content-Type": "application/json"
                },
            }
            const response = await fetch(`http://${Config.BACKEND_SERVER}/voucher/create`, request);
            const data = await response.json();
            if (response.status === 200) {
                setMessage("One-time voucher(s) successfully created");
                setOpen(true);
                handleClose();
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
        }
        // One-Minute Recurring Voucher (Test) 
        else {
            if (startTime == null || endTime == null) {
                setMessage("The start and end time fields must be non-empty.");
                setOpen(true);
                return;
            }
            if (startTime["$d"] >= endTime["$d"]) {
                setMessage("The end time must be after the start time.");
                setOpen(true);
                return;
            }
            let startTimeString = startTime["$d"].getHours() + ":" + startTime["$d"].getMinutes() + ":" + startTime["$d"].getSeconds();
            let endTimeString = endTime["$d"].getHours() + ":" + endTime["$d"].getMinutes() + ":" + endTime["$d"].getSeconds();
            
            let request = {
                method: "POST",
                body: JSON.stringify({
                    "token": token,
                    "name": form.name.value,
                    "discount": form.discount.value,
                    "description": form.description.value,
                    "number": form.number.value,
                    "interval": form.interval.value,
                    "start": startTimeString,
                    "end": endTimeString
                }),
                headers: {
                    "Content-Type": "application/json"
                },
            }
            const response = await fetch(`http://${Config.BACKEND_SERVER}/voucher/schedule/create/demo`, request);
            const data = await response.json();
            if (response.status === 200) {
                setMessage("Tester schedule successfully created. Remember to disable after testing is complete.");
                setOpen(true);
                handleClose();
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
        }
    }

    return (
        <>
            <Button variant="contained" size="large" onClick={handleShow}>Create voucher</Button>
            <Modal size="lg" show={show} onHide={handleClose} contentClassName={isDarkMode ? "darkMode" : "lightMode"}>
                <Modal.Header>
                    <Modal.Title>Create discount voucher</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ToggleButtonGroup
                        color="primary"
                        size="small"
                        value={type}
                        exclusive
                        onChange={(e, newValue) => { setType(newValue); }}
                        >
                        <ToggleButton value={0}>One-Time</ToggleButton>
                        <ToggleButton value={1}>Weekly</ToggleButton>
                        <ToggleButton value={2}>Demo</ToggleButton>
                    </ToggleButtonGroup>
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
                                '& .MuiTextField-root':  { width: '30ch' },
                            }}
                    >
                        <TextField
                            name="name"
                            label="Voucher Name"
                            size="small"
                        />
                        <TextField
                            name="discount"
                            label="Discount Rate (%)"
                            size="small"
                            type="number"
                            value={discount}
                            onChange={(e) => 
                                {
                                    let value = parseInt(e.target.value, 10);
                                    if (value > 100) value = 100;
                                    else if (value < 0) value = 0;
                                    if (isNaN(value) === false) {
                                        setDiscount(value);
                                    }
                                    else if (e.target.value === "") {
                                        setDiscount("");
                                    }
                                }
                            }
                        />
                        <TextField
                            name="description"
                            label="Voucher Description"
                            size="large"
                            multiline
                            minRows={4}
                        />
                        <TextField
                            name="number"
                            label="Number of Vouchers"
                            size="small"
                            type="number"
                        />
                        { type == 0 && 
                            <>
                                <DateTimePicker
                                    name="start"
                                    label="Start Date"
                                    format="DD-MM-YYYY hh:mm"
                                    size="small"
                                    value={startDate}
                                    onChange={(newValue) => setStartDate(newValue)}
                                    slotProps={{
                                        textField: {
                                            helperText: 'MM-DD-YYYY hh:mm:aa',
                                            size: "small"
                                        },
                                    }}
                                />
                                <DateTimePicker
                                    name="expiry"
                                    label="Expiry Date"
                                    format="DD-MM-YYYY hh:mm" 
                                    size="small"
                                    value={endDate}
                                    onChange={(newValue) => setEndDate(newValue)}
                                    slotProps={{
                                        textField: {
                                            helperText: 'MM-DD-YYYY hh:mm:aa',
                                            size: "small"
                                        },
                                    }}
                                />
                            </>
                        }
                        { type == 1 &&
                            <Autocomplete
                                value={day}
                                onChange={(event, newValue) => {
                                    setDay(newValue);
                                }}
                                inputValue={inputDay}
                                onInputChange={(event, newInputValue) => {
                                    setInputDay(newInputValue);
                                }}
                                options={weekdays}
                                renderInput={(params) => <TextField {...params} label="Weekday" size="small" />}
                            />
                        }
                        { type == 2 &&
                            <TextField
                                name="interval"
                                label="Interval (min)"
                                size="small"
                                type="number"
                                defaultValue={1}
                            />
                        }
                        { type != 0 && 
                            <>
                                <TimePicker
                                    label="Start Time"
                                    value={startTime}
                                    onChange={(newValue) => setStartTime(newValue)}
                                    slotProps={{
                                        textField: {
                                            helperText: 'hh:mm:aa',
                                            size: "small"
                                        }
                                    }}
                                />
                                <TimePicker
                                    label="End Time"
                                    value={endTime}
                                    onChange={(newValue) => setEndTime(newValue)}
                                    slotProps={{
                                        textField: {
                                            helperText: 'hh:mm:aa',
                                            size: "small"
                                        }
                                    }}
                                />
                            </>
                        }
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
                            }}>Create</Button>
                        </Stack>
                    </Stack>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default CreateDiscountVoucherModal;