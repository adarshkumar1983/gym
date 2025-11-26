const { betterAuth } = require('better-auth');
try {
  const auth = betterAuth({
    database: {
      provider: "mongodb",
      url: "mongodb://localhost:27017/test"
    }
  });
  console.log("Success");
} catch (e) {
  console.log("Error:", e.message);
}
