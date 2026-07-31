function addDays(startDate, daysToAdd) {
  const result = new Date(startDate);
  result.setDate(result.getDate() + daysToAdd);
  return result;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

module.exports = { addDays, formatDate };