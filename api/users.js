import { getDb } from "../lib/mongodb.js";
import { requireAdmin } from "../lib/auth.js";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Método no permitido" });
  }

  try {
    const db = await getDb();
    const users = db.collection("users");

    const data = await users
      .find({})
      .sort({ updatedAt: -1 })
      .limit(200)
      .toArray();

    return res.status(200).json({
      success: true,
      users: data.map(user => ({
        telegramId: user.telegramId,
        username: user.username || "",
        credits: user.credits || 0,
        days: user.days || 0,
        updatedAt: user.updatedAt || null
      }))
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
}
