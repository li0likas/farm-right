export default () => ({
    port: parseInt(process.env.PORT, 10) || 3333,
    database: {
      url: process.env.DATABASE_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '60m',
    },
    weather: {
      apiKey: process.env.OPENWEATHER_API_KEY,
      forecastUrl: 'https://api.openweathermap.org/data/2.5/forecast',
      currentWeatherUrl: 'https://api.openweathermap.org/data/2.5/weather',
      units: process.env.WEATHER_UNITS || 'metric',
    },
    ai: {
      openaiApiKey: process.env.OPENAI_API_KEY,
      chatGptApiUrl: 'https://api.openai.com/v1/chat/completions',
      model: process.env.OPENAI_MODEL || 'gpt-4o',
    },
    email: {
      user: process.env.USER,
      password: process.env.PASSWORD,
      from: process.env.EMAIL_FROM || 'noreply@gmail.com',
    },
    uploads: {
      userPhotoPath: process.env.USER_PHOTO_PATH || './uploads/userimages/',
    },
    app: {
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    },
    swagger: {
      title: process.env.API_TITLE || 'Farm API',
      description: process.env.API_DESCRIPTION || 'The farm API description',
      version: process.env.API_VERSION || '1.0',
    },
  });