import { createApp } from "./app";
import { config } from "./config";

createApp()
  .then((app) => {
    app.listen(config.port, () => {
      console.log(`Restaurant Manager System API listening on http://localhost:${config.port}`);
    });
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
