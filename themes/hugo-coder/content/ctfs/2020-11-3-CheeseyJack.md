---
layout: post
title: "CheeseyJack"
date: 2020-11-03
ctf: true
excerpt: "Walkthrough for CheeseyJack on Vulnhub"
tags: [privilege escalation, QDPM exploitation, insecure passwords]
comments: false


---

[CheeseyJack](https://www.vulnhub.com/entry/cheesey-cheeseyjack,578/) is a vulnerable system found on VulnHub. Below are the steps I utilized to compromise this vulnerable box.

First, after importing the machine, I ran **netdiscover -i eth0** to discover the IP address of the host.

![CheeseyJack netdiscover](/assets/img/CheeseyJack1.png)

Next, I ran **threader3000** with the IP address of the CheeseyJack machine to enumerate open ports.

![CheeseyJack threader3000](/assets/img/CheeseyJack2.png)

Next, I let it run it's recommended **nmap** scan to find out more details about the open ports.

![CheeseyJack nmap 1](/assets/img/CheeseyJack3.png)

![CheeseyJack nmap 2](/assets/img/CheeseyJack4.png)

It looks like several services are running including OpenSSH, Apache, and rpc. Let's first take a look at the website to see if anything interesting can be uncovered.

![CheeseyJack website](/assets/img/CheeseyJack5.png)

The initial website doesn't have anything glaringly obvious on it, so let's utilize **gobuster dir -u http://[victim ip] -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 20** to enumerate the website for potential interesting information. A few directories are uncovered as shown below.

![CheeseyJack gobuster](/assets/img/CheeseyJack6.png)

Let's take a look at the **/it_security** directory, this directory's contents are listed, and there is a file named **note.txt** which has the following information in it.

![CheeseyJack it_security note.txt](/assets/img/CheeseyJack7.png)

This appears to tell us that someone named **Cheese** has a very poor password for the webapp project. Let's take a look at the **/project_management** directory next.

![CheeseyJack project_management](/assets/img/CheeseyJack8.png)

This page provides us with a login, which is requesting an email address. I tried cheese@cheeseyjack.local with a few easy to guess passwords, but was not able to get in. I did make note that this is running **qdPM 9.1**. Next, I ran **gobuster dir -u http://[victim ip]/project_management -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 20**. 

![CheeseyJack gobuster project_management](/assets/img/CheeseyJack9.png)

This uncovers several potentially interesting directories. After looking around, there was a **databases.yml** file uncovered in the **/project_management/core/config** directory that contains user credentials. I made note of these credentials for potential use elsewhere.

![CheeseyJack project_management subdirectory enumeration](/assets/img/CheeseyJack10.png)

Next, I ran **enum4linux [victim ip]** to see if I could uncover anything interesting.

![CheeseyJack enum4linux](/assets/img/CheeseyJack11.png)

 I was able to uncover 2 usernames: **ch33s3m4n** and **crab**. I made note of these as these could potentially be used in email addresses to login to the **/project_management** subdirectory containing **qdPM**.

![CheeseyJack qdpm login](/assets/img/CheeseyJack12.png)[](/assets/img/)

I tried **ch33s3m4n@cheeseyjack.local** and after several attempts, was able to get logged in with the password of **qdpm** (the note.txt file earlier helped figure this out pretty quickly).

![CheeseyJack qdpm login](/assets/img/CheeseyJack13.png)

I was not able to find a way to upload a reverse shell, so I ran **searchsploit qdpm** and was able to uncover a few exploits. The one I decided to utilize was named **qdPM < 9.1 - Remote Code Execution**. I then ran **searchsploit -m 48146** to copy the script to my local directory.

![CheeseyJack searchsploit](/assets/img/CheeseyJack14.png)

Next, I opened this exploit in a text editor to modify the information outlined below.

![CheeseyJack update RCE exploit](/assets/img/CheeseyJack15.png)

The payload I used was [PenTestMonkey's](http://pentestmonkey.net/tools/web-shells/php-reverse-shell) reverse PHP shell. Next, once saved, I opened a 2nd terminal window and ran **nc -nvlp 8080** to open a netcat listener for this exploit to connect to.

![CheeseyJack nc listener](/assets/img/CheeseyJack16.png)

Next, I went back to the original terminal window to run this exploit with **python3 ./48146.py**.

![CheeseyJack run exploit](/assets/img/CheeseyJack17.png)

This will cause an error, but if you go back to your netcat listener, you should have a shell.

![CheeseyJack reverse shell](/assets/img/CheeseyJack18.png)

Let's do some basic enumeration and see what info we can find. First, let's navigate to **cd /home** and run **ls -al** to enumerate the home directories. Not surprising, two show up, **ch33s3m4n** and **crab**. I didn't find anything of interest in ch33s3m4n's directory, but I did find a **todo.txt** file in **/home/crab**. I then ran **cat todo.txt** which contained some interesting information in it.

![CheeseyJack todo.txt](/assets/img/CheeseyJack19.png)

Next, I ran **cd /var/backups** and ran **ls -al** to enumerate this directory's contents. There was a subdirectory named **ssh-bak** in this directory. I navigated to this folder with **cd ssh-bak** and ran **ls -al**, which shows what appears to be a backup copy of an SSH key.

![CheeseyJack ssh-bak](/assets/img/CheeseyJack20.png)

Next, I ran **cat key.bak** and copied the contents into a text file which I saved as **ssh_key.txt**.

![CheeseyJack SSH key](/assets/img/CheeseyJack21.png)

Next, I opened another terminal window and ran **chmod 600 ssh_key.txt** (as SSH requires these permissions to connect) followed by **ssh -i ssh_key.txt crab@[victim ip]**.

![CheeseyJack SSH crab user](/assets/img/CheeseyJack22.png)

We were now connected as the **crab** user to this host. 

![CheeseyJack privilege escalation](/assets/img/CheeseyJack23.png)

I next ran **sudo -l** to enumerate permissions for this user. It appears that this user can run anything as sudo in the **/home/crab/.bin/** directory, which makes privilege escalation easily attainable. I ran **cp /bin/bash /home/crab/.bin/bash** to copy over the bash shell to this folder, followed by by **sudo /home/crab/.bin/bash -p** to run bash in a privileged mode, this provided me with root access which was verified with **whoami**.

![CheeseyJack root.txt](/assets/img/CheeseyJack24.png)

Finally, I navigate to the root directory with **cd /root** and ran **ls -al**, there was a **root.txt** file present. Running **cat root.txt** provided the information in the screenshot above, finishing up this box!
