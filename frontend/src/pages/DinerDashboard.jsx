import React from 'react';
import { Button, Grid, Box, Paper } from "@mui/material";
import { Link } from "react-router-dom";
import { styled } from '@mui/material/styles';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import DiscountIcon from '@mui/icons-material/Discount';
import LockResetIcon from '@mui/icons-material/LockReset';

import ResetAccountPasswordModal from '../components/ResetAccountPasswordModal';

const Item = styled(Paper)(({ theme }) => ({
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: '260px',
    lineHeight: '80px',
    paddingTop: '30px'
}));

/**
 * The main menu page for a diner user. All diner actions are accessible from this page.
 */
const DinerDashboard = () => {
    return (
        <>
            <Box sx={{ margin:"2% auto 0 auto", width:"50%"}}>
                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 1, sm: 8, md: 12 }}>
                    <Grid item xs={2} sm={4} md={4} key={1}>
                        <Item className="dashboardItem">
                            <div>
                                <AccountBoxIcon sx={{ fontSize: '135px' }}/>
                            </div>
                            <Button variant="contained" size="large" component={Link} to="/diner/dashboard/profile">Profile details</Button>
                        </Item>
                    </Grid>
                    <Grid item xs={2} sm={4} md={4} key={2}>
                        <Item className="dashboardItem">
                            <div>
                                <DiscountIcon sx={{ fontSize: '135px' }}/>
                            </div>
                            <Button variant="contained" size="large" component={Link} to="/diner/dashboard/vouchers">View vouchers</Button>
                        </Item>
                    </Grid>
                    <Grid item xs={2} sm={4} md={4} key={3}>
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

export default DinerDashboard;