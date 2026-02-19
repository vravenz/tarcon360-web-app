import dotenv from "dotenv";
dotenv.config();

// timezone
process.env.TZ = process.env.APP_TIMEZONE || "Asia/Karachi";
