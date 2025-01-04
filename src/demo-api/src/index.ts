// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import { DockerComposeEnvironment } from "testcontainers";
import { GrafanaApi } from "@myunisoft/loki";

// Import Internal Dependencies
import { LogGenerator } from "./seeder/logs.js";

async function main() {
  const environment = await new DockerComposeEnvironment(
    // "../" because we are in ./dist/ folder after TSC compilation
    path.join(__dirname, "../docker"),
    "docker-compose.yaml"
  ).up();
  const loki = environment.getContainer("loki");
  const lokiUrl = `http://${loki.getHost()}:${loki.getMappedPort(3100)}`;

  const api = new GrafanaApi({
    remoteApiURL: lokiUrl,
    apiToken: ""
  });

  const logGenerator = new LogGenerator({ count: 500, labels: { app: "demo" } })
  const logs = [...logGenerator.generate()];

  await api.Loki.push(logs);

  console.log("Logs ready on http://localhost:3000/explore");

  // keep process alive
  process.stdin.resume();
}

main();
