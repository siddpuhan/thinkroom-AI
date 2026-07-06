import { getDB } from '../config/db.js';

export class BaseRepository {
  protected get db() {
    return getDB();
  }
}
