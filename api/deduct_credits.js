import { getDb } from "../lib/mongodb.js";
import { requireAdmin } from "../lib/auth.js";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método no permitido" });
  }

  try {
    const telegramId = String(req.body?.telegramId || "").trim();
    const amount = Number(req.body?.amount);

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: "telegramId es obligatorio"
      });
    }

    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "amount debe ser un entero mayor que 0"
      });
    }

    const db = await getDb();
    const users = db.collection("users");
    const now = new Date();

    // Descuento atómico: solo descuenta si el usuario tiene saldo suficiente.
    // Así nunca se pueden producir créditos negativos por dos solicitudes simultáneas.
    const result = await users.updateOne(
      {
        telegramId,
        credits: { $gte: amount }
      },
      {
        $inc: { credits: -amount },
        $set: { updatedAt: now }
      }
    );

    if (result.matchedCount === 0) {
      const user = await users.findOne({ telegramId });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado"
        });
      }

      return res.status(409).json({
        success: false,
        message: "Créditos insuficientes",
        user: {
          telegramId: user.telegramId,
          username: user.username || "",
          credits: Number(user.credits) || 0,
          days: Number(user.days) || 0
        }
      });
    }

    const user = await users.findOne({ telegramId });

    return res.status(200).json({
      success: true,
      message: `Se descontaron ${amount} créditos`,
      deducted: amount,
      user: {
        telegramId: user.telegramId,
        username: user.username || "",
        credits: Number(user.credits) || 0,
        days: Number(user.days) || 0
      }
    });
  } catch (error) {
    console.error("[deduct_credits]", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
}
