---
title: "Linux Challenges"
date: 2020-07-12
layout: "writeup"
difficulty: "Easy"
excerpt: "Walkthrough for Linux Challenges on TryHackme"
os: "Linux"
platform: "TryHackMe"
tags: [Linux Challenges, TryHackMe]
comments: false
---

This will serve as a walkthrough for [TryHackMe's](https://tryhackme.com) Linux Challenges Room.

#### Task 1

Task 1 has only 1 question, which asks how many visible files are in garry's home directory. This can be done from the browser directly By running `ls -l`. This ends up showing the number of files available.

#### Task 2

##### Question 1

This question wants you to print out flag 1. This is in garry's home directory, so the results can be found by typing `cat flag1.txt`. This also gets you the credentials needed to uncover flag 2.

![Task 2 Question 1](/images/LinuxChallenges1.png)

##### Question 2

Let's run `su bob` to switch over to bob's user account and enter the password of `linuxrules` found in flag 1 above. Next, let's run `cd ~` followed by `ls -al`. You will see **flag2.txt in this location**. Retrieve the contents of this flag with `cat flag2.txt`.

![Task 2 Question 2](/images/LinuxChallenges2.png)

##### Question 3

This challenge wants you to look at bob's command history. This is done by running `cat .bash_history`. The first entry contains the flag.

![Task 2 Question 3](/images/LinuxChallenges3.png)

##### Question 4

The next question involves viewing cron jobs. This is done by running `crontab -e` which pulls up bob's cron jobs. Flag 4 is present in this file.

![Task 2 Question 4](/images/LinuxChallenges4.png)

##### Question 5

Question 5 is asking you to find and retrieve flag 5. Let's use `find / -name  flag5* 2>/dev/null` This will show you that the file is in **/lib/terminfo/E/flag5.txt**. Use `cat /lib/terminfo/E/flag5.txt` to get this flag.

![Task 2 Question 5](/images/LinuxChallenges5.png)

##### Question 6

Flag 6 is asking you to grep specific characters inside of flag6. First we need to find where flag6 is at, which can be done with `find / -name  flag6* 2>/dev/null`. This shows you that it is located in **/home/flag6.txt**. Next, run `cat /home/flag6.txt |grep "c9"` This will highlight that portion of the output for the answer to this question as shown below.

![Task 2 Question 6](/images/LinuxChallenges6.png)

##### Question 7

This question wants you to find a flag in the list of processes. This can be done with `ps aux | grep flag`

![Task 2 Question 7](/images/LinuxChallenges7.png)

##### Question 8

This file is in bob's home directory and has been zipped twice. To extract it from the .gz file extension, run `gzip flag8.tar.gz -d`

![Task 2 Question 8 part 1](/images/LinuxChallenges8.png)

Now, let's unzip the tar file with `tar -xvf flag8.tar`. This will extract flag8.txt, which can be viewed with `cat flag8.txt`.

![Task 2 Question 8 part 2](/images/LinuxChallenges9.png)

##### Question 9

This question states to look in the hosts file for the flag, which can be found in `cat /etc/hosts`.

![Task 2 Question 9](/images/LinuxChallenges10.png)

##### Question 10

This question states to look at the list of users for the flag. This is done with `cat /etc/passwd`.

![Task 2 Question 10](/images/LinuxChallenges11.png)

#### Task 3

##### Question 1

Aliases are usually stored in a user's .bashrc file. Let's navigate to bob's home directory with `ls ~` and then run `cat.bashrc|grep flag`. This will return this flag's value.

![Task 3 Question 1](/images/LinuxChallenges12.png)

##### Question 2

The motd file in Ubuntu is located in the **/etc/update-motd.d** directory which can be found by going running `cat /etc/update-motd.d` and running `grep -i 'flag'`. This will look for the word flag in all the files in that directory with case insensitivity.

![Task 3 Question 2](/images/LinuxChallenges13.png)

##### Question 3

In bob's home directory is a directory called flag13, navigate to it by using `cd ~/flag13`. Running `ls -al` shows there are two scripts in this folder, script1 and script2. Run `diff script1 script2` and you will get the lines that are slightly different. This will result in the flag being uncovered.

![Task 3 Question 3](/images/LinuxChallenges14.png)

##### Question 4

Logs are typically stored in the /var/log file. Let's navigate to this folder with `cd /var/log` and run `ls -al`. You will see a file called **flagtourteen.txt**.

![Task 3 Question 4 part 1](/images/LinuxChallenges15.png)

Let's run `cat flagtourteen.txt` and the last line will have the flag.

![Task 3 Question 4 part 2](/images/LinuxChallenges16.png)

##### Question 5

The hint gives a good clue as where to look. Running `cat /etc/\*release1 will list the info and the first line contains the flag.

![Task 3 Question 5](/images/LinuxChallenges17.png)

##### Question 6

We're looking for a mounted drive for this flag. Let's look under the media folder by typing `cd /media`. Next, run `ls -R`, which will return this flag.

![Task 3 Question 6](/images/LinuxChallenges18.png)

##### Question 7

Use `su alice` to swap to alice and user the provided password **TryHackMe123** and run `cd ~` followed by `ls -al`. You will see flag17 in this folder. Run `cat flag17` to get this flag.

![Task 3 Question 7](/images/LinuxChallenges19.png)

##### Question 8

We actually found this file in the step above. Running `ls -al` in alice's home directory will show a file named .flag18 that can have it's content's revealed with `cat .flag18`. Files beginning with a . are considered hidden files in Linux.

![Task 3 Question 8](/images/LinuxChallenges20.png)

##### Question 9

We can use sed to get this flag. The command is `sed -n '2345p' flag19`. This command looks for line # 2345 in flag19 and prints it out.

![Task 3 Question 9](/images/LinuxChallenges21.png)

#### Task 4

##### Question 1

This flag is also in Alice's home directory, as shown with the `ls -al` command run for flag 18. The file itself appears to be encoded in base64, so running `cat flag20|base64 -d` will decode the flag and provide the appropriate flag for this question.

![Task 4 Question 1](/images/LinuxChallenges22.png)

##### Question 2

This flag requires searching for flag21.php. This can be found with find, like what we had done on Task 2, Question 5. The command to run is `find / -name flag21.php 2>/dev/null`. This will end up being in bob's home directory. Use `su bob` and enter his password (linuxrules) to switch over to his user and then run `cd ~` to navigate to his home directory. Running `cat flag21.php` results in the following.

![Task 4 Question 2 part 1](/images/LinuxChallenges23.png)

This is a hint that there's more to this file, obviously. Let's run `vi flag21.php` and you will see the flag.

![Task 4 Question 2 part 2](/images/LinuxChallenges24.png)

##### Question 3

This flag is back in alice's directory, so running `exit` followed by `cd ~` should get you back to Alice's home directory. We know from the challenge that this is encoded in hex. Let's decode it with xxd. This can be done with ``cat flag22 | xxd -r -p`. The -r flag reverts it from Hex to ASCII, and -p shows output in postscript/plain hexdump style which will show all the characters (if you run it without -p, it cuts off characters at the beginning and end).

![Task 4 Question 3](/images/LinuxChallenges25.png)

##### Question 4

As shown a few questions above (Task 3, Question 8), flag23 is in alice's home directory. This one requires reversing the contents of the file to get the flag. This can be done easily with `cat flag23 | rev`. The rev command reverses contents of a string/file.

![Task 4 Question 4](/images/LinuxChallenges26.png)

##### Question 5

This flag wants you to look at the readable characters in a file with strings. First, we need to locate the file with `find / -name  flag24 2>/dev/null`. This is in garry's home directory. We can run `su garry` and enter his password (letmein) followed by `cd ~` to get to his home directory.

![Task 4 Question 5 part 1](/images/LinuxChallenges27.png)

Next, we can run `strings flag24` to view the text strings in this program. Reviewing the output provides you with this flag about 3/4ths of the way through the printable strings.

![Task 4 Question 5 part 2](/images/LinuxChallenges28.png)

##### Question 6

It appears that flag25 was removed for some reason, so all you have to do is submit on this flag.

##### Question 7

This one wants you to find a flag that contains 4bceb at the beginning of a file. Let's run `find / -type f -not -path "\*proc\*"  -exec grep -l "4bceb" {} \; 2> /dev/null`. This recursively searches in all files that contain 4bceb that are not in the proc directory and displays file names. We skip the proc directory as linux uses it to create directories for each running process and it will extend the time the scan takes to run. We end up with a few results as shown below.

![Task 4 Question 7 part 1](/images/LinuxChallenges29.png)

Let's run `cat /var/cache/apache2/mod_cache_disk/config.json` and you will find the flag.

![Task 4 Question 7 part 2](/images/LinuxChallenges30.png)

##### Question 8

The hint helps tremendously. As alice, run `sudo -l` and you can see that you can run the cat command with sudo to read the /home/flag27 file. This is done with `sudo /bin/cat /home/flag27`.

![Task 4 Question 8](/images/LinuxChallenges43.png)

##### Question 9

This one is asking for the kernel version. This can be easily found by running `uname -a`.

![Task 4 Question 9](/images/LinuxChallenges31.png)

##### Question 10

This flag wants you to perform some manipulation on a file. Let's first find it's location with `find / -name flag29* 2>/dev/null`. This file is in garry's home directory. Let's run `su garry` and enter his password of letmein and then change to his home directory with `cd ~`.

![Task 4 Question 10 part 1](/images/LinuxChallenges32.png)

We can use a combination of cat and tr (translate) to find the answer. The command to run is `cat flag29|tr -d " \n"`. Make note of the extra space between the first quote and the \n. This tells translate to delete all whitespace and new line flags. Copy the last portion after the last comma for the flag. 

![Task 4 Question 1 part 2](/images/LinuxChallenges33.png)

#### Task 5

##### Question 1

The hint make this one rather simple, as it asks if a service is running on localhost. Let's run `curl http://127.0.0.1` and you will get this flag.

![Task 5 Question 1](/images/LinuxChallenges34.png)

##### Question 2

This flag requires logging into a MySQL database with the provided credentials. Use `mysql -u root -p` and enter the password (hello) when prompted. Next, use `show databases;` to list the databases to uncover this flag.

![Task 5 Question 2](/images/LinuxChallenges35.png)

##### Question 3

This asks you to get data out of the the database that was found in the previous question. First, type `use database_<previous flag>;` to use the database. Next, run `show tables;` followed by `SELECT * from flags;` to get this flag.

![Task 5 Question 3](/images/LinuxChallenges36.png)

##### Question 4

This requires downloading a file locally and listening to it. This file is located under alice's home directory, so run `su alice`, enter her password (TryHackMe123), run `cd ~` followed by `ls -al` to confirm this file is here. 

![Task 5 Question 4 part 1](/images/LinuxChallenges37.png)

Next, in another terminal window from your attacker PC, run `scp alice@[machine ip]:/home/alice/flag32.mp3 ~/flag32.mp3*` to connect with scp and save the file to your attacker pc's home folder.

![Task 5 Question 4 part 2](/images/LinuxChallenges38.png)

Open this file and listen to it to get the flag.

##### Question 5

$PATH variables are stored in each user's **.profile** file found in their home directory. I just looked at each of the 3 users, and located it in bob's home directory. Running `cat .profile` revealed this flag.

![Task 5 Question 5](/images/LinuxChallenges39.png)

##### Question 6

System variables can be found with the set command. Let's run `set|grep flag`.

![Task 5 Question 6](/images/LinuxChallenges40.png)

##### Question 7

This question wants you to list all the groups on the system to find this flag. These are stored in /etc/group, so running `cat /etc/group` will lead to this flag.

![Task 5 Question 7](/images/LinuxChallenges41.png)

##### Question 8

This is the last flag and wants you to find who is a member of the hacker group. This can be done by running `getent group hacker`. This shows that bob is part of the hacker group. Next, let's find flag 36 with `find / -name  flag36 2>/dev/null`. It is located in the /etc folder. Let's run `cat /etc/flag36` to get this flag and complete the challenge.

![Task 5 Question 8](/images/LinuxChallenges42.png)

##### Question 9

Congratulations! You have completed all the challenges. Click on Completed to finish this room.
