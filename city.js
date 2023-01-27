/* Requirements Detail:
    Build a project that pulls data from APIs to obtain real-time information. 
    Say you would like to specify details for a specific city for the past 24 hours.
    Your app will take a city name as input, and returns:
        o Population
        o Elevation
        o Current temperature
    You can work under the assumption that the city is always in South Africa.
*/

// ======================================================= Fetch city information ===========================================
// API https://wft-geo-db.p.rapidapi.com/v1/geo/cities privides info about cities. 
// We will retrive city information using two parameters: CountryIds - ZA (South Africa), and namePrefix - supplied country name 
// this API endpoint/parameters combination does not return city elevation though. We wiil use this API endpoint and city id combination to fetch elevation details later.

const optionsCity = {
    method: 'GET',
    headers: {
        'X-RapidAPI-Key': '<your key>',
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
    }
}

const getCityInfo = (cityNm) => {
    const urlCity = `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=10&countryIds=ZA&namePrefix=${cityNm}`
    // return cityRec = fetch(urlCity, optionsCity)
    return fetch(urlCity, optionsCity)
        .then(response => {
            // console.log(`${response.status}: ${response.statusText}`)                                    // Will show the response status
            if (!response.ok) {
                throw new Error("Error1: Falied to get city info. HTTP status: " + response.status);        // creating Error() object
            }
            return response.json()
        })
        .then(result => {
            if (result.data.length == 0) {
                throw new Error(`Error2: No record found for this city - ${cityNm}. Please try again`)
            }
            else {
                for (record of result.data) {
                    if (record.city == cityNm) {
                        return record
                    }
                }
            }
        })
        .catch(error => {
            console.log(error)
            // console.log(`${error.name}: ${error.message}: ${error.cause} \n${error.stack}`)              // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
            return null
        })
}

// We have to use same API endpoint (https://wft-geo-db.p.rapidapi.com/v1/geo/cities) with city id combination to fetch elevation details.
// However, as I have a 'Basic Plan' for Rapid API website, it will not allow to call the same api within one second, 
// thus, added a delay of 1 second. Reference: https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep

const getElevationDetails = async (cityId) => {
    const urlCityDetails = `https://wft-geo-db.p.rapidapi.com/v1/geo/cities/${cityId}`

    await new Promise(resolve => setTimeout(resolve, 1000))                                                 // delay of 1 second
    return fetch(urlCityDetails, optionsCity)
        .then(response => {
            if (!response.ok) {
                throw new Error("Error2: Falied to get elevation info. HTTP status:" + response.status);
            }
            return response.json()
        })
        .then(result => result.data.elevationMeters)
        .catch(error => {
            console.log(error)
        })
}

// Get city temparature using weather API - https://weatherbit-v1-mashape.p.rapidapi.com/current
const getCityTeamparature = (lon, lat) => {
    const optionsWeather = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': '<your key>',
            'X-RapidAPI-Host': 'weatherbit-v1-mashape.p.rapidapi.com'
        }
    }
    const urlCityWeather = `https://weatherbit-v1-mashape.p.rapidapi.com/current?lon=${lon}&lat=${lat}`

    return fetch(urlCityWeather, optionsWeather)
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP status " + response.status);
            }
            return response.json()
        })
        .then(result => result.data[0].temp)
        .catch(error => {
            console.log(error)
        })
}

// Note: we should call .then on the promise to capture the results regardless of the promise state(resolved or still pending).
// Promises are forward direction only; You can only resolve them once.The resolved value of a Promise is passed to its.then or.catch methods.
const displayCityInfo = (cityName) => {
    let cityMap = new Map()
    let elevation = 'N/A'
    let temparature = 'N/A'

    // get city information. The function getCityInfo() will return a promise    
    getCityInfo(cityName)
        .then(city => {
            if (city != null) {
                const cityElevation = getElevationDetails(city.id)                              // get city elevation details. It will return a promise.
                const cityTemp = getCityTeamparature(city.longitude, city.latitude)             // get current temparature. It will return a promise.

                // https://stackoverflow.com/questions/59784175/differences-between-promise-all-and-promise-allsettled-in-js
                Promise.allSettled([cityElevation, cityTemp])
                    .then(resAry => {
                        if (resAry[0].status == 'fulfilled' && resAry[0].value != null) {
                            elevation = resAry[0].value
                        }
                        if (resAry[1].status == 'fulfilled' && resAry[1].value != null) {
                            temparature = resAry[1].value
                        }

                        // populate cityMap
                        cityMap.set("Name", city.name)
                        cityMap.set("Population", city.population)
                        cityMap.set("Elevation in meters", elevation)
                        cityMap.set("Current Temparature in centigrade", temparature)

                        // print information
                        console.log("City Information:");
                        for (let [key, value] of cityMap) {
                            console.log(`${key}: ${value}`);
                        }
                    });
            }
            else {
                throw new Error("Error3: Please provide full/correct name of the city.");
            }
        })
        .catch(err => {
            console.log(err)
        })
}

// ======================================================= User Input and Validation =====================================

const validateInput = (input) => {
    try {
        if (input == "") {                                                                    // check whether input is blank or not
            let msg = "Error52: No field can be left blank. Try again."
            alert(msg)
            throw msg
        }
        return true
    }
    catch (err) {
        console.log(err)
        return false
    }
}

const userInput = () => {
    let cityName = prompt("Please enter a city in South Africa: ").trim()
    if (validateInput(cityName)) {
        // converting input to Initcap
        const words = cityName.split(" ");
        cityName = words.map((word) => {
            return word[0].toUpperCase() + word.substring(1);
        }).join(" ")

        displayCityInfo(cityName)                                                       // calling the function to get city related details and print them
    }
}

userInput()
