---
layout: post
title: "Year of the Rabbit - TryHackMe"
date: 2020-07-23
ctf: true
excerpt: "Walkthrough for Year of the Rabbit on TryHackme"
tags: [Year of the Rabbit, TryHackMe, privilege escalation, steganography, website enumeration, CVE]
comments: false
---

Year of the Rabbit is an easy difficulty box on [TryHackMe](https://www.tryhackme.com). Below are the steps taken to root the box.

First, I ran Threader3000 on this box and it returns 3 open ports.

![Year of the Rabbit Threader3000](/assets/img/YearOfTheRabbit1.png)

Next, I ran **nmap -A -p 21,22,80** to better enumerate these ports and gain more info on what is running.

![Year of the Rabbit nmap](/assets/img/YearOfTheRabbit2.png)

Next, I visited the website to see what was present. The website pulled up the default web page for Apache2.

![Year of the Rabbit website](/assets/img/YearOfTheRabbit3.png)

Next, I ran **gobuster dir -u http://[machine ip] -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt -t 50** to enumerate the website.  Within a few moments, the **/assets** directory was uncovered.

![Year of the Rabbit gobuster](/assets/img/YearOfTheRabbit4.png)

Visiting this directory shows two files, RickRolled.mp4, which I assume was the Rick Astley "Never Going to Give You Up" video, and **style.css**. 

![Year of the Rabbit assets directory](/assets/img/YearOfTheRabbit5.png)

The **style.css** page provides you with the next place you are supposed to take a look, **/sup3r_s3cr3t_fl4g.php**

![Year of the Rabbit style.css](/assets/img/YearOfTheRabbit6.png)

Visiting the **/sup3r_s3cr3t_fl4g.php** page provides you with the following popup:

![Year of the Rabbit Sup3r_s3cr3t_fl4g.php](/assets/img/YearOfTheRabbit7.png)

You are then redirected to YouTube, which of course leads to the Rick Astley "Never Going To Give You Up" video. Let's disable JavaScript in our browser and revisit the **/sup3r_s3cr3t_fl4g.php** page. You are presented with another video you have to watch/listen to to get the next hint.

![Year of the Rabbit sup3r_s3cr3t_fl4g no JavaScript](/assets/img/YearOfTheRabbit8.png)

This once again plays Rick Astley's "Never Going To Give You Up" video. At this point I started Burp Suite to see if there was anything to intercept and revisited the **/sup3r_s3cr3t_fl4g.php** page again. We were able to find a request that appears to have a hidden directory in it.

![Year of the Rabbit Intermediary.php hidden directory](/assets/img/YearOfTheRabbit9.png)

copying and pasting this directory gives us another directory with an image in it.

![Year of the Rabbit hidden directory](/assets/img/YearOfTheRabbit10.png)

The picture does pull up, but it seems like a relatively large file size for such a small image. Let's see if there's anything hidden in it. Running **exiftool Hot_Babe.png** provides you with a warning that there is data after the PNG IEND chunk. This sounds like someone manually entered data into this image. Let's open it with **nano Hot_Babe.png**. At the very bottom of the image is a message with the FTP Username and potential passwords, one of which is correct.

![Year of the Rabbit Hot_Babe.png hidden ftp](/assets/img/YearOfTheRabbit12.png)

Let's copy all of the potential passwords and save them in a file named **rabbit.txt**. Next, run **hydra -l [user from Hot_Babe.png] -P rabbit.txt [machine ip] ftp** to brute force the ftp login credentials with hydra. Within a few moments you will have cracked the password.

![Year of the Rabbit hydra](/assets/img/YearOfTheRabbit13.png)

Next, login with **ftp [machine ip]** using the credentials that were just cracked with hydra. Next, run **ls** and **get Eli's_Creds.txt** to save the credential file.

![Year of the Rabbit Eli's Creds](/assets/img/YearOfTheRabbit14.png)

Reviewing Eli's Credentials, it appears they are written in **Brainfuck**. Let's [decode](https://www.dcode.fr/brainfuck-language) and see what we end up with.

![Year of the Rabbit Brainfuck decoded](/assets/img/YearOfTheRabbit15.png)

This provides us with, surprise surprise, Eli's credentials. Let's use them to try to login with **ssh eli@[machine-ip]** and enter the password you just uncovered.

![Year of the Rabbit ssh access](/assets/img/YearOfTheRabbit16.png)

This appears to be our next clue. Let's see if we can find a file with the name s3cr3t in it with **find / -name "s3cr3t" 2>/dev/null**. This returns one result, **/usr/games/s3cr3t**. Let's run **cd /usr/games** followed by **ls**, it shows you that **s3cr3t** is a directory. Let's run **cd s3cr3t** followed by another **ls** to view it's contents. There is a file named **.th1s_m3ss4ag3_15_f0r_gw3nd0l1n3_0nly!** present here.

![Year of the Rabbit s3cr3t directory](/assets/img/YearOfTheRabbit17.png)

Let's run **cat .th1s_m3ss4ag3_15_f0r_gw3nd0l1n3_0nly\\!** to view it's contents. this will give us **gwendoline's password**.

![Year of the Rabbit gwendoline's password](/assets/img/YearOfTheRabbit18.png)

Let's run **su gwendoline** and enter the password that was just uncovered and run **cd ~** to go to her home directory. Next, let's run **ls**, and we are able to get the user flag with **cat user.txt**

![Year of the Rabbit user.txt](/assets/img/YearOfTheRabbit19.png)

Next, let's run **sudo -l** and see if gwendoline has any special privileges. It appears that she can run **/usr/bin/vi /home/gwendoline/user.txt**.

![Year of the Rabbit sudo -l](/assets/img/YearOfTheRabbit20.png)

It appears that gwendoline can open vi as any user except root, which doesn't do us much good, as we need to be able to use root to escalate privileges. At this point I turned to Google to see if there were any vulnerabilities with sudo, and here is where I learned about **CVE-2019-14287**, which is a vulnerability in some versions of sudo. Essentially, if you use a user ID of -1 or sudo, it doesn't know what to do, and reverts to user ID 0, which is root. Let's run **sudo -u#-1 /usr/bin/vi /home/gwendoline/user.txt** and see what happens.

![Year of the Rabbit vi as root](/assets/img/YearOfTheRabbit21.png)

Awesome, we were able to open vi, let's hit escape and enter **!bin/sh** and see who we get a shell as.

![Year of the Rabbit root shell](/assets/img/YearOfTheRabbit22.png)

We now have root access, now just run **cd /root** and **cat root.txt** to get the final flag for this box.
