export default interface Message {
  id: string;
  claimId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface ReadMessage {
  updatedCount: number;
}
