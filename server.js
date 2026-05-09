const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

function getIndianTime(){
  let now = new Date();
  let india = new Date(now.toLocaleString("en-US", {timeZone:"Asia/Kolkata"}));

  let time = india.toLocaleTimeString("en-IN");
  let date = india.toLocaleDateString("en-IN");

  return {time,date};
}

app.post("/register",(req,res)=>{
  let users = JSON.parse(fs.readFileSync("users.json"));
  users.push(req.body);
  fs.writeFileSync("users.json",JSON.stringify(users,null,2));
  res.redirect("/");
});

app.post("/login",(req,res)=>{
  let users = JSON.parse(fs.readFileSync("users.json"));
  let user = users.find(u=>u.email===req.body.email && u.password===req.body.password);

  if(user){
    res.redirect(`/dashboard.html?name=${user.name}`);
  }else{
    res.send("Invalid Login");
  }
});

app.get("/save-sensor",(req,res)=>{
  let temp = req.query.temp;
  let hum = req.query.hum;

  let records = JSON.parse(fs.readFileSync("sensorData.json"));
  let dt = getIndianTime();

  records.push({
    temp,
    hum,
    time:dt.time,
    date:dt.date
  });

  fs.writeFileSync("sensorData.json",JSON.stringify(records,null,2));
  res.send("Data Saved");
});

app.get("/records",(req,res)=>{
  let records = JSON.parse(fs.readFileSync("sensorData.json"));
  res.json(records);
});

app.get("/latest",(req,res)=>{
  let records = JSON.parse(fs.readFileSync("sensorData.json"));
  res.json(records[records.length-1] || {});
});

app.post("/save-text",(req,res)=>{
  fs.writeFileSync("lcd.txt",req.body.message);
  res.send("Text Saved");
});

app.get("/get-lcd-text",(req,res)=>{
  let text = fs.readFileSync("lcd.txt","utf8");
  res.send(text);
});

app.get("/delete/:id",(req,res)=>{
  let records = JSON.parse(fs.readFileSync("sensorData.json"));
  records.splice(req.params.id,1);
  fs.writeFileSync("sensorData.json",JSON.stringify(records,null,2));
  res.redirect("/dashboard.html");
});

app.listen(3000,()=>console.log("Server Running"));