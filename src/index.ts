require("dotenv").config();
import { mkdirSync, createReadStream } from "fs";
import { writeFile, readdir } from "fs/promises";
import { join } from "path";
import rimraf from "rimraf";
import { getActivitiesIds, getActivityById } from "./api/nike/nike";
import { importFile } from "./api/strava";
import { getGpxFromNike } from "./converters/nikeToGpx";

const activitiesFolder = "../activities";

if (process.argv.includes("nike") && !process.argv.includes("strava")) {
  rimraf(join(__dirname, activitiesFolder), async () => {
    mkdirSync(join(__dirname, activitiesFolder));

    try {
      const ids = await getActivitiesIds();

      ids.map(async (id) => {
        try {
          const activity = await getActivityById(id);

          await writeFile(
            join(__dirname, activitiesFolder, `activity_${activity.id}.gpx`),
            getGpxFromNike(activity)
          );
          console.log(`Successfully created ${id} activity!`);
        } catch (error) {
          console.warn(error instanceof Error ? error.message : error);
        }
      });
    } catch (error) {
      console.warn(error instanceof Error ? error.message : error);
    }
  });
}

(async function () {
  if (process.argv.includes("strava") && !process.argv.includes("nike")) {
    const files = await readdir(activitiesFolder);
    Promise.all(
      files.map(async (file) => {
        await importFile(createReadStream(`./activities/${file}`));
      })
    )
      .then(() => console.log("Finish"))
      .catch((err) => console.log(err));
  }
})();
