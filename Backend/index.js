const express = require("express");
const cors = require("cors");
const Joi = require("joi");
const moment = require("moment-timezone");
const admin = require("firebase-admin");

// --- Firebase Initialization ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


const db = admin.firestore();
const usersCollection = db.collection("users");

// --- Express App Initialization ---
const app = express();
app.use(cors());
app.use(express.json());

// --- Validation Schema ---
const registrationSchema = Joi.object({
  username: Joi.string().trim().min(1).required(),
  email: Joi.string().trim().email().required(),
  phone: Joi.string().trim().min(5).required(),
  level: Joi.string().trim().required(),
  club: Joi.string().trim().required(),
  motivation: Joi.string().trim().min(10).required(),
});

// --- API Routes ---
app.get("/", (req, res) => {
  res.status(200).send("API is running and connected to Firestore!");
});

// --- Register New User ---
app.post("/register", async (req, res) => {
  const { error, value } = registrationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { username, email, phone, level, club, motivation } = value;

  try {
    // Check for existing email
    const snapshot = await usersCollection.where("email", "==", email).get();
    if (!snapshot.empty) {
      return res.status(400).json({ error: `Email '${email}' already exists.` });
    }

    // Add new user
    const newUser = {
      username,
      email,
      phone,
      level,
      club,
      motivation,
      createdAt: new Date().toISOString(),
    };

    const docRef = await usersCollection.add(newUser);
    newUser.id = docRef.id; // Attach generated Firestore ID

    return res.status(201).json(newUser);

  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({ error: "An internal server error occurred." });
  }
});

// --- Get All Users ---
app.get("/1255789223457123484893754", async (req, res) => {
  try {
    const snapshot = await usersCollection.get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error retrieving users:", error);
    return res.status(500).json({ error: "Could not retrieve users." });
  }
});

// --- Server Initialization ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
