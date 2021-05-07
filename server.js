'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const PORT = process.env.PORT || 3001;
const app = express();
const CACHE = {};
app.use(cors());


app.get('/', (request, response) => {
  // when we get that request, send a response that says 'hello!'
  // response has some methods that are very helpful, such as a send method
  response.send('hello!');
});

app.get('/weather', getWeather);
function getWeather(request, response){

  //   const weatherQuery = request.query.citySearchedFor;
  
    const url = 'https://api.weatherbit.io/v2.0/forecast/daily';
    const query = {
      key: process.env.WEATHER_API_KEY,
      units: 'I',
      lat: request.query.lat,
      lon: request.query.lon
    };
  
    // USE superagent to make the api call. the DATA most care about lives at results.body
    superagent
      .get(url)
      .query(query)
      .then(weatherData => {
          response.json(weatherData.body.data.map(day => 
            (new DailyForecast(day))));
      })
      .catch(err => {
        console.error('error', err);
        response.status(500).send('error', err);
      });
  
  }
  
  
  function DailyForecast(day) {
      this.date = day.datetime;
      this.description = day.weather.description;
  }

app.get('/movies', getMovies);

function getMovies(request, response){
  const moviesQuery = request.query.citySearchedFor;

  if(CACHE[moviesQuery] && (Date.now() - CACHE[moviesQuery][0]) < (1000 * 60 * 60 * 24 * 7)) {
    console.log(`Cache hit, not making request to City ${moviesQuery}`);
    let previousResponseData = CACHE[moviesQuery][1];
    response.status(200).send(previousResponseData);
  } else {
    
    const url = 'https://api.themoviedb.org/3/search/movie';
    console.log(`Cache miss, making request to City  ${moviesQuery}`);
    const query = {
      api_key: process.env.MOVIE_API_KEY,
      query: moviesQuery
    };

  // USE superagent to make the api call. the DATA most care about lives at results.body
    superagent
    .get(url)
    .query(query)
    .then(movieData => {
      const moviesArr = movieData.body.results.map(movie => new MovieDisplay(movie));
      CACHE[moviesQuery] = [Date.now(), moviesArr];
      response.status(200).send(moviesArr);
    })
    .catch(err => {
      console.error('error', err);
      response.status(500).send('error', err);
    });
  }

}

function MovieDisplay(movie) {
  this.title = movie.original_title;
  this.overview = movie.overview;
  this.average_votes = movie.vote_average;
  this.total_votes = movie.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  this.popularity = movie.popularity;
  this.released_on = movie.release_date
}


app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
