export interface IIssue {
  title: string;
  description: string;
  status : string,
  type: "bug" | "feature_request";
  reporter_id?: number;
}

export interface IQuery  {
 sort? : string,
 type? : string,
 status? : string,
}