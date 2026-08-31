import { getDb } from "../lib/mongodb.js";
import { requireAdmin } from "../lib/auth.js";
import { syncUserDays } from "../lib/subscription.js";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "GET") return res.status(405).json({ success:false, message:"Método no permitido" });
  try {
    const db = await getDb(); const users = db.collection("users");
    const data = await users.find({}).sort({ updatedAt:-1 }).limit(200).toArray();
    const now = new Date();
    const synced = [];
    for (const item of data) synced.push(await syncUserDays(users, item, now));
    return res.status(200).json({ success:true, users:synced.map(user=>({ telegramId:user.telegramId, username:user.username||"", credits:Number(user.credits)||0, days:Number(user.days)||0, daysExpiresAt:user.daysExpiresAt||null, updatedAt:user.updatedAt||null })) });
  } catch(error) { console.error(error); return res.status(500).json({ success:false, message:"Error interno del servidor" }); }
}
