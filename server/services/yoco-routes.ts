import express, { type RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { getDatabase, mutateDatabase } from '../data/store.ts';
import { createYocoCheckout, verifyYocoSignature, yocoConfig } from './yoco.ts';
import { amountDue, ownedInvoice, settleYoco, YocoError, type YocoIntent } from './yoco-ledger.ts';

export function yocoWebhook(): RequestHandler[] {
  return [express.raw({ type: 'application/json', limit: '64kb' }), async (req, res, next) => {
    try {
      // Checkout disable switch does not discard payments already in flight.
      const config = yocoConfig({ ...process.env, YOCO_ENABLED: 'true' });
      if (!Buffer.isBuffer(req.body) || !verifyYocoSignature(req.body, req.headers, config!.webhookSecret)) {
        res.status(401).json({ error: 'Invalid webhook signature' }); return;
      }
      let event: unknown;
      try { event = JSON.parse(req.body.toString('utf8')); } catch { res.status(400).json({ error: 'Invalid event' }); return; }
      const result = await mutateDatabase(db => settleYoco(db, event));
      res.json({ received: true, result });
    } catch (error) { next(error); }
  }];
}

export function yocoRouter(authenticate: RequestHandler, studentOnly: RequestHandler, adminOnly: RequestHandler, limit: RequestHandler, checkoutRequest = createYocoCheckout) {
  const router = express.Router();
  router.get('/admin/yoco/payments', authenticate, adminOnly, async (_req, res, next) => {
    try { res.json({ checkouts: (await getDatabase()).yocoCheckouts ?? [] }); } catch (error) { next(error); }
  });
  router.get('/student/invoices/:id/yoco', authenticate, studentOnly, async (req: any, res, next) => {
    try {
      const db = await getDatabase(); ownedInvoice(db, req.params.id, req.session.userId);
      let config = null;
      try { config = yocoConfig(); } catch { /* unconfigured checkout stays unavailable */ }
      let amountCents = 0; let reason = 'Online payment is not configured yet.';
      if (config) { try { amountCents = amountDue(db, req.params.id, req.session.userId); reason = ''; } catch (error) { reason = (error as Error).message; } }
      const history = (db.yocoCheckouts ?? []).filter(i => i.invoiceId === req.params.id && i.studentId === req.session.userId);
      res.json({ enabled: Boolean(config), mode: config?.mode, amountCents, reason, history: history.map(({ id, status, mode, amountCents, createdAt }) => ({ id, status, mode, amountCents, createdAt })) });
    } catch (error) { next(error); }
  });
  router.post('/student/invoices/:id/yoco', authenticate, studentOnly, limit, async (req: any, res, next) => {
    try {
      const config = yocoConfig();
      if (!config) throw new YocoError(503, 'Online payments are disabled');
      const intent = await mutateDatabase(db => {
        ownedInvoice(db, req.params.id, req.session.userId);
        const records = db.yocoCheckouts ??= [];
        if (records.some(i => i.invoiceId === req.params.id && i.status === 'REVIEW')) throw new YocoError(409, 'A payment needs admissions review');
        const pending = records.find(i => i.invoiceId === req.params.id && i.status === 'PENDING');
        const due = amountDue(db, req.params.id, req.session.userId);
        if (pending) {
          if (pending.mode !== config.mode || pending.origin !== config.origin) throw new YocoError(409, 'An earlier checkout needs reconciliation before changing payment settings');
          if (pending.amountCents !== due) throw new YocoError(409, 'Invoice changed since checkout. Contact admissions before paying.');
          return pending;
        }
        const item: YocoIntent = { id: randomUUID(), invoiceId: req.params.id as string, studentId: req.session.userId as string,
          amountCents: due, mode: config.mode, origin: config.origin,
          createdAt: new Date().toISOString(), status: 'PENDING' as const };
        records.unshift(item); return item;
      });
      const checkout = intent.checkoutId && intent.redirectUrl ? { checkoutId: intent.checkoutId, redirectUrl: intent.redirectUrl } : await checkoutRequest(config, intent);
      await mutateDatabase(db => {
        const saved = db.yocoCheckouts!.find(i => i.id === intent.id)!;
        if (saved.checkoutId && saved.checkoutId !== checkout.checkoutId) throw new YocoError(409, 'Checkout identity mismatch');
        Object.assign(saved, checkout);
      });
      res.json({ redirectUrl: checkout.redirectUrl });
    } catch (error) { next(error); }
  });
  return router;
}
