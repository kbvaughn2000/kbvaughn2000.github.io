---
layout: post
title: "Drifting Blues 2"
date: 2021-06-06
ctf: true
excerpt: "Walkthrough for Drifting Blues 2 on Vulnhub"
tags: [Wordpress exploitation, sudo abuse]
comments: false
---

# Drifting Blues 2

Drifting Blues is the second in a series of 9 boxes on [Vulnhub](https://www.vulnhub.com/series/driftingblues,424/).

<details><summary><strong>User Hints</strong></summary>
<ul>
    <li>Have you enumerated the directories for the website?
    <li>Have you added an appropriate entry to your hosts file to properly view the site?
    <li>A well known CMS is running on this server, how can it be exploited?
</ul>
</details>

<details><summary><strong>Root Hints</strong></summary>
<ul>
    <li>What is one of the first commands ran to check the user's privileges to run elevated commands?
    <li>How can we exploit the executable listed?
</ul>
</details>


## Walkthrough

<details><summary><strong>Full Walkthrough</strong></summary>
First, let's find the IP address of the host by utilizing:
**`netdiscover -i eth0`** 

from our Kali host. After a few moments, you should be able to uncover the IP of our target system.

![Drifting Blues 2 netdiscover](/assets/img/driftingblues-2-1.png)

Once you have discovered the IP, let's enumerate this host to determine what ports/services are open/running. To do this, let's run:

**`threader3000`**

and enter the IP uncovered by netdiscover when prompted:

![Drifting Blues 2 threader3000](/assets/img/driftingblues-2-2.png)

Once prompted, let nmap run it's default scan that is built in to threader3000.

![Drifting Blues 2 nmap](/assets/img/driftingblues-2-3.png)

It appears that we have anonymous FTP open, along with SSH and an HTTP server. Let's look at the FTP server first.

Logging into the FTP server took a few attempts, but the username for anonymous access ended up being **ftp**. After entering this username, the password did not matter. Once connected, I ran:

**`ls`** 

followed by:

**`get secret.jpg`**

to list the directory contents and download the only file present. 

![Drifting Blues 2 FTP](/assets/img/driftingblues-2-4.png)

I opened the image file and didn't notice anything strange, and various steganography tools did not detect anything in the image.

With no luck here, I turned to the website running on port 80. Pulling up the initial website presented me with the following:

![Drifting Blues 2 initial website](/assets/img/driftingblues-2-5.png)

I decided to  enumerate the website with dirsearch by running:

**`python3 dirsearch.py -u http://<victim ip> -w /usr/share/wordlists/dirbuster/directory-list-lowerase-2.3-medium.txt`**

After a few minutes, the **/blog/** subdirectory was discovered.

![driftingblues-2-6](/assets/img/driftingblues-2-6.png)

Visiting this directory presented us with the following website. However, it appeared that it did not load properly. Placing my mouse over one of the titles showed that the website hostname was driftingblues.box:

![Drifting Blues 2 /blog/ website](/assets/img/driftingblues-2-7.png)

I edited my attacker pc's /etc/hosts file with:

**nano /etc/hosts**

and added the appropriate entry as shown below.

![Drifting Blues 2 /etc/hosts edit](/assets/img/driftingblues-2-8.png)

I then reloaded the website to see if it updated the appearance:

![Drifting Blues 2 /blog/ website properly loaded](/assets/img/driftingblues-2-9.png)

Based on prior experience with the layout of this site, I was pretty positive it was a WordPress website. I decided to run WPScan with the following parameters to enumerate the first 20 users on the box:

**`wpscan --url http://driftingblues.box/blog -e u1-20`**

![Drifting Blues 2 WPScan 1](/assets/img/driftingblues-2-10.png)

![Drifting Blues 2 WPScan 2](/assets/img/driftingblues-2-11.png)

![Drifting Blues 2 WPScan 3](/assets/img/driftingblues-2-12.png)

As shown above, the **albert** user was uncovered as part of this scan. Next, I used WPScan again with a different set of parameters to brute force the user password:

**`wpscan --url http://driftingblues.box/blog --passwords /usr/share/wordlists/rockyou.txt --usernames albert`**

![Drifting Blues 2 WPScan 4](/assets/img/driftingblues-2-13.png)

![Drifting Blues 2 WPScan 5](/assets/img/driftingblues-2-14.png)

After a few moments, the password of **scotland1** was uncovered. Next, I navigated to the admin login page located at **http://driftingblues.box/blog/wp-login.php** and logged in with the credentials uncovered by WPScan.

![Drifting Blues 2 WordPress Login](/assets/img/driftingblues-2-15.png)

Next, I clicked on **Appearance** on the left hand menu followed by **Theme Editor**. Once loaded, I clicked on the **404 Template** on the right hand side.

![Drifting Blues 2 WordPress edit theme](/assets/img/driftingblues-2-16.png)

Next, I copied Pentestmonkey's [Reverse PHP Shell](https://raw.githubusercontent.com/pentestmonkey/php-reverse-shell/master/php-reverse-shell.php) script and overwrote what was present in this template with that shell.

![Drifting Blues 2 Pentestmonkey Reverse PHP Shell](/assets/img/driftingblues-2-17.png)



![Drifting Blues 2 WordPress overwrite 404 Template](/assets/img/driftingblues-2-18.png)

After editing the IP address to match that of my attacker box in the WordPress Template I clicked on **Update File** to save my changes. Next, I opened up a netcat listener from terminal on my attacker box to catch a reverse shell with:

**`nc -nvlp 1234`**

![Drifting Blues 2 nc listener](/assets/img/driftingblues-2-19.png)

After starting the listener, I navigated to one of the blog entries and added **/a** to the url to force a 404 error page. 

![Drifting Blues 2 WordPress 404](/assets/img/driftingblues-2-20.png)

I then returned to my reverse shell and noticed I had a reverse shell as the **www-data** user:

![Drifting Blues 2 Reverse Shell caught](/assets/img/driftingblues-2-21.png)

I then upgraded my shell to a TTY Python shell with:

**`python -c 'import pty; pty.spawn("/bin/sh")'`**

![Drifting Blues 2 shell upgrade](/assets/img/driftingblues-2-22.png)

Next, I ran a few command to enumerate the user home directory and noticed I had read access to their **.ssh** folder and **id_rsa** ssh key. The command entered to naviate here were as follows:

**`cd /home`**

**`ls`**

**`cd freddie`**

**`ls -al`**

**`cd .ssh`**

**`ls -al`**

![Drifting Blues 2 enumerate /home directory](/assets/img/driftingblues-2-23.png)

Next, I used cat to display the contents of the **id_rsa** file with:

**`cat id_rsa`**

![Drifting Blues 2 cat id_rsa](/assets/img/driftingblues-2-24.png)

I then highlighted and copied this and saved it to a file on my attacker box:

![Drifting Blues 2 save id_rsa key locally](/assets/img/driftingblues-2-25.png)

Next, I changed permissions on this file with:

**`chmod 600 id_rsa`**

and then ran:

**`ssh -i id_rsa freddie@<victim ip address>`**

to connect as freddie via SSH, which was successful as shown below.

![Drifting Blues 2 SSH](/assets/img/driftingblues-2-26.png)

Now that we are logged in as freddie, I ran:

**`ls`**

and noticed the user.txt file in this folder. I then used:

**`cat user.txt`**

to display this flag's contents.

![Drifting Blues 2 user flag](/assets/img/driftingblues-2-27.png)

Next, I decided to see what sudo permissions freddie had, if any, so I ran:

**`sudo -l`**

![Drifting Blues 2 sudo -l](/assets/img/driftingblues-2-28.png)

It appears that this user can run nmap as root without a password. I used [GTFOBins](https://gtfobins.github.io/#) and uncovered that there was a way to create a temporary script file and execute it as nmap, which in this case would lead to a root shell:

![Drifting Blues 2 GTFOBins nmap privesc](/assets/img/driftingblues-2-29.png)

At this point, as the root user, all we needed to do to retrieve the final flag were the following commands:

**`cd /root`**

**`ls -al`**

**`cat root.txt`**

![Drifting Blues 2 root flag](/assets/img/driftingblues-2-30.png)

And that's the end of Drifting Blues 2!

</details>
