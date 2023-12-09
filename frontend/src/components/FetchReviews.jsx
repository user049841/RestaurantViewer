import { Box, Button,  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Grid, ListItemIcon, ListItemText, Menu, MenuItem, Rating, Stack } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import CommentIcon from '@mui/icons-material/Comment';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

import Config from "../config.json";
import { AuthContext, SnackbarContext } from '../App';
import { EateryContext, PointsContext } from '../pages/EateryProfile';
import AddReviewModal from './AddReviewModal';
import ReviewCard from './ReviewCard';
import EditReviewModal from './EditReviewModal';
import AddReplyModal from './AddReplyModal';

/**
 * The component for browsing eateries. Returns a list of eateries.
 */
/*eslint-disable eqeqeq*/
const FetchReviews = () => {
    const { token, userId, isDiner } = useContext(AuthContext);
    const { setOpen, setMessage, isDarkMode } = useContext(SnackbarContext);
    const { eatery, eateryLoading } = useContext(EateryContext);
    const { loyalty, points, setPoints } = useContext(PointsContext);
    const [gainPoint, setGainPoint] = useState(true);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);

    /**
     * The current implementation of delete uses only one dialog. The value of reviewId is -1 when dialog is not open,
     * and set to the value of the review_id that is being deleted otherwise. This value is then passed into
     * the DeleteReview function.
     */
    const [DeleteReviewId, setDeleteReviewId] = React.useState(-1);
    const [activeMenu, setActiveMenu] = React.useState({"review": {"id": -1}, "anchorEl": null, "isReply": false, "isUser": false});

    const [showEditModal, setShowEditModal] = useState(false);
    const [showReplyModal, setShowReplyModal] = useState(false);

    useEffect(() => {
        if (!loading || eateryLoading) {
            return;
        }
        const Fetch = async () => {
            let request = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
            }
            let response = await fetch(`http://${Config.BACKEND_SERVER}/browse/eatery/${eatery["id"]}/reviews`, request);
            let data = await response.json();
            if (response.status === 200) {
                setReviews(data["reviews"]);
                if (gainPoint) {
                    setGainPoint(userId !== null && loyalty[1] && eatery["reviewed_by"].some((id) => id == userId) == false);
                }
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
            setLoading(false);
        }
        Fetch()
    }, [reviews, eatery, loading, setMessage, setOpen, gainPoint, loyalty, userId, setLoading, eateryLoading]);

    const DeleteReview = async () => {
        let request = {
            method: "POST",
            body: JSON.stringify({
                "token": token,
                "review_id": DeleteReviewId
            }),
            headers: {
                "Content-Type": "application/json"
            },
        }
        const response = await fetch(`http://${Config.BACKEND_SERVER}/review/delete`, request);
        const data = await response.json();
        if (response.status === 200) {
            setMessage("Message successfully deleted");
            setOpen(true);
            setLoading(true);
        }
        else {
            setMessage(data["error"]);
            setOpen(true);
        }
        setDeleteReviewId(-1);
    }

    // Code for interacting with the delete dialog.
    const handleOpenDialog = () => {
        handleClose();
        setDeleteReviewId(activeMenu["review"]["id"]);
    }

    const handleCloseDialog = () => {
        setDeleteReviewId(-1);
    };

    // Code for interacting with the menu.
    const open = Boolean(activeMenu["anchorEl"]);

    const handleClick = (target, review, isReply) => {
        const isUser = review["user_id"] == userId;
        setActiveMenu({
            review: review,
            anchorEl: target,
            isReply: isReply,
            isUser: isUser
        });
    };

    const handleClose = (event) => {
        if (event !== undefined) {
            event.preventDefault();
        }
        setActiveMenu({...activeMenu, "anchorEl": null});
    };

    return (
        <>
            <Grid container direction="row" justifyContent="space-between">
                <h3 style={{ display: "flex" }}>Reviews {reviews.length > 0 && <Rating value={eatery["rating"]} precision={0.5} readOnly size="large" style={{ marginLeft: "20px"}}/>}</h3>
                { isDiner == true && <AddReviewModal loyalty={loyalty} setLoading={setLoading} points={points} setPoints={setPoints} gainPoint={gainPoint} setGainPoint={setGainPoint} /> }
            </Grid>
            <h6 style={{
                textAlign: "left",
                marginBottom: "2.5%",
                marginLeft: "0.25%"
            }}>{reviews.length == 1 ? `${reviews.length} review` : `${reviews.length} reviews`}</h6>
            <Stack spacing={2} sx={{ marginBottom: "50px" }}>
                {reviews.map((review) =>
                    <Box key={review["id"]}>
                        <ReviewCard review={review} token={token} isReply={false} handleClick={handleClick} isDarkMode={isDarkMode} />
                    </Box>
                )}
                {reviews.length === 0 && <p>There are no reviews for this eatery yet.</p>}
            </Stack>
            <Menu
                anchorEl={activeMenu["anchorEl"]}
                open={open}
                onClose={handleClose}
            >
                { activeMenu["isUser"] &&
                    <MenuItem onClick={(event) => {
                        event.preventDefault();
                        handleClose();
                        setShowEditModal(true);
                    }} disableRipple>
                        <ListItemIcon>
                            <EditIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Edit</ListItemText>
                    </MenuItem>
                }
                { activeMenu["isUser"] &&
                    <MenuItem onClick={handleOpenDialog} disableRipple>
                        <ListItemIcon>
                            <DeleteIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Delete</ListItemText>
                    </MenuItem>
                }
                <MenuItem onClick={(event) => {
                    event.preventDefault();
                    handleClose();
                    setShowReplyModal(true);
                }} disableRipple>
                    <ListItemIcon>
                        <CommentIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Reply</ListItemText>
                </MenuItem>
            </Menu>
            {EditReviewModal(activeMenu, setLoading, showEditModal, setShowEditModal)}
            {AddReplyModal(activeMenu, setLoading, showReplyModal, setShowReplyModal)}
            <Dialog
                open={DeleteReviewId >= 0}
                onClose={handleCloseDialog}
            >
                <DialogTitle>
                {"Confirmation"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this message?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>No</Button>
                    <Button onClick={DeleteReview} autoFocus>Yes</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default FetchReviews;