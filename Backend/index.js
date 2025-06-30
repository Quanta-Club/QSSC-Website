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
  username:  Joi.string().trim().min(1).required(),
  email:     Joi.string().trim().email().required(),
  phone:     Joi.string().trim().min(5).required(),
  level:     Joi.string().trim().required(),
  club:      Joi.string().trim().required(),
  motivation:Joi.string().trim().min(10).required(),
  hasLaptop: Joi.boolean().required(),
  accepted:  Joi.boolean().allow(null).optional()
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

  const { username, email, phone, level, club, motivation, hasLaptop } = value;

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
      hasLaptop,
      accepted: null,
      createdAt: new Date().toISOString(),
    };

    const docRef = await usersCollection.add(newUser);
    newUser.id = docRef.id;

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

// --- Reset All Users' Acceptance Status ---
app.post("/addANDreset", async (req, res) => {
  try {
    const snapshot = await usersCollection.get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      // Use set with { merge: true } to add the field if it's missing, or update it if it exists.
      batch.set(doc.ref, { accepted: null }, { merge: true }); 
    });
    await batch.commit();
    return res.status(200).json({ message: "All users now have the 'accepted' field set to null." });
  } catch (error) {
    console.error("Error resetting users:", error);
    return res.status(500).json({ error: "Could not reset users' acceptance status." });
  }
});

// --- Get All Accepted Users ---
app.get("/listaccepted", async (req, res) => {
  try {
    const snapshot = await usersCollection.where("accepted", "==", true).get();
    const acceptedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(acceptedUsers);
  } catch (error) {
    console.error("Error retrieving accepted users:", error);
    return res.status(500).json({ error: "Could not retrieve accepted users." });
  }
});

// --- NEW API: Get All Rejected Users ---
app.get("/listrejected", async (req, res) => {
  try {
    const snapshot = await usersCollection.where("accepted", "==", false).get();
    const rejectedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(rejectedUsers);
  } catch (error) {
    console.error("Error retrieving rejected users:", error);
    return res.status(500).json({ error: "Could not retrieve rejected users." });
  }
});

// --- Update User Acceptance Status ---
app.patch("/users/:id/status", async (req, res) => {
    const { id } = req.params;
    const { accepted } = req.body;

    if (typeof accepted !== 'boolean') {
        return res.status(400).json({ error: "The 'accepted' field must be a boolean." });
    }

    try {
        const userRef = usersCollection.doc(id);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "User not found." });
        }

        await userRef.update({ accepted });
        return res.status(200).json({ message: `User ${id} acceptance status updated to ${accepted}.` });
    } catch (error) {
        console.error("Error updating user status:", error);
        return res.status(500).json({ error: "Could not update user status." });
    }
});


// --- Server Initialization ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});