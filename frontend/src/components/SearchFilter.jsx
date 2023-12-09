import React from 'react';
import { Button, Chip, Stack, Autocomplete, TextField, Select, FormControl, MenuItem, InputLabel, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useContext, useState } from 'react';
import { EateryContext } from '../pages/EateryProfileList';

/**
 * Function to check if eatery name or tags match keyword.
 */
function matchSearch(eatery, filters) {
    let match = true;
    filters.forEach((filter) => {
        filter = filter.toLowerCase();
        if ((!eatery["tags"] || eatery["tags"].filter(e => e.toLowerCase().includes(filter)).length === 0) && !eatery["name"].toLowerCase().includes(filter)) {
            match = false;
        }
    })
    return match;
}

/**
 * The component for the eatery list search/filter bar. Allows sorting and filtering by price, distance, ratings and manual search.
 */
const SearchFilter = () => {
    const { eateries, setShowEateries } = useContext(EateryContext);
    const [ sortBy, setSortBy ]= useState("none");
    const [ priceFilters, setPriceFilters ]= useState(["$", "$$", "$$$"]);
    const [ filters, setFilters ]= useState([]);
    const [ distFilter, setDistFilter ]= useState("");

    const Apply = () => {
        let filtered = JSON.parse(JSON.stringify(eateries))
        if (filters.length > 0) {
            filtered = [];
            eateries.forEach((eatery) => {
                if (matchSearch(eatery, filters)) {
                    filtered.push(eatery);
                }
            })

        }

        for (let i = 0; i < filtered.length; i++) {
            let eatery = filtered[i];
            if (!priceFilters.includes(eatery["pricing"])) {
                filtered.splice(i, 1);
                i -= 1;
            }
        }

        for (let i = 0; i < filtered.length; i++) {
            let eatery = filtered[i];
            if (distFilter && eatery["distance"] !== -1 && distFilter < eatery["distance"]) {
                filtered.splice(i, 1);
                i -= 1;
            }
        }

        /* Sort by rating and dist aswell */
        if (sortBy === "price") {
            filtered.sort(function(a, b) {
                var x = a["pricing"]; var y = b["pricing"];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        }
        if (sortBy === "rating") {
            filtered.sort(function(a, b) {
                var x = a["rating"]; var y = b["rating"];
                return ((x > y) ? -1 : ((x < y) ? 1 : 0));
            });
        }
        if (sortBy === "distance") {
            filtered.sort(function(a, b) {
                var x = parseFloat(a["distance"]); var y = parseFloat(b["distance"]);
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        }
        setShowEateries(filtered);
    }

    return (
        <Stack
            direction="row"
            component="form"
            alignItems="center"
            justifyContent="center"
            marginTop="1.5%"
            marginBottom="0.5%"
        >
            <FormControl size="small" name="sortBy">
                <InputLabel>Sort By</InputLabel>
                <Select label="Sort By" sx={{
                        minWidth:"100px",
                        backgroundColor:"#D3D3D3"
                    }}
                    autoWidth
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                >
                    <MenuItem value={"none"}>None</MenuItem>
                    <MenuItem value={"price"}>Cheapest</MenuItem>
                    <MenuItem value={"distance"}>Closest</MenuItem>
                    <MenuItem value={"rating"}>Highest Rated</MenuItem>
                </Select>
            </FormControl>
            <ToggleButtonGroup
                value={priceFilters}
                onChange={(event, newPriceFilters) => {
                    setPriceFilters(newPriceFilters);
                }}
                name="priceFilters"
                size="small"
            >
                <ToggleButton value="$" sx={{width:"40px", fontWeight:"bold"}}>$</ToggleButton>
                <ToggleButton value="$$" sx={{width:"40px", fontWeight:"bold"}}>$$</ToggleButton>
                <ToggleButton value="$$$" sx={{width:"40px", fontWeight:"bold"}}>$$$</ToggleButton>
            </ToggleButtonGroup>
            <TextField
                value={distFilter}
                onChange={e => setDistFilter(e.target.value)}
                name="name"
                label="Distance (km)"
                placeholder=""
                size="small"
                type="number"
                sx={{ width:"135px" }}
            />
            <Autocomplete
                multiple
                name="filters"
                size="small"
                freeSolo
                options={[]}
                onChange={(event, newFilters) => {
                    setFilters(newFilters);
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Search Filters"
                        placeholder="Filter by keyword"
                    />
                )}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <Chip variant="outlined" size="small" label={"Search: " + option} {...getTagProps({ index })} />
                    ))
                }
                sx ={{ minWidth: "25vw", maxWidth: "60vw" }}
            />
            <Button variant="contained" sx={{ marginLeft: "1px" }} onClick={(event) => {
                event.preventDefault();
                Apply();
            }}>Apply</Button>
        </Stack>
    )
}

export default SearchFilter;