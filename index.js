import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from './Utils/db.js';
import path from 'path';
const PORT = process.env.PORT || 3001;
import './Models/index.js';
import { startVerisafeListener } from './Services/verisafe.js';
import {startMpesaSuccessConsumer} from './Services/Veribroke_sdk_recieve.js';


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get("/", (req, res) => {
  res.send("Hello World!")
})


import userRouter from './Routes/User.route.js'
import vehicleRoutes from "./Routes/Vehicle.routes.js";
import tripRoutes from "./Routes/Trip.routes.js";
import bookingRoutes from "./Routes/Booking.routes.js";
import bookingSeatRoutes from "./Routes/Booking_seat.routes.js";
import tripSeatRoutes from "./Routes/Trip.seat.routes.js";
import dashboardRoutes from "./Routes/Dashboard.routes.js";
import adminRoutes from "./Routes/Admin.routes.js";


app.use('/user', userRouter)
app.use('/vehicle', vehicleRoutes)
app.use('/trip', tripRoutes)
app.use('/booking', bookingRoutes)
app.use('/booking_seat', bookingSeatRoutes)
app.use('/trip_seat', tripSeatRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/admin', adminRoutes)



app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();

    await sequelize.sync({ alter: true });
    console.log("Models synced...");
    // startVerisafeListener();
    await startMpesaSuccessConsumer();
    // Start Verisafe
    await startVerisafeListener();
    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error("Database error:", error);
  }
});
