interface Point {
  time: number;
  latitude: number;
  longitude: number;
  elevation?: number;
  heartrate?: number;
}

interface GpxPoint {
  "@lat": number;
  "@lon": number;
  time: string;
  ele?: number;
  extensions?: Record<string, unknown>;
}

interface Metadata {
  time: string;
  desc?: string;
  name?: string;
}

interface Gpx {
  gpx: {
    "@creator": string;
    "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance";
    "@xsi:schemaLocation": "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd https://www8.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd https://www8.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd";
    "@version": "1.1";
    "@xmlns": "http://www.topografix.com/GPX/1/1";
    "@xmlns:gpxtpx": "https://www8.garmin.com/xmlschemas/TrackPointExtensionv1.xsd";
    "@xmlns:gpxx": "https://www8.garmin.com/xmlschemas/GpxExtensionsv3.xsd";
    metadata: Metadata;
    trk: {
      name: string;
      type: 9;
      trkseg: {
        trkpt: Array<GpxPoint>;
      };
    };
  };
}

function getISODate(milliseconds: number) {
  return new Date(milliseconds).toISOString();
}

function getGpxPoint(point: Point) {
  const gpxPoint: GpxPoint = {
    "@lat": point.latitude,
    "@lon": point.longitude,
    time: getISODate(point.time),
  };

  if (point.elevation) {
    gpxPoint.ele = point.elevation;
  }

  if (point.heartrate) {
    gpxPoint.extensions = {
      "gpxtpx:TrackPointExtension": {
        "gpxtpx:hr": {
          "#text": point.heartrate + "",
        },
      },
      // "gpxx:TrackPointExtension": {
      //   "gpxx:hr": {
      //     "#text": point.heartrate + "",
      //   },
      // },
    };
  }

  return gpxPoint;
}

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getGpx({
  date,
  points,
  name
}: {
  date: number;
  points: Array<Point>;
  name: string;
}): Gpx {
  const day = daysOfWeek[new Date(date).getDay()];
  return {
    gpx: {
      "@creator": "StravaGPX",
      "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "@xsi:schemaLocation":
        "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd https://www8.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd https://www8.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd",
      "@version": "1.1",
      "@xmlns": "http://www.topografix.com/GPX/1/1",
      "@xmlns:gpxtpx":
        "https://www8.garmin.com/xmlschemas/TrackPointExtensionv1.xsd",
      "@xmlns:gpxx": "https://www8.garmin.com/xmlschemas/GpxExtensionsv3.xsd",
      metadata: {
        time: getISODate(date),
        name
      },
      trk: {
        name: `${day} run - NRC`,
        type: 9,
        trkseg: {
          trkpt: points.map(getGpxPoint),
        },
      },
    },
  };
}

export { getGpx, Point };
