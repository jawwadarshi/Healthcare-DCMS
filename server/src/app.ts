import { createServer } from "http";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./db/index.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
const __dirname = dirname(fileURLToPath(import.meta.url));
import { authRoutes } from "./modules/auth/auth.routes.js";
import { rbacExampleRoutes } from "./modules/rbac-example/rbac-example.routes.js";
import { patientsRoutes } from "./modules/patients/patients.routes.js";
import { errorHandler } from "./common/middleware/error-handler.js";
import { API_PREFIX, MODULE_ROUTES } from "./contracts/api-routes.contract.js";
import { servicesRoutes } from "./modules/services/services.routes.js";
import { appointmentsRoutes } from "./modules/appointments/appointments.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { whatsappRoutes } from "./modules/whatsapp/whatsapp.routes.js";
import { treatmentHistoryRoutes } from "./modules/treatment-history/treatment-history.routes.js";
import { billingRoutes } from "./modules/billing/billing.routes.js";
import { feedbackRoutes } from "./modules/feedback/feedback.routes.js";
import { initializeSocket } from "./socket/index.js";
import { receptionistRoutes } from "./modules/whatsapp/receptionist.routes.js";
dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

// Serve static files (e.g., receptionist-widget.js)
app.use(express.static(join(__dirname, "../public")));

app.use(`${API_PREFIX}${MODULE_ROUTES.auth}`, authRoutes);
app.use(`${API_PREFIX}${MODULE_ROUTES.rbac}`, rbacExampleRoutes);
app.use(`${API_PREFIX}${MODULE_ROUTES.patients}`, patientsRoutes);
app.use(`${API_PREFIX}${MODULE_ROUTES.services}`, servicesRoutes);
app.use(`${API_PREFIX}${MODULE_ROUTES.appointments}`, appointmentsRoutes);
app.use(`${API_PREFIX}${MODULE_ROUTES.users}`, usersRoutes);
app.use(`${API_PREFIX}${MODULE_ROUTES.treatmentHistory}`, treatmentHistoryRoutes);
app.use(`${API_PREFIX}${MODULE_ROUTES.billing}`, billingRoutes);
app.use(`${API_PREFIX}${MODULE_ROUTES.whatsapp}`, whatsappRoutes);
app.use(`${API_PREFIX}${MODULE_ROUTES.feedback}`, feedbackRoutes);
app.use(`${API_PREFIX}${MODULE_ROUTES.receptionist}`, receptionistRoutes);
// Add this near your other basic middleware/routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is awake and ready!'
  });
});

app.get("/", (req, res) => {
  res.send("Dental Clinic API Running");
});



app.get("/test-db", async (req, res) => {
  try {
    const result = await db.execute("SELECT NOW()");
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error,
    });
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 5005;

// Initialize Socket.io and start server
initializeSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});