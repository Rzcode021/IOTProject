const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

function getIndianTime() {
  let now = new Date();
  let india = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  let time = india.toLocaleTimeString("en-IN");
  let date = india.toLocaleDateString("en-IN");

  return { time, date };
}

// Register
app.post("/register", (req, res) => {
  let users = JSON.parse(
    fs.readFileSync("./data/users.json")
  );

  users.push(req.body);

  fs.writeFileSync(
    "./data/users.json",
    JSON.stringify(users, null, 2)
  );

  res.redirect("/?registered=1");
});

// Login
app.post("/login", (req, res) => {
  let users = JSON.parse(
    fs.readFileSync("./data/users.json")
  );

  let user = users.find(
    u => u.email === req.body.email && u.password === req.body.password
  );

  if (user) {
    res.redirect(`/dashboard.html?name=${encodeURIComponent(user.name)}`);
  } else {
    res.redirect("/?error=1");
  }
});

// Save sensor data (supports GET query and POST JSON)
app.all("/save-sensor", (req, res) => {
  const temp = req.method === "GET" ? req.query.temp : req.body.temp;
  const hum = req.method === "GET" ? req.query.hum : req.body.hum;

  console.log("save-sensor", req.method, { temp, hum });

  if (temp === undefined || hum === undefined) {
    return res.status(400).json({ error: "Missing temp or hum" });
  }

  const records = JSON.parse(
    fs.readFileSync("./data/sensorData.json")
  );

  const dt = getIndianTime();

  records.push({
    temp,
    hum,
    time: dt.time,
    date: dt.date
  });

  fs.writeFileSync(
    "./data/sensorData.json",
    JSON.stringify(records, null, 2)
  );

  res.json({ message: "Data saved", temp, hum });
});

// Get all records
app.get("/records", (req, res) => {
  let records = JSON.parse(
    fs.readFileSync("./data/sensorData.json")
  );

  res.json(records);
});

// Latest record
app.get("/latest", (req, res) => {
  let records = JSON.parse(
    fs.readFileSync("./data/sensorData.json")
  );

  res.json(records[records.length - 1] || {});
});

app.get("/prediction", async (req, res) => {
  try {
    const response = await axios.get(
      "https://82b8-34-7-190-154.ngrok-free.app/predict"
    );

    res.json(response.data);

  } catch (error) {
    res.json({
      error: "Prediction API Failed"
    });
  }
});

// Save LCD text
app.post("/save-text", (req, res) => {
  fs.writeFileSync("./data/lcd.txt", req.body.message);
  res.send("Text Saved");
});

// Fetch LCD text
app.get("/get-lcd-text", (req, res) => {
  let text = fs.readFileSync("./data/lcd.txt", "utf8");
  res.send(text);
});



// Delete record
app.get("/delete/:id", (req, res) => {
  let records = JSON.parse(
    fs.readFileSync("./data/sensorData.json")
  );

  records.splice(req.params.id, 1);

  fs.writeFileSync(
    "./data/sensorData.json",
    JSON.stringify(records, null, 2)
  );

  res.redirect("/dashboard.html");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server Running on Port " + PORT);
});