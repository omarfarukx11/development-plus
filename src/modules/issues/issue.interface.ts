export interface IIssue {
  title: string;
  description: string;
  status : string,
  type: "bug" | "feature_request";
  reporter_id?: number;
}
