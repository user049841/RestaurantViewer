import React from 'react';
import { Button, Grid, Box, Paper } from "@mui/material";
import { Link } from "react-router-dom";
import { styled } from '@mui/material/styles';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DiscountIcon from '@mui/icons-material/Discount';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockResetIcon from '@mui/icons-material/LockReset';

import CreateDiscountVoucherModal from '../components/CreateDiscountVoucherModal';
import VerifyDiscountVoucherModal from '../components/VerifyDiscountVoucherModal';
import ResetAccountPasswordModal from '../components/ResetAccountPasswordModal';

const Item = styled(Paper)(({ theme }) => ({
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: '260px',
    lineHeight: '80px',
    paddingTop: '30px'
}));

/**
 * The main menu page for an eatery user. All eatery actions are accessible from this page.
 */
const EateryDashboard = () => {
    return (
        <>
            <Box sx={{ margin:"2% auto 0 auto", width:"50%"}}>
                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 1, sm: 8, md: 12 }}>
                    <Grid item xs={2} sm={4} md={4} key={0}>
                        <Item className="dashboardItem">
                            <div>
                                <MenuBookIcon sx={{ fontSize: '135px' }}/>
                            </div>
                            <Button variant="contained" size="large" component={Link} to="/eatery/dashboard/menu">Edit menu</Button>
                        </Item>
                    </Grid>
                    <Grid item xs={2} sm={4} md={4} key={1}>
                        <Item className="dashboardItem">
                            <div>
                                <AccountBoxIcon sx={{ fontSize: '135px' }}/>
                            </div>
                            <Button variant="contained" size="large" component={Link} to="/eatery/dashboard/profile">Profile details</Button>
                        </Item>
                    </Grid>
                    <Grid item xs={2} sm={4} md={4} key={2}>
                        <Item className="dashboardItem">
                            <div>
                                <LoyaltyIcon sx={{ fontSize: '135px' }}/>
                            </div>
                            <Button variant="contained" size="large" component={Link} to="/eatery/dashboard/loyalty">Loyalty system</Button>
                        </Item>
                    </Grid>
                    <Grid item xs={2} sm={4} md={4} key={3}>
                        <Item className="dashboardItem">
                            <div>
                                <LocalOfferIcon sx={{ fontSize: '135px' }}/>
                            </div>
                            <CreateDiscountVoucherModal/>
                        </Item>
                    </Grid>
                    <Grid item xs={2} sm={4} md={4} key={4}>
                        <Item className="dashboardItem">
                            <div>
                                <DiscountIcon sx={{ fontSize: '135px' }}/>
                            </div>
                            <Button variant="contained" size="large" component={Link} to="/eatery/dashboard/vouchers">View vouchers</Button>
                        </Item>
                    </Grid>
                    <Grid item xs={2} sm={4} md={4} key={5}>
                        <Item className="dashboardItem">
                            <div>
                                <CheckCircleIcon sx={{ fontSize: '135px' }}/>
                            </div>
                            <VerifyDiscountVoucherModal/>
                        </Item>
                    </Grid>
                    <Grid item xs={2} sm={4} md={4} key={6}>
                        <Item className="dashboardItem">
                            <div>
                                <LockResetIcon sx={{ fontSize: '135px' }}/>
                            </div>
                            <ResetAccountPasswordModal />
                        </Item>
                    </Grid>
                </Grid>
            </Box>
        </>
    )
}

export default EateryDashboard;