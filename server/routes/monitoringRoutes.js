/**
 * Peaklyy Forge - Real System Monitoring & Observability Routes
 */

const express = require("express");
const router = express.Router();
const { getMonitoringMetrics } = require("../services/metricsService");

router.get("/metrics", (req, res) => {
  try {
    const metrics = getMonitoringMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve system metrics",
    });
  }
});

module.exports = router;
