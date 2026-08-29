import type { Application, Lead } from '../data/store';

export interface BulkOperationResult {
  succeeded: number;
  failed: number;
  total: number;
  errors: Array<{ id: string; error: string }>;
  timestamp: string;
}

export interface BulkApprovalRequest {
  applicationIds: string[];
  cohortId?: string;
  notes?: string;
  sendEmails?: boolean;
}

export interface BulkEmailRequest {
  recipientIds: string[];
  recipientType: 'applications' | 'leads' | 'students';
  templateId: string;
  variables?: Record<string, any>;
}

export interface BulkStatusUpdateRequest {
  targetIds: string[];
  targetType: 'applications' | 'leads';
  newStatus: string;
  notes?: string;
}

export interface BulkExportRequest {
  targetIds: string[];
  targetType: 'applications' | 'leads' | 'invoices';
  format: 'csv' | 'json' | 'xlsx';
  includeFields?: string[];
}

export class BulkOperationsService {
  /**
   * Approve multiple applications at once
   */
  async approveApplications(
    request: BulkApprovalRequest,
    updateFn: (id: string, status: string, notes: string) => Promise<void>,
    emailFn?: (appId: string) => Promise<void>
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      succeeded: 0,
      failed: 0,
      total: request.applicationIds.length,
      errors: [],
      timestamp: new Date().toISOString()
    };

    for (const appId of request.applicationIds) {
      try {
        await updateFn(appId, 'APPROVED', request.notes || 'Bulk approved');
        
        if (request.sendEmails && emailFn) {
          await emailFn(appId);
        }
        
        result.succeeded++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          id: appId,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  /**
   * Update status for multiple records
   */
  async bulkUpdateStatus(
    request: BulkStatusUpdateRequest,
    updateFn: (id: string, status: string) => Promise<void>
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      succeeded: 0,
      failed: 0,
      total: request.targetIds.length,
      errors: [],
      timestamp: new Date().toISOString()
    };

    for (const id of request.targetIds) {
      try {
        await updateFn(id, request.newStatus);
        result.succeeded++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          id,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  /**
   * Generate CSV for bulk export
   */
  generateCSV(data: any[], includeFields?: string[]): string {
    if (!data || data.length === 0) return '';

    const items = data as Record<string, any>[];
    const headers = includeFields || Object.keys(items[0]);
    
    // CSV header
    const csvHeader = headers.map(h => `"${h}"`).join(',');
    
    // CSV rows
    const csvRows = items.map(row => 
      headers.map(field => {
        const value = row[field];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return `"${value}"`;
      }).join(',')
    );

    return [csvHeader, ...csvRows].join('\n');
  }

  /**
   * Generate JSON export
   */
  generateJSON(data: any[]): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Filter and transform data for export
   */
  prepareExportData(
    records: any[],
    fields: string[] = []
  ): any[] {
    if (!fields || fields.length === 0) {
      return records;
    }

    return records.map(record => {
      const filtered: Record<string, any> = {};
      fields.forEach(field => {
        if (field in record) {
          filtered[field] = record[field];
        }
      });
      return filtered;
    });
  }
}

export const bulkOperationsService = new BulkOperationsService();
