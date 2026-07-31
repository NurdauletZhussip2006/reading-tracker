const { MINUTES_PER_HOUR } = require('../config/constants');
const { addDays } = require('./dateUtils');

function calculateRemainingPages(totalPages, pagesRead) {
  return totalPages - pagesRead;
}

function calculateReadingHours(remainingPages, readingSpeed) {
  return remainingPages / readingSpeed;
}

function calculateDailyHours(minutesPerDay) {
  return minutesPerDay / MINUTES_PER_HOUR;
}

function calculateDaysNeeded(totalHours, dailyHours) {
  return Math.ceil(totalHours / dailyHours);
}

function calculateCompletionDate(startDate, daysNeeded) {
  return addDays(startDate, daysNeeded);
}

function buildReadingPlan({ totalPages, pagesRead, readingSpeed, minutesPerDay, startDate }) {
  const remainingPages = calculateRemainingPages(totalPages, pagesRead);
  const totalHours = calculateReadingHours(remainingPages, readingSpeed);
  const dailyHours = calculateDailyHours(minutesPerDay);
  const daysNeeded = calculateDaysNeeded(totalHours, dailyHours);
  const completionDate = calculateCompletionDate(startDate, daysNeeded);
  const progressPercent = Math.round((pagesRead / totalPages) * 100);

  return {
    remainingPages,
    totalHours: Number(totalHours.toFixed(1)),
    daysNeeded,
    completionDate,
    progressPercent,
  };
}

module.exports = {
  calculateRemainingPages,
  calculateReadingHours,
  calculateDailyHours,
  calculateDaysNeeded,
  calculateCompletionDate,
  buildReadingPlan,
};