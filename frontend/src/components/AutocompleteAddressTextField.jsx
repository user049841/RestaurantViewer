import React from 'react';
import { Autocomplete, Grid, TextField } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import Config from "../config.json";

const AutoCompleteAddressTextField = ({value, setValue, inputValue, setInputValue, setCoordinates}) => {
    const [options, setOptions] = React.useState([]);

    React.useEffect(() => {
        let active = true;

        if (inputValue === "") {
            setOptions(value ? [value] : []);
            return;
        }

        const FetchSuggestions = setTimeout(async () => {
            let response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${inputValue}&apiKey=${Config.GEOAPIFY_API_KEY}`);
            let data = await response.json();
            if (active && response.status === 200) {
                let newOptions = [];

                if (value) {
                    newOptions = [value];
                }

                if (data["features"].length > 0) {
                    let results = data["features"].map(e => e["properties"]);
                    newOptions = [...newOptions, ...results];
                }

                setOptions(newOptions);
            }
        }, 1000);

        return () => {
            clearTimeout(FetchSuggestions);
            active = false;
        };
    }, [value, inputValue]);

    /* To be able to use any address, add the below to the Autocomplete:
    freeSolo
    forcePopupIcon={true}
    */

  return (
    <Autocomplete
        getOptionLabel={(option) =>
            typeof option === 'string' ? option : option["formatted"]
        }
        filterOptions={(x) => x}
        options={options}
        autoComplete
        includeInputInList
        filterSelectedOptions
        value={value}
        noOptionsText="No locations"
        onChange={(event, newValue) => {
            setOptions(newValue ? [newValue, ...options] : options);
            setValue(typeof newValue === 'object' && newValue !== null ? newValue["formatted"] : newValue);
            if (newValue && typeof newValue === 'object') {
                setCoordinates({ "latitude": newValue["lat"], "longitude": newValue["lon"] });
            }
        }}
        onInputChange={(event, option) => {
            setInputValue(option);
        }}
        isOptionEqualToValue={(option, value) => option["formatted"] === value || option === value}
        renderInput={(params) => (
            <TextField {...params} size="small" label="Address" fullWidth />
        )}
        renderOption={(props, option) => {
            return (
            <li {...props}>
                <Grid container alignItems="center">
                <Grid item sx={{ display: 'flex', width: 44 }}>
                    <LocationOnIcon />
                </Grid>
                <Grid item sx={{ width: 'calc(100% - 44px)' }}>
                    {option["formatted"]}
                </Grid>
                </Grid>
            </li>
            );
        }}
        />
    );
}

export default AutoCompleteAddressTextField;