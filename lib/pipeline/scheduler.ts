export function buildDailyPublishingSlots(day: Date, count = 10) {
  const startHour = 7;
  const endHour = 23;
  const minutesWindow = (endHour - startHour) * 60;
  const step = Math.floor(minutesWindow / Math.max(1, count));

  const slots: Date[] = [];
  for (let i = 0; i < count; i += 1) {
    const totalMinutes = startHour * 60 + i * step;
    const date = new Date(day);
    date.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
    slots.push(date);
  }

  return slots;
}

export function getNextPublishingDay(from = new Date()) {
  const next = new Date(from);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}
