const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get("name") || "Guest";
const messageBar = document.getElementById("dashboardMessage");

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("username").textContent = username;
  document.getElementById("welcomeName").textContent = username;

  loadLatest();
  loadPrediction();
  loadRecords();
  loadLcdText();

  document.getElementById("lcdForm").addEventListener("submit", event => {
    event.preventDefault();
    saveText();
  });

  document.getElementById("refreshRecords").addEventListener("click", loadRecords);
});

function setMessage(text, type = "success") {
  messageBar.textContent = text;
  messageBar.className = `${type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"} border rounded p-4 mb-6`;
}

function loadLatest() {
  fetch("/latest")
    .then(res => res.json())
    .then(data => {
      if (!data || Object.keys(data).length === 0) {
        document.getElementById("temp").textContent = "—";
        document.getElementById("hum").textContent = "—";
        document.getElementById("latestTime").textContent = "No sensor data yet.";
        return;
      }

      document.getElementById("temp").textContent = `${data.temp} °C`;
      document.getElementById("hum").textContent = `${data.hum} %`;
      document.getElementById("latestTime").textContent = `${data.time} · ${data.date}`;
    })
    .catch(() => {
      setMessage("Unable to load latest sensor data.", "error");
    });
}

function loadPrediction() {
  fetch("/prediction")
    .then(res => res.json())
    .then(data => {
      let temp = "N/A";
      let hum = "N/A";

      if (data) {
        if (data.predicted_temperature !== undefined) {
          temp = Array.isArray(data.predicted_temperature)
            ? data.predicted_temperature[0]
            : data.predicted_temperature;
        } else if (data.temp !== undefined) {
          temp = data.temp;
        }

        if (data.predicted_humidity !== undefined) {
          hum = Array.isArray(data.predicted_humidity)
            ? data.predicted_humidity[0]
            : data.predicted_humidity;
        } else if (data.hum !== undefined) {
          hum = data.hum;
        }
      }

      document.getElementById("predTemp").textContent =
        temp === "N/A" ? temp : `${Number(temp).toFixed(2)} °C`;
      document.getElementById("predHum").textContent =
        hum === "N/A" ? hum : `${Number(hum).toFixed(2)} %`;
      document.getElementById("predictionStatus").textContent =
        data && data.error ? "Prediction service unavailable" : "Prediction loaded";
    })
    .catch(() => {
      document.getElementById("predTemp").textContent = "N/A";
      document.getElementById("predHum").textContent = "N/A";
      document.getElementById("predictionStatus").textContent = "Prediction service unavailable";
    });
}

function loadRecords() {
  fetch("/records")
    .then(res => res.json())
    .then(records => {
      const table = document.getElementById("tableData");
      const count = document.getElementById("recordCount");
      if (!records || records.length === 0) {
        table.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-500">No sensor records available yet.</td></tr>`;
        count.textContent = "0 records";
        return;
      }

      count.textContent = `${records.length} records`;
      table.innerHTML = records
        .map((record, index) => {
          return `<tr class="hover:bg-slate-50">
            <td class="py-3 px-4 text-sm text-slate-700">${index + 1}</td>
            <td class="py-3 px-4 text-sm text-slate-700">${record.temp} °C</td>
            <td class="py-3 px-4 text-sm text-slate-700">${record.hum} %</td>
            <td class="py-3 px-4 text-sm text-slate-700">${record.time}</td>
            <td class="py-3 px-4 text-sm text-slate-700">${record.date}</td>
            <td class="py-3 px-4 text-right"><a href="/delete/${index}" class="text-red-600 hover:text-red-800 font-semibold">Delete</a></td>
          </tr>`;
        })
        .join("");
    })
    .catch(() => {
      setMessage("Unable to load sensor records.", "error");
    });
}

function loadLcdText() {
  fetch("/get-lcd-text")
    .then(res => res.text())
    .then(text => {
      document.getElementById("lcdText").textContent = text || "No text set yet.";
    })
    .catch(() => {
      document.getElementById("lcdText").textContent = "Unable to retrieve current LCD text.";
    });
}

function saveText() {
  const message = document.getElementById("msg").value.trim();
  if (!message) {
    setMessage("Please type a message before saving.", "error");
    return;
  }

  fetch("/save-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  })
    .then(res => {
      if (!res.ok) throw new Error("Save failed");
      setMessage("LCD message saved successfully.");
      document.getElementById("msg").value = "";
      loadLcdText();
    })
    .catch(() => {
      setMessage("Unable to save LCD message.", "error");
    });
}
