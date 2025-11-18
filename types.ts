
export interface Frame {
  id: string;
  name: string;
  category: string;
  url: string;
}

export interface Photo {
  id: string;
  dataUrl: string;
  thumbnail: string;
  timestamp: number;
  frameId: string;
  imagekitUrl?: string;
  imagekitFileId?: string;
}
