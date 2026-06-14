import http from "http";

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/notes",
  method: "GET",
  headers: { "Content-Type": "application/json" },
};

const req = http.request(options, (res) => {
  console.log("statusCode:", res.statusCode);
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log("body:", data);
    process.exit(0);
  });
});

req.on("error", (err) => {
  console.error("request error:", err.message);
  process.exit(1);
});

req.end();
