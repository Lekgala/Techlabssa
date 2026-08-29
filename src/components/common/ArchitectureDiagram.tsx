import React, { useState } from 'react';
import { 
  Server, 
  Laptop, 
  Shield, 
  Cloud, 
  Network, 
  Terminal, 
  CheckCircle, 
  Info,
  Cpu,
  Layers,
  Lock,
  Workflow
} from 'lucide-react';

interface ArchitectureNode {
  id: string;
  name: string;
  type: 'Server' | 'Client' | 'Admin' | 'Cloud' | 'Network';
  ipAddress?: string;
  os: string;
  roles: string[];
  description: string;
  labUsage: string;
}

const NODES: Record<string, ArchitectureNode> = {
  dc01: {
    id: 'dc01',
    name: 'DC01 (Domain Controller)',
    type: 'Server',
    ipAddress: '10.0.10.10 /24 (Static)',
    os: 'Windows Server 2022 Datacenter',
    roles: ['Active Directory Domain Services (ad.ubuntu-mfg.co.za)', 'Enterprise DNS Server', 'DHCP Scope Authority (10.0.10.50-200)', 'Group Policy Management (GPMC)', 'File & Storage Services'],
    description: 'The core identity and network services engine of our simulated enterprise (Ubuntu Manufacturing Pty Ltd).',
    labUsage: 'Promoted in Module 4, configured with OUs for Executive, Finance, HR, IT, and Sales. Deliberately broken in Module 5 and Module 13 to teach DNS SRV repair and disaster recovery.'
  },
  client01: {
    id: 'client01',
    name: 'CLIENT01 (Finance Workstation)',
    type: 'Client',
    ipAddress: '10.0.10.21 (DHCP Reserved)',
    os: 'Windows 11 Enterprise (Build 22H2/23H2)',
    roles: ['Domain-Joined Client', 'Company Portal MDM Managed', 'BitLocker Enforced', 'Assigned User: Bongani Dlamini (Finance)'],
    description: 'A realistic end-user laptop subject to corporate Intune compliance, BitLocker encryption, and mapped finance share drives.',
    labUsage: 'Used for Ticket INT-1042 (BitLocker Non-Compliance Lock), GPO drive mapping verification, and software deployment testing.'
  },
  client02: {
    id: 'client02',
    name: 'CLIENT02 (HR Workstation)',
    type: 'Client',
    ipAddress: '10.0.10.22 (DHCP Reserved)',
    os: 'Windows 11 Enterprise',
    roles: ['Domain-Joined Client', 'Hybrid M365 Apps', 'Assigned User: Thabo Mokoena (HR)'],
    description: 'Secondary client workstation used to simulate concurrent user issues, multi-client GPO testing, and credential conflicts.',
    labUsage: 'Used for Ticket HD-2031 (Exchange Online credential loop) and GPO password policy testing.'
  },
  admin01: {
    id: 'admin01',
    name: 'ADMIN01 (IT Administration Station)',
    type: 'Admin',
    ipAddress: '10.0.10.15 (Static)',
    os: 'Windows 11 Enterprise',
    roles: ['RSAT (Remote Server Admin Tools)', 'PowerShell 7 + Microsoft Graph SDK', 'Wireshark Packet Analyzer', 'Windows Sysinternals Suite'],
    description: 'Your tier-1 IT technician battle station. You never log into the Domain Controller directly for daily tasks—you manage the domain remotely like a real sysadmin.',
    labUsage: 'Used across all modules for Active Directory queries, PowerShell bulk provisioning scripts, and Event Viewer remote triage.'
  },
  m365: {
    id: 'm365',
    name: 'Microsoft 365 & Entra ID Tenant',
    type: 'Cloud',
    os: 'Cloud SaaS / Microsoft Entra ID',
    roles: ['Entra ID Identity Federation', 'Exchange Online Mailboxes & Transport Rules', 'Conditional Access Policies', 'MFA Enforcement & SSPR'],
    description: 'Controlled academy cloud tenant providing real Microsoft 365 admin experience without personal credit card requirements.',
    labUsage: 'Modules 8 & 9: User licensing, shared mailboxes, Conditional Access policy creation, and Entra ID risky sign-in investigation.'
  },
  intune: {
    id: 'intune',
    name: 'Microsoft Intune & Defender XDR',
    type: 'Cloud',
    os: 'Cloud Endpoint Management',
    roles: ['Device Compliance Policies', 'Configuration Profiles (BitLocker, Wi-Fi)', 'Company Portal App Deployment', 'Defender for Endpoint Live Response'],
    description: 'Cloud endpoint management and security suite protecting both on-premises virtual machines and cloud workloads.',
    labUsage: 'Modules 10 & 11: Deploying compliance rules, resolving non-compliant devices, and investigating simulated PowerShell malware payloads.'
  }
};

