type NikeActivityType = "run";
type NikeMetricType =
  | "elevation"
  | "descent"
  | "ascent"
  | "distance"
  | "pace"
  | "latitude"
  | "calories"
  | "steps"
  | "nikefuel"
  | "speed"
  | "longitude"
  | "heart_rate";
type NikeAppID = "NIKEPLUSGPS";

interface NikeMoment {
  key: string;
  value: string;
  timestamp: number;
  app_id: NikeAppID;
  source: string;
}

interface NikeSummary {
  metric: NikeMetricType;
  summary: "mean" | "total";
  source: string;
  app_id: NikeAppID;
  value: number;
}

interface NikeActivity {
  id: string;
  type: NikeActivityType;
  app_id: string;
  start_epoch_ms: number;
  end_epoch_ms: number;
  last_modified: number;
  active_duration_ms: number;
  session: boolean;
  delete_indicator: boolean;
  summaries: Array<NikeSummary>;
  sources: Array<string>;
  tags: {
    note: string;
    shoes: string;
    terrain: string;
  };
  change_tokens: Array<string>;
  metric_types: Array<NikeMetricType>;
  metrics: Array<{
    type: NikeMetricType;
    unit: string;
    source: string;
    appId: NikeAppID;
    values: Array<NikeValue>;
  }>;
  moments: Array<NikeMoment>;
}

interface NikeActivities {
  activities: Array<NikeActivity>;
  paging: {
    after_id: string;
    after_time: number;
  };
}

interface NikeValue {
  start_epoch_ms: number;
  end_epoch_ms: number;
  value: number;
}

export { NikeActivities, NikeActivity };
