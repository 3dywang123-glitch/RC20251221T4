import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    userId?: string;
    body: any;
    params: any;
    query: any;
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => any;
//# sourceMappingURL=auth.d.ts.map