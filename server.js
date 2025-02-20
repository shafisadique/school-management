const app = require('./app');  // Ensure this imports your Express app
const PORT = process.env.PORT || 5000;

// Keep the server alive
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
}).on('error', (err) => {
  console.error("❌ Server failed to start:", err);
});
