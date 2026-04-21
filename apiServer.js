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
    },
    {
      "date": "2025-12-12T10:12:34.123Z",
      "quality": "premium",
      "weave": "twill",
      "quantity": 120,
      "composition": "cotton fabric",
      "status": "Confirmed",
      "_id": "old001",
      "rate": 115,
      "agentName": "Ravi Kumar",
      "customerName": "Mukilan"
    },
    {
      "date": "2025-12-15T14:45:22.567Z",
      "quality": "standard",
      "weave": "plain",
      "quantity": 300,
      "composition": "cotton fabric",
      "status": "Processed",
      "_id": "old002",
      "rate": 95,
      "agentName": "Suresh",
      "customerName": "Arun Textiles"
    },
    {
      "date": "2025-12-18T09:30:11.200Z",
      "quality": "premium",
      "weave": "twill",
      "quantity": 800,
      "composition": "cotton blend",
      "status": "Confirmed",
      "_id": "old003",
      "rate": 130,
      "agentName": "Unknown Agent",
      "customerName": "Mukilan"
    },
    {
      "date": "2025-12-20T16:05:40.900Z",
      "quality": "good",
      "weave": "fabric",
      "quantity": 1500,
      "composition": "poly cotton",
      "status": "Processed",
      "_id": "old004",
      "rate": 75,
      "agentName": "Mukilan",
      "customerName": "Test Client"
    },
    {
      "date": "2026-01-05T11:20:10.111Z",
      "quality": "60sX60s/92X72(G)",
      "weave": "plain",
      "quantity": 4000,
      "composition": "100% Kasturi Cotton",
      "status": "Processed",
      "_id": "old005",
      "rate": 185,
      "agentName": "Ravi Kumar",
      "customerName": "Mukilan"
    },
    {
      "date": "2026-01-10T13:55:33.876Z",
      "quality": "60sX60s/92X92(G)",
      "weave": "plain",
      "quantity": 4500,
      "composition": "100% Kasturi Cotton",
      "status": "Processed",
      "_id": "old006",
      "rate": 190,
      "agentName": "Suresh",
      "customerName": "Mukilan"
    },
    {
      "date": "2026-01-15T08:44:12.321Z",
      "quality": "30sX20s/124X64(G)",
      "weave": "twill",
      "quantity": 6000,
      "composition": "100% Kasturi Cotton",
      "status": "Confirmed",
      "_id": "old007",
      "rate": 210,
      "agentName": "Unknown Agent",
      "customerName": "Export House"
    },
    {
      "date": "2026-01-20T17:10:55.654Z",
      "quality": "2/40 viscose x 20s cotton flex",
      "weave": "plain",
      "quantity": 9000,
      "composition": "52% viscose / 40% cotton / 8% linen",
      "status": "Processed",
      "_id": "old008",
      "rate": 205,
      "agentName": "Mukilan",
      "customerName": "Global Fabrics"
    },
    {
      "date": "2026-01-25T12:05:25.789Z",
      "quality": "20s cotton x 20s cotton flex",
      "weave": "plain",
      "quantity": 8500,
      "composition": "92% cotton / 8% linen",
      "status": "Processed",
      "_id": "old009",
      "rate": 198,
      "agentName": "Ravi Kumar",
      "customerName": "Test Client"
    },
    {
      "date": "2026-02-02T10:30:00.000Z",
      "quality": "premium",
      "weave": "twill",
      "quantity": 200,
      "composition": "cotton fabric",
      "status": "Confirmed",
      "_id": "old010",
      "rate": 140,
      "agentName": "Suresh",
      "customerName": "Mukilan"
    },
    {
      date: "2026-04-06T16:21:35.585Z",
      quality: "2/40 viscose x 20s cotton flex(80%cotton20%linen(flex))",
      weave: "plain",
      quantity: "10000meters",
      composition: "52%viscose 40%cotton 8%linen",
      status: "Declined",
      reason: "price is high",
      _id: "69d390638f2eb452ba770849",
      rate: 30,
      agentName: "Mukilan",
      customerName: "mukilan",
      buyerName: "Unknown Buyer"
    },
    {
      date: "2026-04-06T16:21:35.585Z",
      quality: "20s cotton x 20s cotton flex(80%cotton20%linen(flex))",
      weave: "plain",
      quantity: "10000meters",
      composition: "52%viscose 92%cotton 8%linen",
      status: "Processed",
      reason: null,
      _id: "69d390638f2eb452ba77084a",
      rate: null,
      agentName: "Mukilan",
      customerName: "mukilan",
      buyerName: "Unknown Buyer"
    },
    {
      date: "2026-04-07T07:39:34.521Z",
      quality: "2/40 viscose x 20s cotton flex",
      weave: "plain weave",
      quantity: "10000meters",
      composition: "52%viscose 40%cotton 8%linen",
      status: "Processed",
      reason: null,
      _id: "69d4676b8f2eb452ba770acb",
      rate: 120,
      agentName: "Mukilan",
      customerName: "mukilan",
      buyerName: "Unknown Buyer"
    },
    {
      date: "2026-04-07T07:39:34.521Z",
      quality: "20s cotton x 20s cotton flex",
      weave: "plain weave",
      quantity: "10000meters",
      composition: "52%viscose 92%cotton 8%linen",
      status: "Processed",
      reason: null,
      _id: "69d4676b8f2eb452ba770acc",
      rate: null,
      agentName: "Mukilan",
      customerName: "mukilan",
      buyerName: "Unknown Buyer"
    },
    {
      date: "2026-04-07T07:40:20.754Z",
      quality: "60sX60s/92X72(G)",
      weave: "plain",
      quantity: "5000 mtr",
      composition: "100% Kasturi Cotton",
      status: "Confirmed",
      reason: null,
      _id: "69d467948f2eb452ba770af3",
      rate: null,
      agentName: "Mukilan",
      customerName: "mukilan",
      buyerName: "Unknown Buyer"
    },
    {
      date: "2026-04-07T07:40:20.754Z",
      quality: "60sX60s/92X92(G)",
      weave: "plain",
      quantity: "5000 mtr",
      composition: "100% Kasturi Cotton",
      status: "Declined",
      reason: null,
      _id: "69d467948f2eb452ba770af4",
      rate: 50,
      agentName: "Mukilan",
      customerName: "mukilan",
      buyerName: "Unknown Buyer"
    },
    {
      date: "2026-04-07T07:40:20.754Z",
      quality: "30sX20s/124X64(G)",
      weave: "twill",
      quantity: "5000 mtr",
      composition: "100% Kasturi Cotton",
      status: "Declined",
      reason: "price not flexible",
      _id: "69d467948f2eb452ba770af5",
      rate: null,
      agentName: "Mukilan",
      customerName: "mukilan",
      buyerName: "Unknown Buyer"
    },
    {
      date: "2026-04-09T17:16:26.275Z",
      quality: "20s cotton × 20s cotton flex / 64 × 64 (G)",
      weave: "plain",
      quantity: "10,000 meters",
      composition: "92% cotton / 52% viscose / 8% linen",
      status: "Confirmed",
      reason: null,
      _id: "69d79194ab2cecd76d170a4d",
      rate: 50,
      agentName: "Mukilan",
      customerName: "mukilan test6778",
      buyerName: "Unknown Buyer"
    },
    {
      date: "2026-04-10T11:24:15.281Z",
      quality: "20s cotton x 20s cotton flex",
      weave: "plain",
      quantity: "10000meters",
      composition: "80%cotton20%linen(flex), 52%viscose, 92%cotton 8%linen",
      status: "Confirmed",
      reason: null,
      _id: "69d890a7ab2cecd76d17199a",
      rate: 60,
      agentName: "Mukilan",
      customerName: "mukilan",
      buyerName: "Unknown Buyer"
    },
    {
      date: "2026-04-10T15:12:18.174Z",
      quality: "20s cotton × 20s cotton flex / 64 × 64 (G)",
      weave: "plain",
      quantity: "10,000 meters",
      composition: "92% cotton / 52% viscose / 8% linen",
      status: "Confirmed",
      reason: null,
      _id: "69d8c5fdab2cecd76d171efe",
      rate: 50,
      agentName: "Mukilan",
      customerName: "mukilan",
      buyerName: "Unknown Buyer"
    },
    {
      date: "2026-04-07T13:30:01.455Z",
      quality: "20s cotton × 20s cotton flex / 64 × 64 (G)",
      weave: "plain",
      quantity: "10,000 meters",
      composition: "92% cotton / 52% viscose / 8% linen",
      status: "Confirmed",
      reason: null,
      _id: "69d4b9840076d5f16e456a1f",
      rate: 50,
      agentName: "Unknown User",
      customerName: "mukilan",
      buyerName: "Unknown Buyer"
    },
    {
      date: "2026-04-09T10:46:48.500Z",
      quality: "2/40 viscose x 20s cotton flex",
      weave: "plain",
      quantity: "10000 meters",
      composition: "52%viscose 40%cotton 8%linen",
      status: "Declined",
      reason: "not",
      _id: "69d736470076d5f16e45b0f7",
      rate: 30,
      agentName: "Mukilan",
      customerName: "test user",
      buyerName: "Unknown Buyer"
    },
    {
      date: "2026-04-18T17:02:58.992Z",
      quality: "2/40 viscose × 20s cotton flex",
      weave: "plain",
      quantity: "10000 meters",
      composition: "40%cotton remaining linen",
      status: "Processed",
      reason: null,
      _id: "69e36bee97ab603ca1c337ad",
      rate: null,
      agentName: "Riya",
      customerName: "kk",
      buyerName: "Unknown Buyer"
    },
    {
      date: "2026-04-18T17:06:20.664Z",
      quality: "99/1000 visoce× cotton flex export quality",
      weave: "heavy weave ultra premium",
      quantity: "99999 meters",
      composition: "100%coton 100% linen",
      status: "Declined",
      reason: "invalid quality",
      _id: "69e36cba97ab603ca1c339b4",
      rate: 200,
      agentName: "Riya",
      customerName: "kk",
      buyerName: "Unknown Buyer"
    }
  ]
};


app.get("/data", (req, res) => {
  res.json(response);
});


app.listen(PORT, () => {
  console.log(`API running on http://127.0.0.1:${PORT}/data`);
});