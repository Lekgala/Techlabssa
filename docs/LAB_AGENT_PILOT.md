# Lab Agent pilot

The Academy API now contains a controller for one Windows VM. Staff use **Learning → Lab Machines**; students use **Support → Practical lab verification**. Machine checks and notes are recorded separately from ticket status, instructor grading and certificates. The existing simulated-ticket submission flow still operates independently.

## 1. Prepare the VM

Use a disposable Windows 11 VM with a snapshot and console access. Copy a complete, tested Lab Agent publish/installer folder from the separate TechLabs Lab Agent project into the VM. Follow that project's README to install the service as administrator. Do not run the installer or system-changing fault packages on the host laptop.

The guest needs the executable, FaultPackages and dashboard assets. The controller does not install packages, provision VMs, open remote desktops or restore snapshots. Keep the guest's dashboard available to the instructor for recovery.

Use a stable private IPv4 address for the VM. Configure the agent to listen on its private interface on port 8765 and restrict firewall access to the Academy API host. The Academy API must be on the same private network or connected by VPN. A cloud API cannot directly reach a laptop's private VM without that connectivity. Do not expose port 8765 publicly.

## 2. Configure the Academy API

Add these entries to the API server's `.env` (never use `VITE_` prefixes):

```dotenv
LAB_AGENT_URL=http://192.168.50.10:8765
LAB_AGENT_KEY=replace-with-the-unique-key-from-the-VM
LAB_AGENT_ID=
LAB_MACHINE_NAME=Windows 11 Pilot VM
LAB_PILOT_FAULTS=TEST-001
LAB_PILOT_STATE_PATH=server/data/lab-pilot/state.json
```

The address above is an example; substitute the actual VM address. Get the generated key from `C:\ProgramData\TechLabs\LabAgent\agent-key.txt` inside the VM. Do not paste the key into the Academy browser. The controller rejects the agent's default `development-only-key`.

Start/restart the API with `npm.cmd run dev:server` and frontend with `npm.cmd run dev`. Sign in as admin/instructor, open **Lab Machines**, and select **Check connection**. Confirm the hostname and agent ID against the intended VM. Copy that ID into `LAB_AGENT_ID` and restart the API. Check connection again; it must report **Identity confirmed** and `TEST-001: Available` (or `Reset`).

Configuration deliberately accepts only private/loopback IPv4 origins; redirects are rejected. Loopback works only when the API and guest agent share a host/network namespace. API keys over HTTP are for an isolated pilot network only; use HTTPS/private encrypted transport and stronger agent authentication for a production rollout.

## 3. Run TEST-001 first

For a local smoke test, select **Instructor test mode** (the staff default). Complete the connection check, then select **Start TEST-001 test**. On the new test card, select **Apply TEST-001**, remove only `C:\ProgramData\TechLabs\LabAgent\Sandbox\broken.txt` on the agent computer, select **Verify fix**, then **Reset exercise**. No enrolled learner, ticket or repair notes are required. Test runs are visible to staff only. The server restricts this mode to TEST-001 and still allows only one outstanding run across both modes.

Select **Student assignment mode** for the classroom workflow below. Changing modes never cancels or hides an outstanding exercise.

1. Ensure the test learner is enrolled and can sign in.
2. In **Lab Machines**, complete **Connect the machine** and check the connection. In **Prepare the student assignment**, select TEST-001, choose the enrolled learner and click **Create assignment ticket**. The created ticket becomes the selected assignment.
3. In **Reserve and start**, select **Reserve machine**, check the ticket/student, then **Apply fault to VM** on the reserved exercise.
4. The learner opens their Support tab (refresh/reopen the portal after assignment). The practical exercise should show `ACTIVE`.
5. Try **Verify fix** with notes before repairing: it should report that the fault is still present.
6. Inside the VM, remove only `C:\ProgramData\TechLabs\LabAgent\Sandbox\broken.txt`. This package's verification checks that the marker is absent.
7. Enter the diagnosis/repair notes and click **Verify fix** again. Expect **MACHINE CHECK PASSED**. The instructor reviews notes in Attempt history.
8. The instructor selects **Reset exercise**. The VM is then available for the next reservation. Reset never grants repair credit.

## 4. Add the Windows service exercise

After the marker exercise succeeds end to end, set `LAB_PILOT_FAULTS=TEST-001,WIN-001` and restart the API. Confirm WIN-001 is installed using Check connection.

WIN-001 stops Print Spooler. Prepare a VM whose intended baseline is Spooler running with Automatic startup: the current package reset sets that fixed configuration rather than restoring a captured baseline. Snapshot first. Create a WIN-001 ticket, reserve, apply, have the learner diagnose and restore printing, verify, then reset. Check both the actual service state and the recorded outcomes during this acceptance test.

## 5. Add DNS last

Enable `LAB_PILOT_FAULTS=TEST-001,WIN-001,DNS-001` only after testing the previous steps. Inside the VM, set `TECHLABS_DNS_INTERFACE` to the actual adapter name and `TECHLABS_DNS_SERVER` to the instructor-approved incorrect lab DNS address in the Windows service environment, then restart the agent. The package precheck requires both and rejects `127.0.0.1` as the fault target.

Record working DNS values and take a snapshot first. Keep VM console access. DNS-001 captures IPv4 DNS values; verification compares the current values with that baseline, rather than testing full end-to-end DNS functionality. Its scripts need live acceptance testing, including reset, before learner use. The controller calls the agent by IP so changing guest DNS should not change the controller's destination.

## Recovery and limits

- Run one Academy API process. The in-process operation lock does not coordinate multiple API instances. Keep `LAB_PILOT_STATE_PATH` on persistent local storage and include its directory in backups; it contains learner notes and operation history. Do not switch the configured machine while a run is outstanding.
- One outstanding reservation is permitted. No automatic mutation retries occur. An interrupted operation remains pending/UNKNOWN; inspect the guest, then use Reset. Reset reconciles an already Available/Reset package without awarding verification credit. If the agent is stuck Applying/Resetting or baseline recovery fails, recover through the VM console/snapshot and inspect agent state before attempting controller recovery.
- Agent keys stay server-side, and student requests must match both the recorded run owner and current ticket assignment. An agent inside a VM controlled by a student is not tamper-proof examination evidence. Instructor review remains necessary.
- Do not operate the guest dashboard concurrently with the controller. Separate dashboard calls can bypass controller reservations. Avoid snapshotting an active exercise: reverting controller/agent state independently can invalidate evidence.
- Apply/verify/reset can take up to 150 seconds. Ensure the local proxy allows this duration. Durable jobs, per-machine credentials, multiple VMs and central database storage are future work.
- Source-level checks and mock-agent tests do not prove that a particular EXE or package build behaves correctly. No real VM fault was executed when implementing this integration.

## Development checks

```powershell
npm.cmd run lint
npm.cmd run build
node --require ./scripts/windows-tsx-preload.cjs --import tsx --test server/services/lab-pilot.test.ts
```

Tests use a mock agent and temporary state files. They do not connect to the configured VM or the Academy database.
