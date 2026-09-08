import type { Express } from 'express';

/** Express 4 does not forward rejected async handlers to error middleware. */
export function forwardAsyncErrors(app: Express) {
  const wrap = (handler: any): any => Array.isArray(handler) ? handler.map(wrap)
    : typeof handler !== 'function' || handler.length === 4 ? handler
    : function (req: any, res: any, next: any) {
      Promise.resolve(handler(req, res, next)).catch(next);
    };
  for (const method of ['get', 'post', 'put', 'patch', 'delete', 'use'] as const) {
    const register = app[method].bind(app) as any;
    (app as any)[method] = (...args: any[]) => register(...args.map(wrap));
  }
}
