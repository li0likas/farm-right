import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Weather = ({ location }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [locationInfo, setLocationInfo] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/weather/${location}`);
        setWeatherData(response.data.weatherData);
        setRecommendations(response.data.recommendations);
        setLocationInfo(response.data.locationInfo); // Assuming the API returns location info
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };

    fetchWeather();
  }, [location]);

  return (
    <div>
      <h2>Weather Forecast for {locationInfo ? `${locationInfo.name}, ${locationInfo.country}` : location}</h2>
      {weatherData && (
        <div>
          <p>Temperature: {weatherData.forecastTimestamps[0].airTemperature}°C</p>
          <p>Wind Speed: {weatherData.forecastTimestamps[0].windSpeed} m/s</p>
          <p>Precipitation: {weatherData.forecastTimestamps[0].precipitation} mm</p>
        </div>
      )}
      <h3>Recommendations</h3>
      <ul>
        {recommendations.map((rec, index) => (
          <li key={index}>{rec}</li>
        ))}
      </ul>
    </div>
  );
};

export default Weather;