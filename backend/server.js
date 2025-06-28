"use strict";

const dgram = require("dgram");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const udpServerA = dgram.createSocket("udp4");
const udpServerD = dgram.createSocket("udp4");

const PORT_API = 4000;
const RDI_A_IP = "10.0.0.11";
const RDI_A_PORT = 3003;
const RDI_D_IP = "10.0.0.12";
const RDI_D_PORT = 3004;

const THINGSPEAK_API_KEY = "296327WRNNJAANKD";
const THINGSPEAK_URL = "https://api.thingspeak.com/update";

app.use(cors());
app.use(express.json());

// Data storage
let analogData = new Array(6).fill({ value: 0, description: "", lowThreshold: 0, highThreshold: 0, lowAlarm: 0, highAlarm: 0, sendToThingSpeak: false, hidden: false });
let digitalData = new Array(24).fill({ value: false, description: "", logic: "active", sendToThingSpeak: false, hidden: false, displayMode: "active" });

// Initialize with default channel descriptions and mappings
const analogChannels = [
  { index: 0, name: "Ciśnienie Oleju", input: "AN00" },
  { index: 1, name: "Temperatura Płynu", input: "AN01" },
  { index: 2, name: "AN02", input: "AN02" },
  { index: 3, name: "AN03", input: "AN03" },
  { index: 4, name: "AN04", input: "AN04" },
  { index: 5, name: "AN05", input: "AN05" },
];

const digitalChannels = [
  { index: 0, name: "Alarm Ciśnienia", input: "DI00" },
  { index: 1, name: "Alarm Temperatury", input: "DI01" },
  { index: 2, name: "Alarm Prądnicy", input: "DI02" },
  { index: 3, name: "Stan cewki gaszącej", input: "DI03" },
  // Remaining digital inputs DI04 to DI23 unnamed
];

// Helper function to update analog data
function updateAnalogData(index, value) {
  if (index < 0 || index >= analogData.length) return;
  analogData[index] = {
    ...analogData[index],
    value,
  };
}

// Helper function to update digital data
function updateDigitalData(index, value) {
  if (index < 0 || index >= digitalData.length) return;
  digitalData[index] = {
    ...digitalData[index],
    value,
  };
}

// UDP message handlers
udpServerA.on("message", (msg, rinfo) => {
  // Parse analog data from msg
  // Assuming msg contains 6 analog values as floats or integers
  // This depends on the actual protocol - here we simulate parsing
  try {
    // Example: msg is a JSON string with analog values array
    const data = JSON.parse(msg.toString());
    if (Array.isArray(data) && data.length >= 6) {
      for (let i = 0; i < 6; i++) {
        updateAnalogData(i, data[i]);
      }
    }
  } catch (err) {
    console.error("Error parsing UDP message from RDI-A:", err);
  }
});

udpServerD.on("message", (msg, rinfo) => {
  // Parse digital data from msg
  // Assuming msg contains 24 digital boolean values
  try {
    // Example: msg is a JSON string with digital values array
    const data = JSON.parse(msg.toString());
    if (Array.isArray(data) && data.length >= 24) {
      for (let i = 0; i < 24; i++) {
        updateDigitalData(i, data[i]);
      }
    }
  } catch (err) {
    console.error("Error parsing UDP message from RDI-D:", err);
  }
});

// Start UDP servers
udpServerA.bind(RDI_A_PORT, RDI_A_IP, () => {
  console.log(`UDP Server for RDI-A listening on ${RDI_A_IP}:${RDI_A_PORT}`);
});

udpServerD.bind(RDI_D_PORT, RDI_D_IP, () => {
  console.log(`UDP Server for RDI-D listening on ${RDI_D_IP}:${RDI_D_PORT}`);
});

// REST API endpoints

// Get all sensor data
app.get("/api/data", (req, res) => {
  res.json({
    analog: analogData,
    digital: digitalData,
  });
});

// Update configuration for a signal
app.post("/api/config/analog/:index", (req, res) => {
  const index = parseInt(req.params.index);
  if (index < 0 || index >= analogData.length) {
    return res.status(400).json({ error: "Invalid analog index" });
  }
  const config = req.body;
  analogData[index] = {
    ...analogData[index],
    ...config,
  };
  res.json({ success: true });
});

app.post("/api/config/digital/:index", (req, res) => {
  const index = parseInt(req.params.index);
  if (index < 0 || index >= digitalData.length) {
    return res.status(400).json({ error: "Invalid digital index" });
  }
  const config = req.body;
  digitalData[index] = {
    ...digitalData[index],
    ...config,
  };
  res.json({ success: true });
});

// Send data to ThingSpeak
async function sendToThingSpeak(field, value) {
  try {
    const response = await axios.get(THINGSPEAK_URL, {
      params: {
        api_key: THINGSPEAK_API_KEY,
        [`field${field}`]: value,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error sending data to ThingSpeak:", error);
  }
}

// Endpoint to send selected data to ThingSpeak
app.post("/api/send-thingspeak", async (req, res) => {
  const { analogIndices, digitalIndices } = req.body;
  try {
    for (const i of analogIndices) {
      if (analogData[i] && analogData[i].sendToThingSpeak) {
        await sendToThingSpeak(i + 1, analogData[i].value);
      }
    }
    for (const i of digitalIndices) {
      if (digitalData[i] && digitalData[i].sendToThingSpeak) {
        await sendToThingSpeak(i + 1, digitalData[i].value ? 1 : 0);
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to send data to ThingSpeak" });
  }
});

// Start API server
app.listen(PORT_API, () => {
  console.log(`API server listening on port ${PORT_API}`);
});
