require("dotenv").config();
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const builder = require("xmlbuilder");
const { get, set, find } = require("lodash");
const { getActivitiesIds, getActivityById } = require("./api/nike");
const { importFile } = require("./api/strava");

const activitiesFolder = "activities";
const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const buildGpx = data => {
  const day = daysOfWeek[new Date(data.start_epoch_ms).getDay()];
  const getISODate = ms => new Date(ms).toISOString();
  const latitudes = find(data.metrics, ["type", "latitude"]);
  const longitudes = find(data.metrics, ["type", "longitude"]);
  const elevations = find(data.metrics, ["type", "elevation"]);
  const heartRates = find(data.metrics, ["type", "heart_rate"]);
  let points = [];

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
        time: getISODate(data.start_epoch_ms)
      },
      trk: {
        name: `${day} run - NRC`,
        type: 9
      }
    }
  };

  if (latitudes && longitudes) {
    points = latitudes.values.map((lat, index) => ({
      time: lat.start_epoch_ms,
      latitude: lat.value,
      longitude: get(longitudes.values[index], "value")
    }));
  }

  if (elevations) {
    let idx = 0;

    points = points.map(point => {
      if (
        elevations.values[idx].start_epoch_ms < point.time &&
        idx < elevations.values.length - 1
      ) {
        idx++;
      }

      return {
        ...point,
        elevation: elevations.values[idx].value
      };
    });
  }

  if (heartRates) {
    let idx = 0;

    points = points.map(point => {
      if (
        heartRates.values[idx].start_epoch_ms < point.time &&
        idx < heartRates.values.length - 1
      ) {
        idx++;
      }

      return {
        ...point,
        heartrate: heartRates.values[idx].value
      };
    });
  }

  set(
    root,
    "gpx.trk.trkseg.trkpt",
    points.map(point => {
      const el = {
        "@lat": point.latitude,
        "@lon": point.longitude,
        time: getISODate(point.time)
      };

      if (point.elevation) {
        el.ele = point.elevation;
      }

      if (point.heartrate) {
        el.extensions = {
          "gpxtpx:TrackPointExtension": {
            "gpxtpx:hr": {
              "#text": point.heartrate
            }
          }
        };
      }

      return el;
    })
  );

  return builder.create(root, { encoding: "UTF-8" }).end({ pretty: true });
};

if (process.argv.includes("nike") && !process.argv.includes("strava")) {
  rimraf(path.join(__dirname, activitiesFolder), () => {
    fs.mkdirSync(path.join(__dirname, activitiesFolder));

    getActivitiesIds().then(ids => {
      ids.map(id => {
        getActivityById(id)
          .then(async data => {
            if (data.type !== "run") {
              return Promise.reject("Is not a running activity");
            }

            if (
              !data.metric_types.includes("latitude") &&
              !data.metric_types.includes("longitude")
            ) {
              return Promise.reject("Activity without gps data");
            }

            return await new Promise((resolve, reject) => {
              fs.writeFile(
                path.join(
                  __dirname,
                  activitiesFolder,
                  `activity_${data.id}.gpx`
                ),
                buildGpx(data),
                err => {
                  if (err) {
                    reject(err);
                  }

                  resolve(`Successfully created ${id} activity!`);
                }
              );
            });
          })
          .then(msg => console.log(msg))
          .catch(err => console.log(err));
      });
    });
  });
}

if (process.argv.includes("strava") && !process.argv.includes("nike")) {
  fs.readdir(activitiesFolder, async (err, files) => {
    Promise.all(
      files.map(file => {
        return importFile(fs.createReadStream(`./activities/${file}`))
          .then(msg => console.log(msg))
          .catch(err => console.log(err));
      })
    )
      .then(() => console.log("Finish"))
      .catch(err => console.log(err));
  });
}
