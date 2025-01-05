// Import Third-party Dependencies
import { match } from "ts-pattern";

export function randomStatus() {
  const statuses = [
    200, 200, 200, 200, 200, 200, 200,
    400, 400,
    500
  ];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    status,
    level: match(status)
      .with(500, () => "critical")
      .with(400, () => "error")
      .otherwise(() => "info")
  };
}
