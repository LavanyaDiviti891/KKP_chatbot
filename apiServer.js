const express = require("express");
const app = express();

const PORT = 4000;


const response = {
  status: 200,
  message: "Form data fetched successfully",
  formData: [
    {
      date: "2026-04-06T16:21:35.585Z",
      quantity: 10000,
      rate: 30,
      agentName: "Mukilan",
      status: "Declined"
    },
    {
      date: "2026-04-06T16:21:35.585Z",
      quantity: 10000,
      rate: null,
      agentName: "Mukilan",
      status: "Processed"
    },
    {
      date: "2026-04-07T07:39:34.521Z",
      quantity: 10000,
      rate: null,
      agentName: "Mukilan",
      status: "Processed"
    },
    {
      date: "2026-04-07T07:39:34.521Z",
      quantity: 10000,
      rate: null,
      agentName: "Mukilan",
      status: "Processed"
    },
    {
      date: "2026-04-07T07:40:20.754Z",
      quantity: 5000,
      rate: null,
      agentName: "Mukilan",
      status: "Confirmed"
    },
    {
      date: "2026-04-07T07:40:20.754Z",
      quantity: 5000,
      rate: 50,
      agentName: "Mukilan",
      status: "Declined"
    }
  ]
};


app.get("/data", (req, res) => {
  res.json(response);
});


app.listen(PORT, () => {
  console.log(`📡 API running on http://127.0.0.1:${PORT}/data`);
});