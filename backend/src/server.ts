// backend/src/server.ts
import "./config/env";
import app from "./app";

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
