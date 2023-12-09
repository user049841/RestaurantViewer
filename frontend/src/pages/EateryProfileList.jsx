import React from 'react';
import { Box, Grid, Pagination, PaginationItem, Stack, Tab } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { TabContext, TabList } from '@mui/lab';
import { useEffect, useState, useContext } from 'react';

import { AuthContext, SnackbarContext } from '../App';
import FetchEateries from '../components/FetchEateries';
import SearchFilter from '../components/SearchFilter';
import Config from "../config.json";

export const EateryContext = React.createContext();

/**
 * Function for finding recommended eateries based on diner history and reviews.
 */
function CalculateRecommended(eateries, setShowEateries, tags, visited, blacklist) {
    let temp = JSON.parse(JSON.stringify(eateries));
    let toDelete = [];
    for (let i = 0; i < temp.length; i++) {
        let eatery = temp[i];
        if (visited.includes(eatery["name"])) {
            temp.splice(i, 1);
            i -= 1;
        }
        else if (blacklist.includes(eatery["id"])) {
            temp.splice(i, 1);
            i -= 1;
        }

        else if (tags.length > 0) {
            let shareTags = false;
            for (let j = 0; j < tags.length; j++) {
                if (eatery["tags"] && eatery["tags"].includes(tags[j])) {
                    shareTags = true
                    break
                }
            }
            if (!shareTags) {
                toDelete.push(eatery);
            }
        }
    }

    if (toDelete.length < temp.length) {
        for (let i = 0; i < toDelete.length; i++) {
            temp.splice(temp.indexOf(toDelete[i]), 1)
        }
    }

    temp.sort(function (a, b) {
        var x = a["num_reviews"]; var y = b["num_reviews"];
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });

    if (temp.length >= 6) {
        temp = temp.slice(0, 6);
    }
    temp.sort(function (a, b) {
        var x = a["rating"]; var y = b["rating"];
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
    setShowEateries(temp);
}

/**
 * The page for browsing eateries at a glance, available to all users.
 */
const EateryProfileList = () => {
    const [eateries, setEateries] = useState([]);
    const [tab, setTab] = useState("1");
    const [showEateries, setShowEateries] = useState([]);
    const [pageCount, setPageCount] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [tags, setTags] = useState([]);
    const [visited, setVisited] = useState([]);
    const [blacklist, setBlacklist] = useState([]);
    const { setOpen, setMessage } = useContext(SnackbarContext);
    const { isDiner, userId } = useContext(AuthContext);

    const handleTabChange = (event, newValue) => {
        setTab(newValue);
        if (newValue === "2") {
            CalculateRecommended(eateries, setShowEateries, tags, visited, blacklist);
        }
        else {
            setShowEateries(eateries);
        }
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    useEffect(() => {
        setPageCount(Math.ceil(showEateries.length / 12));
        setPage(1);
    }, [showEateries]);

    useEffect(() => {
        if (!loading) {
            return;
        }
        const Fetch = async () => {
            let request = {
                method: "GET",
            }
            const response = await fetch(`http://${Config.BACKEND_SERVER}/user/profile/diner/${userId}`, request);
            const data = await response.json();
            if (response.status === 200) {
                setTags(data["diner"]["recommend_tags"])
                setVisited(data["diner"]["visited"])
                setBlacklist(data["diner"]["blacklist"])
            }
            else {
                setMessage(data["message"]);
                setOpen(true);
            }
            setLoading(false);
        }
        if (isDiner) {
            Fetch()
        }

    }, [setMessage, setOpen, loading, userId, isDiner]);

    return (
        <EateryContext.Provider value={{eateries, setEateries, showEateries, setShowEateries, page, setPage}}>
            <Box style={{
                marginTop: "1%"
            }}>
                <TabContext value={tab}>
                    <h1>Eateries</h1>
                    <Stack
                        direction="column"
                        alignItems="center"
                        justifyContent="center"
                    >
                    <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        justifyContent="center"
                    >
                        <TabList sx={{ borderBottom: 1, borderColor: 'divider' }} onChange={handleTabChange}>
                            <Tab label="All" value="1"/>
                            {isDiner && <Tab label="Recommended" value="2" />}
                        </TabList>
                    </Stack>
                    {tab !== "2" && <SearchFilter />}
                    <Grid container style={{
                        paddingLeft: "4%",
                        paddingRight: "4%",
                        paddingTop: "1%",
                        paddingBottom: "1%"
                    }}>
                        <FetchEateries />
                    </Grid>
                    </Stack>
                    <Pagination
                        count={pageCount}
                        page={page}
                        onChange={handlePageChange}
                        renderItem={(item) => (
                            <PaginationItem
                            slots={{ previous: ArrowBackIcon, next: ArrowForwardIcon }}
                            {...item}
                            />
                        )}
                        sx={{
                            position: "fixed",
                            left: "50%",
                            bottom: 0,
                            transform: "translate(-50%, 0%)",
                            paddingBottom: "0.5%"
                        }}
                    />
                </TabContext>
            </Box>
        </EateryContext.Provider>
    )
}

export default EateryProfileList;