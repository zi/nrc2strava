require("dotenv").config();
import { mkdirSync, createReadStream } from "fs";
import { writeFile, readdir } from "fs/promises";
import { join } from "path";
import rimraf from "rimraf";
import { create } from "xmlbuilder";
import { get, set, find } from "lodash";
import { getActivitiesIds, getActivityById } from "./api/nike/nike";
import { importFile } from "./api/strava";
import { NikeActivity } from "./api/nike/models";

const activitiesFolder = "activities";
const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const buildGpx = (data: NikeActivity) => {
  const day = daysOfWeek[new Date(data.start_epoch_ms).getDay()];
  const getISODate = (milliseconds: number) =>
    new Date(milliseconds).toISOString();
  const latitudes = find(data.metrics, ["type", "latitude"]);
  const longitudes = find(data.metrics, ["type", "longitude"]);
  const elevations = find(data.metrics, ["type", "elevation"]);
  const heartRates = find(data.metrics, ["type", "heart_rate"]);
  let points: Array<{
    time: number;
    latitude: number;
    longitude: number;
    elevation?: number;
    heartrate?: number;
  }> = [];

  const root = {
    gpx: {
      "@creator": "StravaGPX",
      "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "@xsi:schemaLocation":
        "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd",
      "@version": "1.1",
      "@xmlns": "http://www.topografix.com/GPX/1/1",
      "@xmlns:gpxtpx":
        "http://www.garmin.com/xmlschemas/TrackPointExtension/v1",
      "@xmlns:gpxx": "http://www.garmin.com/xmlschemas/GpxExtensions/v3",
      metadata: {
        time: getISODate(data.start_epoch_ms),
      },
      trk: {
        name: `${day} run - NRC`,
        type: 9,
      },
    },
  };

  if (latitudes && longitudes) {
    points = latitudes.values.map((lat, index) => ({
      time: lat.start_epoch_ms,
      latitude: lat.value,
      longitude: get(longitudes.values[index], "value"),
    }));
  }

  if (elevations) {
    let idx = 0;

    points = points.map((point) => {
      if (
        elevations.values[idx].start_epoch_ms < point.time &&
        idx < elevations.values.length - 1
      ) {
        idx++;
      }

      return {
        ...point,
        elevation: elevations.values[idx].value,
      };
    });
  }

  if (heartRates) {
    let idx = 0;

    points = points.map((point) => {
      if (
        heartRates.values[idx].start_epoch_ms < point.time &&
        idx < heartRates.values.length - 1
      ) {
        idx++;
      }

      return {
        ...point,
        heartrate: heartRates.values[idx].value,
      };
    });
  }

  set(
    root,
    "gpx.trk.trkseg.trkpt",
    points.map((point) => {
      const el: {
        "@lat": number;
        "@lon": number;
        time: string;
        ele?: number;
        extensions?: {
          "gpxtpx:TrackPointExtension": {
            "gpxtpx:hr": {
              "#text": string;
            };
          };
        };
      } = {
        "@lat": point.latitude,
        "@lon": point.longitude,
        time: getISODate(point.time),
      };

      if (point.elevation) {
        el.ele = point.elevation;
      }

      if (point.heartrate) {
        el.extensions = {
          "gpxtpx:TrackPointExtension": {
            "gpxtpx:hr": {
              "#text": point.heartrate + "",
            },
          },
        };
      }

      return el;
    })
  );

  return create(root, { encoding: "UTF-8" }).end({ pretty: true });
};

if (process.argv.includes("nike") && !process.argv.includes("strava")) {
  rimraf(join(__dirname, activitiesFolder), async () => {
    mkdirSync(join(__dirname, activitiesFolder));

    try {
      const ids = await getActivitiesIds();

      ids.map(async (id) => {
        try {
          const activity = await getActivityById(id);

          if (activity.type !== "run") {
            throw "Is not a running activity";
          }

          if (
            !activity.metric_types.includes("latitude") &&
            !activity.metric_types.includes("longitude")
          ) {
            throw "Activity without gps data";
          }

          await writeFile(
            join(__dirname, activitiesFolder, `activity_${activity.id}.gpx`),
            buildGpx(activity)
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
