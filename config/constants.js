module.exports = {
  PORT: process.env.PORT || 3000,
  MINUTES_PER_HOUR: 60,
  APP_NAME: 'Digital Library & Reading Tracker',

  SUPPORTED_LANGUAGES: [
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
    { code: 'kk', name: 'Қазақша' },
  ],
JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
ACCESS_TOKEN_EXPIRY: '15m',
REFRESH_TOKEN_EXPIRY: '7d',
MAX_LOGIN_ATTEMPTS: 5,
LOCKOUT_DURATION_MINUTES: 15,
};
