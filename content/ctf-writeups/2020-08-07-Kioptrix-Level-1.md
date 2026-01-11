---
title: "Kioptrix Level 1"
date: 2020-08-07
layout: "writeup"
difficulty: "Easy"
excerpt: "Walkthrough for Kioptrix Level 1 on VulnHub"
os: "Linux"
platform: "VulnHub"
tags: [OSCP, Apache exploitation, OpenFuck]
comments: false
---


[Kioptrix](https://www.vulnhub.com/entry/kioptrix-level-1-1,22/) Level 1 is a vulnerable machine found on the [NetSecFocus Trophy Room](https://docs.google.com/spreadsheets/d/1dwSMIAPIam0PuRBkCiDI88pU3yzrqqHkDtBngUHNCw8/edit#gid=0) list which I have been using as preparation for the OSCP. Below is a walkthrough to compromise this machine.

First, after downloading and importing the machine into VMware, I had to figure out the IP address of the machine. I used `netdiscover -i eth0` until I came across the IP of this machine.

![Kioptrix Level 1 netdiscover](/images/KioptrixLevel11.png)

This allowed me to figure out the IP address of the box, next I ran `threader3000` on this machine to enumerate the reports. I also allowed it to run its recommended nmap scan upon competion.

![Kioptrix Level 1 threader3000](/images/KioptrixLevel12.png)

![Kioptrix Level 1 nmap](/images/KioptrixLevel13.png)

It appears that this is running Samba and an older version of Apache. Let's start by looking to see if Apache is vulnerable to an exploit. Searching on Google for **apache 1.3.20 exploit** will show a GitHub page to something called OpenLuck, which is an updated version of OpenFuck.

![Kioptrix Level 1 Google](/images/KioptrixLevel14.png)

Follow the directions on the page to download and compile this application.

![Kioptrix Level 1 OpenLuck](/images/KioptrixLevel15.png)

Ironically, the version of Apache that is vulnerable is the one mentioned under step 5, but let's run `./OpenFuck` and take a look at the full list of versions this can exploit. Down the list are two for Apache 1.3.20 labeled **0x6a** and **0x6b**.

![Kioptrix Level 1 OpenFuck Apache List](/images/KioptrixLevel16.png)

Running `./OpenFuck 0x6a [machine ip] 443 -c 40` does not work, however, `./OpenFuck 0x6b [machine ip] 443 -c 40` seems to work.

![Kioptrix Level 1 root shell](/images/KioptrixLevel17.png)

Success, we have a root shell. Next, I ran `/bin/sh -i` to get a better shell and then I ran `find / -name "\*flag\*" 2>/dev/null` to look for flags.

![Kioptrix Level 1 Search For Flags](/images/KioptrixLevel18.png)

Unfortunately this did not return anything useful. Next I decided to look at each user's mail to see if the flag was present there (as that is another common method for CTF challenges). To do this, I ran `cd /var/mail` and ran `ls -al`.

![Kioptrix Level 1 /var/mail](/images/KioptrixLevel19.png)

It appears that root has mail, as the file size is greater than 0 bytes. I ran `cat root` and we found the flag!

![Kioptrix Level 1 root flag](/images/KioptrixLevel110.png)
