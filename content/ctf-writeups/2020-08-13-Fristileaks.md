---
title: "Fristileaks 1.3"
date: 2020-08-13
layout: "writeup"
difficulty: "Easy"
excerpt: "Walkthrough for Fristileaks 1.3 on Vulnhub"
os: "Linux"
platform: "VulnHub"
tags: [OSCP, website enumeration, base64, rot13, python, privilege escalation]
comments: false
---

[Fristileaks](https://www.vulnhub.com/entry/fristileaks-13,133/) is a vulnerable machine found on the [NetSecFocus Trophy Room](https://docs.google.com/spreadsheets/d/1dwSMIAPIam0PuRBkCiDI88pU3yzrqqHkDtBngUHNCw8/edit#gid=0) list which I have been using as preparation for the OSCP. Below is a walkthrough to compromise this machine.

First, after downloading and importing the machine into VMware, I had to figure out the IP address of the machine. I used `netdiscover -i eth0` until I came across the IP of this machine.

![Fristileaks netdiscover](/images/Fristileaks1.png)

Next, I ran `threader3000` and let it run it's suggested scan. The only port that was open was port 80 as shown below.

![Fristileaks threader3000 nmap](/images/Fristileaks2.png)

Let's visit the website and see what we can figure out.

![Fristileaks website](/images/Fristileaks3.png)

Next, I ran `gobuster -dir -u http://[machine ip] -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt -x .php,.txt`.

![Fristileaks gobuster](/images/Fristileaks4.png)

This uncovered a couple of directories, including robots.txt (which the nmap scan also detected earlier). Let's take a look at **http://[machine ip]/robots.txt**

![Fristileaks robots.txt](/images/Fristileaks5.png)

There are 3 directories that show up here, visiting all 3 of them leads to the same thing shown below:

![Fristileaks /cola](/images/Fristileaks6.png)

At this point, I guessed the subdirectory of **/fristi** and we were presented with a login page:

![Fristileaks /fristi login page](/images/Fristileaks7.png)

We did not have any credentials at this point, so I looked at the source code of this page, where I uncovered a couple of interesting comments

![Fristileaks admin portal source code 1](/images/Fristileaks8.png)

![Fristileaks admin portal source code 2](/images/Fristileaks9.png)

It appears that the 1st comment contains a potential username (**eezeepz**) and the 2nd comment is base64 encoded. Above this is an image that was base 64 encoded, which was a huge hint as to what we were supposed to do. I found [this](https://codebeautify.org/base64-to-image-converter) base64 to Image converter, which produced the following:

![Fristileaks base64 to image](/images/Fristileaks10.png)

Let's try logging into the admin portal with username of **eezeepz** and a password of **keKkeKKeKKeKkEkkEk**. We were able to get into the admin portal with these credentials.

![Fristileaks admin login eezeepz](/images/Fristileaks11.png)

Let's click on **upload file**. It asks you to select an image to upload. I tried uploading a [PHP reverse shell](http://pentestmonkey.net/tools/web-shells/php-reverse-shell) with a php extension, but it was not allowed.

![Fristileaks upload failed](/images/Fristileaks12.png)

However, I changed the filename to **shell.php.png**, and it was able to upload successfully.

![Fristileaks PHP reverse shell upload success](/images/Fristileaks13.png)

On my attacker pc, I opened up a listener for the reverse shell with `nc -nvlp 4444` (as this was the port I had configured in the PHP reverse shell mentioned above).

![Fristileaks nc listener](/images/Fristileaks14.png)

Next, I went to **http://[[machine ip]]/fristi/uploads/shell.php.png** which triggered the reverse shell

![Fristileaks initial foothold](/images/Fristileaks15.png)

Next, I ran `whoami` and noticed I am running as the **apache** user. I then ran `cd /home` followed by `ls -al` to enumerate the user home directories.

![Fristileaks /home enumeration](/images/Fristileaks16.png)

It appears we can access eezeepz's home folder, so let's run `cd eezeepz` and `ls -al` to list the contents of his home directory.

![Fristileaks eezeepz home directory contents](/images/Fristileaks17.png)

There were a ton of files in his home directory, but there was one text file there. Let's run `cat notes.txt`. This provides you with a hint as to what you're supposed to do next.

![Fristileaks cat notes.txt](/images/Fristileaks18.png)

It appears that we can run several commands by creating a file named **runthis** in the **/tmp** directory. Let's navigate to the /tmp directory with `cd /tmp` and then run `echo "/home/admin/chmod 777 /home/admin" > runthis`. This will run the chmod program in the admin's folder as mentioned above and open up full access to his folder to everyone.

![Fristileaks runthis](/images/Fristileaks19.png)

This runs every minute, so after waiting a few moments, let's run `cd /home` followed by `ls -al`. You should now notice that we can access the **admin** user directory.

![Fristileaks access /admin home directory](/images/Fristileaks20.png)

Let's run `cd admin` followed by `ls -al` to list the directory contents here. There are several interesting files here: **cryptedpass.txt, cryptpass.py** and **whoisyourgodnow.txt**. 

![Fristileaks admin home directory contents](/images/Fristileaks21.png)

Let's run **cat** on all 3 of these interesting files. It appears that **cryptedpass.txt** and **whoisyourgodnow.txt** have encoded passwords of some sort. Thankfully, **cryptpass.py** lets us know how it is encoded. Basically the python script accepts an argument, which is the password to be entered, it then encodes it as base64, reverses the string, and the does ROT13 encoding after reversing the string.

![Fristileaks cat interesting files](/images/Fristileaks22.png)

Let's manually reverse this and see what we get. First, I used [this website](https://codebeautify.org/reverse-string) to reverse the two strings.

![Fristileak reverse strings](/images/Fristileaks23.png)

Next, I used [CyberChef](https://gchq.github.io/CyberChef/) to run ROT13 followed by Base64 Decode on the strings that had been unreversed above. This decrypts both of the text files.

![Fristileaks decode passwords](/images/Fristileaks24.png)

The 2nd password (**LetThereBeFristi!**) had fristigod as the owner to the file. I wanted to attempt to swap users with this password, but I needed to upgrade my shell first. I used `python -c 'import pty; pty.spawn("/bin/sh")'` to upgrade our shell first, and then ran `su fristigod` and entered **LetThereBeFristi!** as the password.

![Fristileaks su fristigod user](/images/Fristileaks25.png)

Next, I ran `sudo -l` and it appears that fristigod can run a command with sudo.

![Fristileaks fristigod sudo -l](/images/Fristileaks26.png)

Let's run `cd /var/fristigod` followed by `ls -al` to see what is in this directory. Let's run `cat .bash_history`. This provides you with examples of how to use the **doCom** program that can be ran as sudo.

![Fristileaks doCom sudo](/images/Fristileaks27.png)

Let's try to swap users to root with `sudo -u fristi /var/fristigod/.secret_admin_stuff/doCom su`.

![Fristileaks root shell](/images/Fristileaks28.png)

Success! We now have a root shell. Let's run `cd /root` followed by `ls -al`. There is a fristileaks_secrets.txt file here. Let's run `cat fristileaks_secrets.txt` to finish this box!

![Fristileaks root flag](/images/Fristileaks29.png)
