export interface IIssue {
  title: string;
  description: string;
  type: "bug" | "feature_request";
  reporter_id?: number;
}
