export type ApiEnvelope<T> = {
  data: T;
};

export type HealthStatus = {
  status: "ok";
  service: string;
  timestamp: string;
};
