import * as fs from "fs";
import * as process from "process";
import * as Render from "./index"


fs.readFile(0, "utf8", (err : any, contents : string) => {
  if (err != null) {
    console.error("Could not read stdin.");
    process.exit(1);
  }

  Render.processFile(contents);
});
