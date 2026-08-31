import { getDb } from "../lib/mongodb.js";
import { requireAdmin } from "../lib/auth.js";
import { syncUserDays } from "../lib/subscription.js";
const DAY_MS=24*60*60*1000;
export default async function handler(req,res){
 if(!requireAdmin(req,res)) return;
 if(req.method!=="POST") return res.status(405).json({success:false,message:"Método no permitido"});
 try{
  const telegramId=String(req.body?.telegramId||"").trim(), username=String(req.body?.username||"").trim();
  const credits=Number(req.body?.credits??0), days=Number(req.body?.days??0);
  if(!telegramId) return res.status(400).json({success:false,message:"telegramId es obligatorio"});
  if(!Number.isInteger(credits)||credits<0) return res.status(400).json({success:false,message:"credits debe ser un entero mayor o igual a 0"});
  if(!Number.isInteger(days)||days<0) return res.status(400).json({success:false,message:"days debe ser un entero mayor o igual a 0"});
  const db=await getDb(); const users=db.collection("users"); const now=new Date(); const daysExpiresAt=days>0?new Date(now.getTime()+days*DAY_MS):null;
  await users.updateOne({telegramId},{ $setOnInsert:{createdAt:now}, $set:{telegramId,username,credits,days,daysExpiresAt,updatedAt:now}},{upsert:true});
  const user=await syncUserDays(users,await users.findOne({telegramId}),now);
  return res.status(200).json({success:true,message:"Registro agregado o actualizado",user:{telegramId:user.telegramId,username:user.username||"",credits:Number(user.credits)||0,days:Number(user.days)||0,daysExpiresAt:user.daysExpiresAt||null}});
 }catch(error){console.error(error);return res.status(500).json({success:false,message:"Error interno del servidor"});}
}
