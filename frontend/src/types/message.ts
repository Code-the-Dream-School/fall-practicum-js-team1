export default interface Message {
  id: string;
  claimId: string;
  senderId: string;
  body: string;
  readAt: Date;
  createdAt: Date;
}

export interface ReadMessage {
  updatedCount: number;
}
