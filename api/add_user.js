import { getDb } from "../lib/mongodb.js";
import { requireAdmin } from "../lib/auth.js";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método no permitido" });
  }

  try {
    const telegramId = String(req.body?.telegramId || "").trim();
    const username = String(req.body?.username || "").trim();
    const credits = Number(req.body?.credits ?? 0);
    const days = Number(req.body?.days ?? 0);

    if (!telegramId) {
      return res.status(400).json({ success: false, message: "telegramId es obligatorio" });
    }
    if (!Number.isInteger(credits) || credits < 0) {
      return res.status(400).json({ success: false, message: "credits debe ser un entero mayor o igual a 0" });
    }
    if (!Number.isInteger(days) || days < 0) {
      return res.status(400).json({ success: false, message: "days debe ser un entero mayor o igual a 0" });
    }

    const db = await getDb();
    const users = db.collection("users");
    const now = new Date();

    await users.updateOne(
      { telegramId },
      {
        $setOnInsert: { createdAt: now },
        $set: {
          telegramId,
          username,
          credits,
          days,
          updatedAt: now
        }
      },
      { upsert: true }
    );

    const user = await users.findOne({ telegramId });

    return res.status(200).json({
      success: true,
      message: "Registro agregado o actualizado",
      user: {
        telegramId: user.telegramId,
        username: user.username || "",
        credits: user.credits || 0,
        days: user.days || 0
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
}
