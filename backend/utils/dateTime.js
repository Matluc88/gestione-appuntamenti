const BUSINESS_HOURS = {
  1: ['16:00', '19:00'],
  2: ['16:00', '19:00'],
  3: ['09:00', '12:00'],
  4: ['16:00', '19:00'],
  5: ['09:00', '12:00']
};

const APPOINTMENT_DURATION = 15;

function generateTimeSlots(startTime, endTime) {
  const slots = [];
  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);
  
  while (start < end) {
    slots.push(start.toTimeString().slice(0, 5));
    start.setMinutes(start.getMinutes() + APPOINTMENT_DURATION);
  }
  
  return slots;
}

function getAvailableSlots(dayOfWeek) {
  const hours = BUSINESS_HOURS[dayOfWeek];
  if (!hours) return [];
  
  return generateTimeSlots(hours[0], hours[1]);
}

function isBusinessDay(date) {
  const dayOfWeek = new Date(date).getDay();
  return dayOfWeek >= 1 && dayOfWeek <= 5 && BUSINESS_HOURS[dayOfWeek];
}

function isValidBookingDate(date) {
  const bookingDate = new Date(date);
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 15);
  
  return bookingDate >= today && bookingDate <= maxDate && isBusinessDay(date);
}

module.exports = {
  BUSINESS_HOURS,
  APPOINTMENT_DURATION,
  generateTimeSlots,
  getAvailableSlots,
  isBusinessDay,
  isValidBookingDate
};
