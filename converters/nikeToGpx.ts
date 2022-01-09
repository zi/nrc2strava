import { create } from "xmlbuilder";
import { NikeActivity } from "../api/nike/models";
import { getGpx, Point } from "../utils/gpx";

const getGpxFromNike = ({
  type,
  metric_types,
  metrics,
  start_epoch_ms,
}: NikeActivity) => {
  if (type !== "run") {
    throw new Error("Is not a running activity");
  }

  if (
    !metric_types.includes("latitude") &&
    !metric_types.includes("longitude")
  ) {
    throw new Error("Activity without gps data");
  }
  const latitudes = metrics.find((metric) => metric.type === "latitude");
  const longitudes = metrics.find((metric) => metric.type === "longitude");
  const elevations = metrics.find((metric) => metric.type === "elevation");
  const heartRates = metrics.find((metric) => metric.type === "heart_rate");

  let points: Array<Point> = [];

  if (latitudes && longitudes) {
    points = latitudes.values.map((lat, index) => ({
      time: lat.start_epoch_ms,
      latitude: lat.value,
      longitude: longitudes.values[index]?.value,
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

  const root = getGpx(start_epoch_ms, points);

  return create(root as unknown as Record<string, Object>, {
    encoding: "UTF-8",
  }).end({ pretty: true });
};

export { getGpxFromNike };
