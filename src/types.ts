export interface User {
  id: string;
  name: string;
  role: "member" | "admin";
  avatar?: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  lastModifiedBy: string;
  version: number;
  status: "draft" | "published" | "review";
}

export interface ModificationLog {
  id: string;
  docId: string;
  userId: string;
  userName: string;
  timestamp: number;
  action: "create" | "update" | "upload";
  description: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  fileUrl: string;
  fileType: "image" | "video" | "document";
  createdAt: string;
  uploaderName: string;
  uploaderId?: string;
}

export enum ViewState {
  LANDING = "LANDING",
  DASHBOARD = "DASHBOARD",
  EDITOR = "EDITOR",
  MATERIALS = "MATERIALS"
}

