---
title: "BankSmarter"
date: 2026-02-07
layout: "writeup"
difficulty: "Medium"
excerpt: "Walkthrough for BankSmarter on HackSmarter"
os: "Linux"
platform: "HackSmarter"
tags: [HackSmarter, SNMP]
comments: false
---

## Executive Summary
BankSmarter is a "Medium" difficulty Linux-based machine that demonstrates the risks of insecure service configurations and improper privilege management. The attack chain began with information disclosure via a public **SNMP** community string, leading to initial access. Privilege escalation was achieved through a multi-stage process involving **Cron job manipulation**, **lateral movement via Socat**, and finally, a **Python Path Hijacking** vulnerability to obtain root-level access.

<hr class="terminal-divider" style="margin-top: 25px;">

## Tooling Analysis
The following tools were utilized during the engagement:

| Tool | Category | Purpose |
| :--- | :--- | :--- |
| **Nmap** | Reconnaissance | TCP and UDP service discovery and version scanning. |
| **SNMPwalk** | Information Gathering &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Enumerating MIB values and system information from the SNMP service. |
| **Pspy** | Enumeration | Monitoring Linux processes in real-time without root permissions. |
| **Socat** | Exploitation | Establishing a bidirectional byte stream to move laterally between user sessions. |
| **Bash/Python**  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| Post-Exploitation | Creating reverse shells and performing environment path hijacking. |

<hr class="terminal-divider" style="margin-top: 25px;">

## 1. Enumeration & Reconnaissance

### Service Scanning
The engagement initiated with a standard TCP scan to identify open ports:

`nmap -p- -sV -sC -T4 -oN full_scan.txt 10.0.29.53`

![BankSmarter1.png](/images/BankSmarter1.png)

Following an unsuccessful attempt to exploit the "RegreSSHion" vulnerability on SSH, a UDP scan targeting the top 10 ports was performed:

`nmap -sU -F 10.0.29.53 -oN UDP_Scan.txt --top-ports 10`

The results indicated that **SNMP (Simple Network Management Protocol)** was accessible.

### SNMP Information Disclosure
Using the default community string `public`, we enumerated system information:

`snmpwalk -v1 -c public 10.0.29.53`

![BankSmarter3.png](/images/BankSmarter3.png)

The output revealed plaintext credentials. By normalizing the discovered username to lowercase, we established an SSH session as the user `layne`.

![BankSmarter4.png](/images/BankSmarter4.png)

<hr class="terminal-divider">

## 2. Initial Access & Lateral Movement

### Cron Job Manipulation
During post-exploitation enumeration, a backup script was identified in Layne’s home directory: `bankSmarter_backup.sh`. 

![BankSmarter5.png](/images/BankSmarter5.png)

Using `pspy`, we confirmed that this script was being executed every minute by a user with **UID 1002** (identified in `/etc/passwd` as `scott.weiland`).

![BankSmarter6.png](/images/BankSmarter6.png)



Because `layne` owned the home directory containing the script, we were able to move the original and replace it with a malicious reverse shell:

`mv bankSmarter_backup.sh bankSmarter_backup.sh.bak`

After creating a new `bankSmarter_backup.sh` with a Bash reverse shell payload, a listener caught the connection as `scott.weiland`.

![BankSmarter8.png](/images/BankSmarter8.png)

### Lateral Movement (Scott to Ronnie)
Reviewing `.bash_history` for `scott.weiland` revealed a specific `socat` command used previously by the user. 

![BankSmarter9.png](/images/BankSmarter9.png)

Executing this command successfully migrated the session to the user `ronnie.stone`.

<hr class="terminal-divider">

## 3. Privilege Escalation to Root

### Environment Path Hijacking
The user `ronnie.stone` was found to be a member of the `bankers` group, which granted access to a custom binary: `/usr/local/bin/bank_backupd`.

![BankSmarter13.png](/images/BankSmarter13.png)

Analysis of the associated Python script revealed that it called `python3` without using an absolute path. This allowed for **Path Hijacking**. By placing a malicious script named `python3` in `/tmp` and prepending that directory to the system `$PATH`, we manipulated the binary into executing our payload with root privileges.


```bash
PATH=/tmp:$PATH
echo -e '#!/bin/bash\n/bin/bash -p' > /tmp/python3
chmod +x /tmp/python3
```

Upon executing `bank_backupd`, the system looked to `/tmp` first for the `python3` interpreter, executing our Bash script instead and granting a root-level shell.

![BankSmarter17.png](/images/BankSmarter17.png)

<hr class="terminal-divider" style="margin-top: 25px;">

## Vulnerability Mapping (CWE)
| ID | Vulnerability Name | CWE Mapping |
| :--- | :--- | :--- |
| **1** | Default SNMP Community String | **CWE-1394**: Use of Default Credentials |
| **2** | Insecure Script Permissions | **CWE-732**: Incorrect Permission Assignment |
| **3** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Unsafe Search Path (Path Hijacking) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | **CWE-427**: Uncontrolled Search Path Element |

<hr class="terminal-divider" style="margin-top: 25px;">

## Remediation & Mitigation Strategies

### 1. Secure Service Configuration (NIST CM-6, CIS Control 4.8)
* **Mitigation:** Change default SNMP community strings to complex, non-default values.
* **Recommendation:** If SNMP is not strictly required for monitoring, the service should be disabled or restricted to specific IP addresses via firewall rules.

### 2. File System Security (NIST AC-6, CIS Control 5.4)
* **Mitigation:** Review script execution locations. Scripts executed by high-privileged users (or other users) should never be stored in directories writable by lower-privileged accounts.
* **Recommendation:** Move system backup scripts to `/usr/local/bin` or `/opt/` with root-only write permissions.

### 3. Secure Coding Practices (NIST SA-3, CIS Control 16)
* **Mitigation:** Always use **absolute paths** in scripts (e.g., `/usr/bin/python3` instead of `python3`).
* **Recommendation:** When calling external binaries within a script, explicitly define the environment or hardcode the binary location to prevent `$PATH` manipulation attacks.