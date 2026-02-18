// types.d.ts
import 'express';

declare module 'express' {
  export interface Request {
    user?: {
      id: number;
      company_id: number;
      [key: string]: any; // Optionally add other user properties here
    }
  }
}
