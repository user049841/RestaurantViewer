import { Avatar, Box, Card, CardContent, CardHeader, Chip, Divider, IconButton, Rating, Stack } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import React from 'react';

/**
 * The component for an individual review card.
 */
/*eslint-disable eqeqeq*/
const ReviewCard = ({review, token, isReply, handleClick, isDarkMode}) => {
    return (
        <>
            <Card style={{
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
            }} elevation={3} >
                <CardHeader
                    avatar={
                        <>
                            { review["deleted"] == true &&
                                <Avatar>D</Avatar>
                            }
                            { review["deleted"] == false &&
                                <Avatar alt="user-icon" src={review["avatar"]} />
                            }
                        </>
                    }
                    title={
                        <Box justifyContent="space-between" style={{
                            marginRight: "2%",
                            fontSize: "1.5rem"
                        }}>
                            { review["deleted"] == true &&
                                <Chip label="Deleted" size="medium" style={{
                                    fontSize: "1.1rem"
                                }}/>
                            }
                            { review["deleted"] == false &&
                                <>
                                    <Chip label={review["username"]} size="medium" style={{
                                        fontSize: "1.1rem"
                                    }}/>
                                    { token != null &&
                                        <IconButton
                                            onClick={(event) => {
                                                event.preventDefault()
                                                handleClick(event.currentTarget, review, isReply)
                                            }}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    }
                                    { isReply == false &&
                                        <Rating style={{ float: "right" }} value={review["rating"]} precision={0.5} readOnly size="medium" />
                                    }
                                </>
                            }

                        </Box>
                    }
                    subheader={
                        <Box style={{
                            marginLeft: "1%"
                        }}>
                            {review["deleted"] == true && "This message has been removed."}
                            {review["deleted"] == false &&
                                <>
                                    {isReply == true && "Replied"}
                                    {isReply == false && "Posted"}
                                    {" on " + new Date(review["date"]).toLocaleString()}
                                    {review["edited"] == true && " (edited)"}
                                </>
                            }
                        </Box>
                    }
                    style={{
                        textAlign: "left"
                    }}
                />
                <Divider variant="middle" />
                {review["deleted"] == false &&
                    <CardContent style={{
                        textAlign: "left"
                    }}>
                        <h5>{review["title"]}</h5>
                        {review["description"]}
                    </CardContent>
                }
            </Card>
            { review["replies"].length > 0 &&
                <Stack spacing={1} style={{
                    backgroundColor: isDarkMode ? "#0f0f0f" : "rgba(255, 255, 255, 0.3)",
                    paddingTop: "1%",   
                    paddingRight: "0%"
                }}>
                    {review["replies"].map((reply) =>
                        <Box key={reply["id"]} style={{
                            marginLeft: "1%"
                        }}>
                            <ReviewCard review={reply} token={token} isReply={true} handleClick={handleClick}/>
                        </Box>
                    )}
                </Stack>
            }
        </>
    )
}

export default ReviewCard;