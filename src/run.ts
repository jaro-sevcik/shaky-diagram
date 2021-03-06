import * as fs from "fs";
import * as process from "process";
import * as Shaky from "./shaky";

fs.readFile(0, "utf8", (err : any, contents : string) => {
  if (err != null) {
    console.error("Could not read stdin.");
    process.exit(1);
  }

  Shaky.processFile(contents);
});
