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
};
