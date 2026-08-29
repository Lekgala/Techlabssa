import React, { useState } from 'react';
import { SupportTicket } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  HelpCircle, 
  Laptop, 
  Building2, 
  User, 
  Send, 
  ChevronRight,
  ShieldAlert,
  FileCheck2,
  Award
} from 'lucide-react';

interface TicketCardProps {
  ticket: SupportTicket;
  isStudentPortal?: boolean;
  onSolveClick?: (ticket: SupportTicket) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, isStudentPortal = false, onSolveClick }) => {
  const [expanded, setExpanded] = useState(false);

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'P1':
        return <span className="bg-[#000000] text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">P1 Critical (SLA 1h)</span>;
      case 'P2':
        return <span className="bg-[#FAFAFA] text-[#000000] border border-[#000000] text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">P2 High</span>;
      case 'P3':
        return <span className="bg-[#FAFAFA] text-[#707070] border border-[#E0E0E0] text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">P3 Medium</span>;
      default:
        return <span className="bg-[#FAFAFA] text-[#A0A0A0] border border-[#E0E0E0] text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">P4 Low</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'OPEN':
        return <span className="bg-[#FAFAFA] text-[#000000] border border-[#000000] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Open</span>;
      case 'IN_PROGRESS':
        return <span className="bg-[#000000] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">In Progress</span>;
      case 'RESOLVED':
        return <span className="bg-[#FAFAFA] text-[#707070] border border-[#E0E0E0] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Pending Audit</span>;
      case 'VERIFIED':
        return <span className="bg-[#000000] text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full">Verified</span>;
      default:
        return <span className="bg-[#FAFAFA] text-[#A0A0A0] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Closed</span>;
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#F0F0F0] rounded-2xl p-6 hover:border-[#E0E0E0] transition-colors text-[#1A1A1A] space-y-4">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0F0F0] pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#000000] bg-[#FAFAFA] px-2 py-0.5 rounded border border-[#E0E0E0]">
            #{ticket.ticketNumber}
          </span>
          {getPriorityBadge(ticket.priority)}
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(ticket.status)}
          {ticket.gradeScore !== undefined && (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-[#FAFAFA] text-[#000000] px-2.5 py-1 rounded-full border border-[#E0E0E0]">
              <Award className="w-3 h-3 text-[#000000]" />
              <span>Score: {ticket.gradeScore}%</span>
            </span>
          )}
        </div>
      </div>

      {/* Title & User Meta */}
      <div>
        <h4 className="text-base font-light text-[#000000] leading-snug tracking-tight">
          {ticket.issueTitle}
        </h4>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#707070] mt-2">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#A0A0A0]" />
            <span className="text-[#1A1A1A] font-medium">{ticket.companyName}</span>
            <span className="text-[#A0A0A0] font-mono">({ticket.department})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#A0A0A0]" />
            <span className="text-[#1A1A1A]">{ticket.requestedBy}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Laptop className="w-3.5 h-3.5 text-[#A0A0A0]" />
            <span className="text-[#000000] font-mono font-medium">{ticket.device}</span>
          </div>
        </div>
      </div>

      {/* User Problem Statement Quote */}
      <div className="bg-[#FAFAFA] p-4 rounded-xl border border-[#F0F0F0] text-xs text-[#707070] italic">
        "{ticket.description}"
      </div>

      {/* Environment Pill */}
      <div className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-[0.2em] flex items-center gap-2">
        <span>Target:</span>
        <span className="font-mono bg-[#FAFAFA] text-[#000000] px-2 py-0.5 rounded border border-[#E0E0E0] tracking-normal font-medium">
          {ticket.systemEnvironment}
        </span>
      </div>

      {/* Expandable Troubleshooting Checklist */}
      {expanded && (
        <div className="space-y-4 pt-3 border-t border-[#F0F0F0] text-xs animate-in fade-in duration-200">
          <div className="space-y-1.5">
            <h5 className="font-bold text-[#A0A0A0] uppercase tracking-[0.2em] text-[10px]">
              Observed Symptoms & Errors:
            </h5>
            <ul className="space-y-1 bg-[#FAFAFA] p-3 rounded-xl border border-[#F0F0F0]">
              {ticket.stepsToReproduce.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[#707070]">
                  <span className="text-[#000000] font-mono font-bold">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-bold text-[#A0A0A0] uppercase tracking-[0.2em] text-[10px]">
              Investigation Protocol:
            </h5>
            <ol className="space-y-1.5 bg-[#FAFAFA] p-3 rounded-xl border border-[#F0F0F0]">
              {ticket.troubleshootingGuidance.map((guide, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[#707070]">
                  <span className="font-mono text-[#000000] font-bold shrink-0">{idx + 1}.</span>
                  <span>{guide}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Student Submitted Resolution Notes if present */}
          {ticket.studentResolutionNotes && (
            <div className="bg-[#FAFAFA] border border-[#E0E0E0] p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-[#000000] font-bold text-xs uppercase tracking-wider">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Student Resolution & RCA:</span>
              </div>
              <p className="text-[#707070] text-xs">
                <strong className="text-[#000000]">RCA:</strong> {ticket.studentRootCause}
              </p>
              <p className="text-[#707070] text-xs">
                <strong className="text-[#000000]">Fix Action:</strong> {ticket.studentResolutionNotes}
              </p>
              {ticket.instructorFeedback && (
                <div className="mt-2 pt-2 border-t border-[#E0E0E0] text-xs text-[#000000]">
                  <strong>Instructor Feedback:</strong> {ticket.instructorFeedback}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-[0.2em] hover:text-[#000000] transition flex items-center gap-1"
        >
          <span>{expanded ? 'Hide Protocol' : 'View Protocol'}</span>
          <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        {isStudentPortal && onSolveClick && (
          <button
            onClick={() => onSolveClick(ticket)}
            className="px-4 py-2 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3 h-3" />
            <span>{ticket.status === 'OPEN' ? 'Resolve' : 'Update'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
