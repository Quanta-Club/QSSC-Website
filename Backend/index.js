const express = require("express");
const cors = require("cors");
const Joi = require("joi");
const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");

// --- File Paths ---
// Define paths to our JSON data files for cleaner access.
const usersPath = path.join(__dirname, 'users.json');
const workshopsPath = path.join(__dirname, 'workshops.json');

// --- Express App Initialization ---
const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

// --- Validation Schema ---
const registrationSchema = Joi.object({
  username: Joi.string().trim().min(1).required(),
  email: Joi.string().trim().email().required(),
  phone: Joi.string().trim().min(5).required(), // You can add regex for format
  level: Joi.string().trim().required(),
  club: Joi.string().trim().required(),
  motivation: Joi.string().trim().min(10).required(), // Ensures meaningful input
});


// --- Helper Functions for File I/O ---

/**
 * Reads user data from users.json.
 * If the file doesn't exist, it returns an empty array.
 * @returns {Array} Array of user objects.
 */
const readUsers = () => {
  try {
    if (!fs.existsSync(usersPath)) {
      return [];
    }
    const data = fs.readFileSync(usersPath, 'utf8');
    // If the file is empty, return an empty array
    if (!data) {
        return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading users file:", error);
    return []; // Return empty array on error to prevent crashes
  }
};

/**
 * Writes an array of user data to users.json.
 * @param {Array} users - The array of users to write to the file.
 */
const writeUsers = (users) => {
  try {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error writing to users file:", error);
  }
};


// --- API Routes ---

app.get("/", (req, res) => {
  res.status(200).send("API is running and connected to local JSON files!");
});

/**
 * Registers a new user after validation and saves to users.json.
 */
app.post("/register", (req, res) => {
  // 1. Validate request body
  const { error, value } = registrationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { username, email, phone, level, club, motivation } = value;

  try {
    const users = readUsers();

    // 2. Check for email uniqueness in our file
    if (users.some(user => user.email === email)) {
      return res.status(400).json({ error: `Email '${email}' already exists.` });
    }

    // 3. Store new user
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const newUser = {
      id: newId,
      username,
      email,
      phone,
      level,
      club,
      motivation,
      createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    writeUsers(users); // Write the updated list back to the file

    // 4. Return successful response
    return res.status(201).json(newUser);

  } catch (err) {
      console.error("Registration Error:", err);
      return res.status(500).json({ error: "An internal server error occurred." });
  }
});


app.get("/1255789223457123484893754", (req, res) => {    // users
  try {
    const users = readUsers(); // Reuse the helper function
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
