import mongoose, { Schema } from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const dbConnection = mongoose.createConnection(
  process.env.MONGO_CONNECTION_STRING as string,
);

interface Track {
  event: string;
  tags: string[];
  url: string;
  title: string;
  ts: number;
}

const TrackSchema = new Schema<Track>({
  event: { type: String, required: true },
  tags: [
    {
      type: String,
      required: true,
    },
  ],
  url: { type: String, required: true },
  title: { type: String, required: true },
  ts: { type: Number, required: true },
});

export const Track = dbConnection.model<Track>("tracks", TrackSchema);

export class DB {
  public static validateTrack = (list) => Track.validate(list);
  public static saveTracksList = (list) => Track.insertMany(list);
}