export const ArchitectureDiagram: React.FC = () => {
  const [selectedNodeKey, setSelectedNodeKey] = useState<string>('dc01');
  const selectedNode = NODES[selectedNodeKey];

  return (
    <div className="bg-[#FFFFFF] border border-[#F0F0F0] rounded-3xl p-6 lg:p-8 text-[#1A1A1A]">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#F0F0F0]">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#A0A0A0] uppercase tracking-[0.2em]">
            <Layers className="w-3.5 h-3.5 text-[#000000]" />
            <span>Virtual Sandbox Blueprint</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-light text-[#000000] tracking-tight mt-1">
            Local VMware & Cloud Topology
          </h3>
          <p className="text-xs text-[#707070] mt-0.5">
            Select any node to inspect its network parameters, enterprise roles, and hands-on lab purpose.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#FAFAFA] px-3.5 py-2 rounded-xl border border-[#E0E0E0] text-xs font-mono text-[#000000]">
          <Cpu className="w-4 h-4 text-[#000000] shrink-0" />
          <span>Host: 16GB RAM Recommended</span>
        </div>
      </div>

      {/* Main Visual Topology */}
      <div className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Diagram Map */}
        <div className="lg:col-span-7 space-y-6">
          {/* VMware Host Subnet Box */}
          <div className="relative p-5 rounded-2xl bg-[#FAFAFA] border border-[#E0E0E0] space-y-4">
            <div className="flex items-center justify-between text-xs text-[#707070]">
              <div className="flex items-center gap-2 font-mono font-bold text-[#000000]">
                <Network className="w-4 h-4 text-[#000000]" />
                <span>VMware Subnet: VMnet2 (10.0.10.0/24)</span>
              </div>
              <span className="text-[10px] bg-[#FFFFFF] border border-[#E0E0E0] px-2 py-0.5 rounded text-[#000000] font-mono font-bold uppercase">
                Private Domain
              </span>
            </div>

            {/* Topology Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* DC01 */}
              <div
                onClick={() => setSelectedNodeKey('dc01')}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  selectedNodeKey === 'dc01'
                    ? 'bg-[#FFFFFF] border-[#000000] ring-1 ring-[#000000]'
                    : 'bg-[#FFFFFF] border-[#E0E0E0] hover:border-[#000000]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0]">
                    <Server className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono bg-[#FAFAFA] text-[#707070] px-1.5 py-0.5 rounded border border-[#E0E0E0]">
                    10.0.10.10
                  </span>
                </div>
                <h4 className="font-bold text-xs text-[#000000] mt-2">DC01 (Domain Controller)</h4>
                <p className="text-[11px] text-[#707070] mt-1">Windows Server 2022 • Active Directory, DNS, DHCP, GPO</p>
              </div>

              {/* ADMIN01 */}
              <div
                onClick={() => setSelectedNodeKey('admin01')}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  selectedNodeKey === 'admin01'
                    ? 'bg-[#FFFFFF] border-[#000000] ring-1 ring-[#000000]'
                    : 'bg-[#FFFFFF] border-[#E0E0E0] hover:border-[#000000]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0]">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono bg-[#FAFAFA] text-[#707070] px-1.5 py-0.5 rounded border border-[#E0E0E0]">
                    10.0.10.15
                  </span>
                </div>
                <h4 className="font-bold text-xs text-[#000000] mt-2">ADMIN01 (IT Admin Station)</h4>
                <p className="text-[11px] text-[#707070] mt-1">Windows 11 • RSAT, PowerShell 7, Sysinternals</p>
              </div>

              {/* CLIENT01 */}
              <div
                onClick={() => setSelectedNodeKey('client01')}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  selectedNodeKey === 'client01'
                    ? 'bg-[#FFFFFF] border-[#000000] ring-1 ring-[#000000]'
                    : 'bg-[#FFFFFF] border-[#E0E0E0] hover:border-[#000000]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0]">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono bg-[#FAFAFA] text-[#707070] px-1.5 py-0.5 rounded border border-[#E0E0E0]">
                    FIN-LAPTOP-04
                  </span>
                </div>
                <h4 className="font-bold text-xs text-[#000000] mt-2">CLIENT01 (Finance)</h4>
                <p className="text-[11px] text-[#707070] mt-1">Windows 11 • Bongani Dlamini • BitLocker & Intune</p>
              </div>

              {/* CLIENT02 */}
              <div
                onClick={() => setSelectedNodeKey('client02')}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  selectedNodeKey === 'client02'
                    ? 'bg-[#FFFFFF] border-[#000000] ring-1 ring-[#000000]'
                    : 'bg-[#FFFFFF] border-[#E0E0E0] hover:border-[#000000]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0]">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono bg-[#FAFAFA] text-[#707070] px-1.5 py-0.5 rounded border border-[#E0E0E0]">
                    HR-LAPTOP-02
                  </span>
                </div>
                <h4 className="font-bold text-xs text-[#000000] mt-2">CLIENT02 (HR Staff)</h4>
                <p className="text-[11px] text-[#707070] mt-1">Windows 11 • Thabo Mokoena • Exchange Online</p>
              </div>
            </div>
          </div>

          {/* Cloud Integration Layer */}
          <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#E0E0E0] space-y-4">
            <div className="flex items-center justify-between text-xs text-[#707070]">
              <div className="flex items-center gap-2 font-mono font-bold text-[#000000]">
                <Cloud className="w-4 h-4 text-[#000000]" />
                <span>Cloud Tenant Sandbox</span>
              </div>
              <span className="text-[10px] bg-[#FFFFFF] text-[#000000] border border-[#E0E0E0] px-2 py-0.5 rounded font-mono font-bold uppercase">
                Isolated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* M365 */}
              <div
                onClick={() => setSelectedNodeKey('m365')}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  selectedNodeKey === 'm365'
                    ? 'bg-[#FFFFFF] border-[#000000] ring-1 ring-[#000000]'
                    : 'bg-[#FFFFFF] border-[#E0E0E0] hover:border-[#000000]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0]">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#000000]">Microsoft 365 & Entra ID</h4>
                    <p className="text-[11px] text-[#707070]">Cloud Users, MFA, Conditional Access</p>
                  </div>
                </div>
              </div>

              {/* Intune & Defender */}
              <div
                onClick={() => setSelectedNodeKey('intune')}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  selectedNodeKey === 'intune'
                    ? 'bg-[#FFFFFF] border-[#000000] ring-1 ring-[#000000]'
                    : 'bg-[#FFFFFF] border-[#E0E0E0] hover:border-[#000000]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0]">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#000000]">Intune & Defender XDR</h4>
                    <p className="text-[11px] text-[#707070]">Compliance, MDM, Incident Triage</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Detail Inspection Card */}
        <div className="lg:col-span-5 bg-[#FAFAFA] p-6 rounded-2xl border border-[#E0E0E0] space-y-5 h-full flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A0A0A0]">
                  Inspection Node
                </span>
                <h4 className="text-base font-bold text-[#000000]">{selectedNode.name}</h4>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#FFFFFF] border border-[#E0E0E0] text-[#000000] px-2 py-1 rounded">
                {selectedNode.type}
              </span>
            </div>

            {selectedNode.ipAddress && (
              <div className="bg-[#FFFFFF] p-2.5 rounded-lg border border-[#E0E0E0] flex items-center justify-between text-xs font-mono">
                <span className="text-[#707070]">IP Address:</span>
                <span className="text-[#000000] font-bold">{selectedNode.ipAddress}</span>
              </div>
            )}

            <div>
              <h5 className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-[0.2em]">
                Architecture Overview:
              </h5>
              <p className="text-xs text-[#707070] mt-1 leading-relaxed">
                {selectedNode.description}
              </p>
            </div>

            <div>
              <h5 className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-[0.2em] mb-1.5">
                Installed Roles:
              </h5>
              <ul className="space-y-1.5">
                {selectedNode.roles.map((role, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-[#707070]">
                    <CheckCircle className="w-3.5 h-3.5 text-[#000000] shrink-0 mt-0.5" />
                    <span>{role}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#E0E0E0] text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#000000] text-[11px] uppercase tracking-wider">
                <Workflow className="w-3.5 h-3.5" />
                <span>Hands-on Lab Application:</span>
              </div>
              <p className="text-[#707070] leading-relaxed text-xs">
                {selectedNode.labUsage}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E0E0E0] text-[11px] text-[#A0A0A0] flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[#000000] shrink-0" />
            <span>Virtual machines execute locally on your hypervisor for complete offline control.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
