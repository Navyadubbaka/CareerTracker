import http from "http";

const data = JSON.stringify({
  text: `note via http ${new Date().toISOString()}`,
});

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/notes",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  console.log("statusCode:", res.statusCode);
  let body = "";
  res.on("data", (chunk) => (body += chunk));
  res.on("end", () => {
    console.log("body:", body);
    process.exit(0);
  });
});

req.on("error", (err) => {
  console.error("request error:", err.message);
  process.exit(1);
});

req.write(data);
req.end();
