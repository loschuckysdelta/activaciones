const DAY_MS = 24 * 60 * 60 * 1000;

export function remainingDays(user, now = new Date()) {
  const expiry = user?.daysExpiresAt ? new Date(user.daysExpiresAt) : null;
  if (expiry && !Number.isNaN(expiry.getTime())) {
    return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / DAY_MS));
  }
  return Math.max(0, Number(user?.days) || 0);
}

// Compatibilidad con registros antiguos que solo tenían `days`.
// La primera vez que se leen después de esta actualización, esos días
// se convierten en una fecha de vencimiento real desde ese momento.
export async function syncUserDays(users, user, now = new Date()) {
  if (!user) return user;
  let expiry = user.daysExpiresAt ? new Date(user.daysExpiresAt) : null;
  const storedDays = Math.max(0, Number(user.days) || 0);

  if ((!expiry || Number.isNaN(expiry.getTime())) && storedDays > 0) {
    expiry = new Date(now.getTime() + storedDays * DAY_MS);
    await users.updateOne(
      { _id: user._id },
      { $set: { daysExpiresAt: expiry, days: storedDays } }
    );
    user.daysExpiresAt = expiry;
    user.days = storedDays;
    return user;
  }

  const days = expiry ? Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / DAY_MS)) : 0;
  const expired = expiry && expiry.getTime() <= now.getTime();
  const normalizedExpiry = expired ? null : expiry;

  if (days !== storedDays || expired) {
    await users.updateOne(
      { _id: user._id },
      { $set: { days, daysExpiresAt: normalizedExpiry } }
    );
  }
  user.days = days;
  user.daysExpiresAt = normalizedExpiry;
  return user;
}

export async function addSubscriptionDays(users, telegramId, amount, now = new Date()) {
  let user = await users.findOne({ telegramId });
  if (user) user = await syncUserDays(users, user, now);

  const currentExpiry = user?.daysExpiresAt ? new Date(user.daysExpiresAt) : null;
  const base = currentExpiry && currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
  const newExpiry = new Date(base.getTime() + amount * DAY_MS);
  const days = Math.max(0, Math.ceil((newExpiry.getTime() - now.getTime()) / DAY_MS));

  await users.updateOne(
    { telegramId },
    {
      $setOnInsert: { telegramId, username: "", credits: 0, createdAt: now },
      $set: { days, daysExpiresAt: newExpiry, updatedAt: now }
    },
    { upsert: true }
  );
  return syncUserDays(users, await users.findOne({ telegramId }), now);
}

export async function setSubscriptionDays(users, telegramId, amount, now = new Date()) {
  const expiry = amount > 0 ? new Date(now.getTime() + amount * DAY_MS) : null;
  await users.updateOne(
    { telegramId },
    {
      $setOnInsert: { telegramId, username: "", credits: 0, createdAt: now },
      $set: { days: amount, daysExpiresAt: expiry, updatedAt: now }
    },
    { upsert: true }
  );
  return syncUserDays(users, await users.findOne({ telegramId }), now);
}
