const express = require("express");
const cors = require("cors");
const Joi = require("joi");
const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");

// --- In-Memory Database ---
// For demonstration on Render without a persistent database.
// This will reset every time the server restarts or sleeps.
const db = {
  users: [],
};
let userIdCounter = 1;

// --- Express App Initialization ---
const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

// --- Validation Schema ---
const registrationSchema = Joi.object({
  username: Joi.string().trim().min(1).required(),
  email: Joi.string().trim().email().required(),
});

// --- API Routes ---

app.get("/", (req, res) => {
  res.status(200).send("API is running!");
});


/**
 * Registers a new user after validation.
 */
app.post("/register", (req, res) => {
  // 1. Validate request body
  const { error, value } = registrationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { username, email } = value;

  // 2. Check for email uniqueness in our in-memory store
  if (db.users.some(user => user.email === email)) {
    return res.status(400).json({ error: `Email '${email}' already exists.` });
  }

  // 3. Store new user
  const newUser = {
    id: userIdCounter++,
    username,
    email,
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  console.log("Current users:", db.users);

  // 4. Return successful response
  return res.status(201).json(newUser);
});

/**
 * Lists all workshops with a dynamic status.
 */
app.get("/workshops", (req, res) => {
  try {
    // 1. Load static workshop data
    const dataPath = path.join(__dirname, "workshops.json");
    const workshopsData = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    // 2. Determine workshop status
    const nowUtc = moment.tz("UTC");
    const workshopDurationHours = 2;

    const processedWorkshops = workshopsData.map(ws => {
      const workshopStartUtc = moment.tz(`${ws.date} ${ws.time}`, "YYYY-MM-DD HH:mm", "UTC");
      const workshopEndUtc = workshopStartUtc.clone().add(workshopDurationHours, "hours");

      let status = "passed";
      if (nowUtc.isBetween(workshopStartUtc, workshopEndUtc)) {
        status = "running";
      } else if (nowUtc.isBefore(workshopStartUtc)) {
        status = "upcoming";
      }
      return { ...ws, status };
    });

    return res.status(200).json(processedWorkshops);
  } catch (err) {
    console.error("Workshop Loading Error:", err);
    return res.status(500).json({ error: "Could not load workshop data." });
  }
});


// --- Server Initialization ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
