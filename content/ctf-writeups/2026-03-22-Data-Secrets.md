---
title: "Data Secrets"
date: 2026-03-14
layout: "writeup"
difficulty: "Medium"
excerpt: "Walkthrough for Data Secrets on HackSmarter"
os: "AWS"
platform: "HackSmarter"
tags: [AWS, Cloud Security, PACU, IAM, Metadata]
comments: false
---

## Executive Summary

Data Secrets is a "Medium" difficulty AWS-focused challenge that centers on **Cloud Infrastructure Entitlement Management (CIEM)** and metadata exploitation. The attack chain began with compromised AWS Access Keys, leading to the enumeration of EC2 instances via the **PACU** exploitation framework. By extracting sensitive credentials from **EC2 User Data** and leveraging the **Instance Metadata Service (IMDS)**, lateral movement was achieved. The final objective was reached by compromising a Lambda function's environment variables to gain the necessary permissions to query **AWS Secrets Manager**.

<hr class="terminal-divider" style="margin-top: 25px;">

## Tooling Analysis

The following tools and frameworks were utilized during this engagement:

| Tool                                       | Category       | Purpose                                                                     |
|:------------------------------------------ |:-------------- |:--------------------------------------------------------------------------- |
| **AWS CLI** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Administration &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| Interacting with AWS services (IAM, EC2, Lambda, Secrets Manager).          |
| **PACU**                                   | Exploitation   | AWS exploitation framework used for automated enumeration and exfiltration. |
| **CURL**                                   | Enumeration    | Interacting with the Instance Metadata Service (IMDSv1) on port 80.         |
| **SSH**                                    | Access         | Establishing remote terminal access to compromised EC2 instances.           |

<hr class="terminal-divider" style="margin-top: 25px;">

## 1. Enumeration & Reconnaissance

### Initial Configuration

The engagement started with the configuration of a local AWS profile using a set of provided Access and Secret keys.

`aws configure --profile initial-attacker`

![DataSecrets1.png](/images/DataSecrets1.png)
![DataSecrets2.png](/images/DataSecrets2.png)

### Automated Enumeration with PACU

To streamline the discovery process, PACU was used to import the keys and attempt to identify the user's permissions.

![DataSecrets3.png](/images/DataSecrets3.png)

Running `iam__enum_permissions` indicated that the current role was restricted from listing its own inline or managed policies directly.

![DataSecrets4.png](/images/DataSecrets4.png)

<hr class="terminal-divider">

## 2. Lateral Movement & Data Exfiltration

### EC2 Metadata and User Data

Shifting to service-based enumeration, the `ec2__enum` module identified two active instances in the `us-east-1` region.

`run ec2__enum --regions us-east-1`

![DataSecrets5.png](/images/DataSecrets5.png)
![DataSecrets6.png](/images/DataSecrets6.png)

The `ec2__download_userdata` module was executed to check for sensitive information often left in bootstrap scripts.

![DataSecrets7.png](/images/DataSecrets7.png)

The exfiltrated `all_user_data.txt` file revealed hardcoded SSH credentials for the `ec2-user`.

![DataSecrets8.png](/images/DataSecrets8.png)

### IMDS Exploitation

Using the recovered credentials, an SSH session was established. Once inside, the **Instance Metadata Service (IMDS)** was queried to identify the IAM role attached to the instance.

`curl http://169.254.169.254/latest/meta-data/iam/security-credentials/cg-ec2-role-cgidyb5s6tdg9q`

![DataSecrets9.png](/images/DataSecrets9.png)
![DataSecrets10.png](/images/DataSecrets10.png)

<hr class="terminal-divider">

## 3. Privilege Escalation to Secret Retrieval

### Lambda Resource Enumeration

Further enumeration of the environment revealed a Lambda function. Querying the function details exposed environment variables containing a new set of AWS credentials.

`aws lambda list-functions --region us-east-1`

![DataSecrets11.png](/images/DataSecrets11.png)

These credentials were used to configure a new AWS CLI profile: `database-user`.

![DataSecrets12.png](/images/DataSecrets12.png)

### Flag Retrieval (Secrets Manager)

The `database-user` profile possessed the `secretsmanager:ListSecrets` and `secretsmanager:GetSecretValue` permissions. The final flag was recovered by querying the secret ID identified during enumeration.

`aws secretsmanager get-secret-value --secret-id cg-final-flag-cgidu45q2dm2pb --region us-east-1 --profile database-user`

![DataSecrets13.png](/images/DataSecrets13.png)
![DataSecrets14.png](/images/DataSecrets14.png)

<hr class="terminal-divider">

## Vulnerability Mapping (CWE)

| ID    | Vulnerability Name       | CWE Mapping                                                 |
|:----- |:------------------------ |:----------------------------------------------------------- |
| **1** | Credentials in User Data | **CWE-522**: Insufficiently Protected Credentials           |
| **2** | SSRF / IMDSv1 Enabled    | **CWE-918**: Server-Side Request Forgery                    |
| **3** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Secrets in Env Variables &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | **CWE-215**: Information Exposure Through Debug Information |

<hr class="terminal-divider" style="margin-top: 25px;">

## Remediation & Mitigation Strategies

### 1. Secure Bootstrap Scripts (NIST SC-28, CIS Control 3.3)

* **Mitigation:** Remove all plaintext credentials from EC2 User Data.
* **Recommendation:** Use **AWS Systems Manager (SSM) Parameter Store** or **Secrets Manager** to dynamically fetch credentials at runtime instead of hardcoding them in scripts.

### 2. Enforce IMDSv2 (NIST AC-3, CIS Control 4.1)

* **Mitigation:** Transition all EC2 instances to **IMDSv2**, which requires a session-oriented token and mitigates SSRF vulnerabilities.
* **Recommendation:** Disable IMDSv1 globally and enforce the hop limit to prevent metadata exfiltration.

### 3. Least Privilege for IAM Roles (NIST AC-6, CIS Control 5.2)

* **Mitigation:** Audit Lambda environment variables and IAM policies to ensure roles only have the minimum necessary permissions.
* **Recommendation:** Use **IAM Access Analyzer** to identify over-privileged roles and move sensitive configuration data into encrypted environment variables or Secrets Manager.
