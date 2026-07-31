function validateReadingPlanInput(input) {
  const errors = [];
  const { totalPages, pagesRead, readingSpeed, minutesPerDay, startDate } = input;

  if (isEmpty(totalPages)) errors.push('Total pages is required.');
  if (isEmpty(pagesRead)) errors.push('Pages already read is required.');
  if (isEmpty(readingSpeed)) errors.push('Reading speed is required.');
  if (isEmpty(minutesPerDay)) errors.push('Minutes available per day is required.');
  if (isEmpty(startDate)) errors.push('Reading start date is required.');

  if (errors.length > 0) {
    return { isValid: false, errors, data: null };
  }

  const totalPagesNum = Number(totalPages);
  const pagesReadNum = Number(pagesRead);
  const readingSpeedNum = Number(readingSpeed);
  const minutesPerDayNum = Number(minutesPerDay);

  if (!Number.isFinite(totalPagesNum)) errors.push('Total pages must be a valid number.');
  if (!Number.isFinite(pagesReadNum)) errors.push('Pages already read must be a valid number.');
  if (!Number.isFinite(readingSpeedNum)) errors.push('Reading speed must be a valid number.');
  if (!Number.isFinite(minutesPerDayNum)) errors.push('Minutes available per day must be a valid number.');

  if (errors.length > 0) {
    return { isValid: false, errors, data: null };
  }

  if (totalPagesNum <= 0) errors.push('Total pages must be greater than zero.');
  if (pagesReadNum < 0) errors.push('Pages already read cannot be negative.');
  if (readingSpeedNum <= 0) errors.push('Reading speed must be greater than zero.');
  if (minutesPerDayNum <= 0) errors.push('Minutes available per day must be greater than zero.');
  if (pagesReadNum > totalPagesNum) errors.push('Pages already read cannot exceed total pages.');

  const parsedDate = new Date(startDate);
  if (isNaN(parsedDate.getTime())) {
    errors.push('Reading start date is not a valid date.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, data: null };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      totalPages: totalPagesNum,
      pagesRead: pagesReadNum,
      readingSpeed: readingSpeedNum,
      minutesPerDay: minutesPerDayNum,
      startDate: parsedDate,
    },
  };
}

function isEmpty(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

module.exports = { validateReadingPlanInput };