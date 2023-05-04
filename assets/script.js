$(document).ready(function () {

    // OpenWeather API
    const apiKey = '767baab1ba615005b7b57e268ed513fe';

    const cityEl = $('h2#city');
    const dateEl = $('h3#date');
    const weatherIconEl = $('img#weather-icon');
    const temperatureEl = $('span#temperature');
    const humidityEl = $('span#humidity');
    const windEl = $('span#wind');
    const IndexEl = $('span#index');
    const cityListEl = $('div.cityList');

    const cityInput = $('#city-input');

    // Store past searched cities
    var pastCities = [];

    function compare(a, b) {

        const cityA = a.city.toUpperCase();
        const cityB = b.city.toUpperCase();

        var comparison = 0;
        if (cityA > cityB) {
            comparison = 1;
        } else if (cityA < cityB) {
            comparison = -1;
        }
        return comparison;
    }

    // Local storage functions for past searched cities

    // Load events from local storage
    function loadCities() {
        const storedCities = JSON.parse(localStorage.getItem('pastCities'));
        if (storedCities) {
            pastCities = storedCities;
        }
    }

    // Store searched cities in local storage
    function storeCities() {
        localStorage.setItem('pastCities', JSON.stringify(pastCities));
    }

    // Functions to build the URL for the OpenWeather API call

    function buildURLFromInputs(city) {
        if (city) {
            return `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
        }
    }

    function buildURLFromId(id) {
        return `https://api.openweathermap.org/data/2.5/weather?id=${id}&appid=${apiKey}`;
    }

    // Function to display the last 5 searched cities
    function displayCities(pastCities) {
        cityListEl.empty();
        pastCities.splice(5);
        var sortedCities = [...pastCities];
        sortedCities.sort(compare);
        sortedCities.forEach(function (location) {
            var cityDiv = $('<div>').addClass('col-12 city');
            var cityBtn = $('<button>').addClass('btn btn-light city-btn').text(location.city);
            cityDiv.append(cityBtn);
            cityListEl.append(cityDiv);
        });
    }

    function setUVIndexColor(uvi) {
        if (uvi < 3) {
            return 'green';
        } else if (uvi >= 3 && uvi < 6) {
            return 'yellow';
        } else if (uvi >= 6 && uvi < 8) {
            return 'orange';
        } else if (uvi >= 8 && uvi < 11) {
            return 'red';
        } else return 'purple';
    }

    // displays last city
    function displayLastSearchedCity() {
        if (pastCities[0]) {
            var queryURL = buildURLFromId(pastCities[0].id);
            searchWeather(queryURL);
        } else {
            // if no past searched cities, load Austin weather data
            var queryURL = buildURLFromInputs("Austiin");
            searchWeather(queryURL);
        }
    }


    // Search for weather conditions by calling the OpenWeather API
    function searchWeather(queryURL) {

        $.ajax({
            url: queryURL,
            method: 'GET'
        }).then(function (response) {

            var city = response.name;
            var id = response.id;
            // Remove duplicate cities
            if (pastCities[0]) {
                pastCities = $.grep(pastCities, function (storedCity) {
                    return id !== storedCity.id;
                })
            }
            pastCities.unshift({ city, id });
            storeCities();
            displayCities(pastCities);

            // Call OpenWeather API
            var lat = response.coord.lat;
            var lon = response.coord.lon;
            var queryURLAll = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}`;
            $.ajax({
                url: queryURLAll,
                method: 'GET'
            }).then(function (response) {
                var Index = response.current.uvi;
                var uvColor = setUVIndexColor(Index);
                IndexEl.text(response.current.uvi);
                IndexEl.attr('style', `background-color: ${uvColor}; color: ${uvColor === "yellow" ? "black" : "white"}`);
                var weekDay = response.daily;

                // Display 5 day forecast in DOM
                for (var i = 0; i <= 5; i++) {
                    var currDay = weekDay[i];
                    $(`div.day-${i} .card-title`).text(moment.unix(currDay.dt).format('L'));
                    $(`div.day-${i} .weekDay-img`).attr(
                        'src',
                        `http://openweathermap.org/img/wn/${currDay.weather[0].icon}.png`
                    ).attr('alt', currDay.weather[0].description);
                    $(`div.day-${i} .weekDay-temperature`).text(((currDay.temp.day - 273.15) * 1.8 + 32).toFixed(1));
                    $(`div.day-${i} .weekDay-humidity`).text(currDay.humidity);
                    $(`div.day-${i} .wind`).text(currDay.wind);
                }
            });

            // Display current weather in DOM elements
            cityEl.text(response.name);
            var formattedDate = moment.unix(response.dt).format('L');
            dateEl.text(formattedDate);
            var weatherIcon = response.weather[0].icon;
            weatherIconEl.attr('src', `http://openweathermap.org/img/wn/${weatherIcon}.png`).attr('alt', response.weather[0].description);
            temperatureEl.html(((response.main.temp - 273.15) * 1.8 + 32).toFixed(1));
            humidityEl.text(response.main.humidity);
            windEl.text((response.wind.speed * 2.237).toFixed(1));

        });
    }

    $('#search-btn').on('click', function (event) {
        // Preventing the button from trying to submit the form
        event.preventDefault();

        let city = cityInput.val().trim();
        city = city.replace(' ', '%20');

        cityInput.val('');

        if (city) {
            var queryURL = buildURLFromInputs(city);
            searchWeather(queryURL);
        }
    });

    $(document).on("click", "button.city-btn", function (event) {
        var clickedCity = $(this).text();
        var foundCity = $.grep(pastCities, function (storedCity) {
            return clickedCity === storedCity.city;
        })
        var queryURL = buildURLFromId(foundCity[0].id)
        searchWeather(queryURL);
    });

    loadCities();
    displayCities(pastCities);

    // Display last city searched
    displayLastSearchedCity();

});