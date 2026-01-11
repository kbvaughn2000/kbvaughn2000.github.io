---
title: "Biohazard"
date: 2020-07-14
layout: "writeup"
difficulty: "Medium"
excerpt: "Walkthrough for Biohazard on TryHackme"
os: "Linux"
platform: "TryHackMe"
tags: [Biohazard, TryHackMe, encryption, puzzle]
comments: false
---


Biohazard is a medium difficulty box on [TryHackMe](https://www.tryhackme.com). This box is based on the Resident Evil/Biohazard video game series, and features several encryption puzzles. Below are the steps I took to root this box.

### Task 1

I initially started with scanning this box with `nmap -A [machine ip]`. This returns the following results.

![Biohazard nmap](/images/Biohazard1.png)

This provides us with the answer to **Question 2 (3 ports)**. Question 1 Just asks you to deploy the machine so you can complete it at any time.

Let's visit the webpage first and see what is there.

![Biohazard Web Page](/images/Biohazard2.png)

On this page is the answer to **Question 3**.

### Task 2

Let's next click on the link to enter the mansion at the bottom of the page. Once there, there is a bit of the story of the first Biohazard game and it is asking you where the gun shot came from. If you look at the source of this page, it directs you to go to the **/diningRoom/**. 

![Biohazard Mansion source](/images/Biohazard3.png)

Let's navigate to this page next, which is located at **http://[machine ip]/diningRoom/**. There is a bit more of the story, and it asks if you want to take the emblem on the wall. Click on **Yes** at the bottom of the page. 

![Biohazard emblem](/images/Biohazard4.png)

This is the answer to **Question 1** for Task 2. Let's refresh the /diningRoom/ page as elected and look at the input field at the bottom of the page. Paste in the emblem key you received a few moments ago and click on submit. Unfortunately, this does not do anything except send you to a page stating Nothing happened. In the info at the bottom of the page, it states that the shell must be in another room. Let's look at the source code for the **/diningRoom/** page.

![Biohazard diningRoom source](/images/Biohazard6.png)

There appears to be another comment encoded in base 64 in the source code. Let's run `echo [comment] | base64 -d` and see what we get. This directs us to the **/teaRoom/**.

![Biohazard base64 decode teaRoom](/images/Biohazard7.png)

The teaRoom has another bit of information and a link for a **Lockpick** you can click on and a suggestion to visit another room **/artRoom/**. 

![Biohazard teaRoom](/images/Biohazard8.png)

Let's click on the Lockpick link first. This gives us the answer to **Question 2** for Task 2.

![Biohazard lock_pick](/images/Biohazard9.png)

Next, let's go visit the **/artRoom**/. This page has another link on it that you can investigate.

![Biohazard artRoom](/images/Biohazard10.png)

Clicking this link gives you a "map", which has a list of several subdirectories on this website it appears.

![BioHazard Map](/images/Biohazard11.png)

Let's start with the next entry on the list we haven't visited, which is the **/barRoom/**. It says it can be opened with a **lockpick**. Enter the flag you received earlier for the lock_pick and click submit.

![Biohazard barRoom lock_pick](/images/Biohazard12.png)

It will ask you to play the piano, but it is asking for a sheet music to proceed. At the bottom, there is a note about the moonlight sonata, click on it to read it.

![Biohazard barRoom](/images/Biohazard13.png)

Visiting this page gives you an encrypted message. Let's see if we can figure out what its encrypted with.

![Biohazard music note](/images/Biohazard14.png)

After playing around on [CyberChef](https://gchq.github.io/CyberChef/) for a bit, I uncovered that this was in base32 format and decoded the **music_sheet**

![Biohazard base32 decode](/images/Biohazard15.png)

This is the answer to **Question 3** of Task 2. Next, let's click back and enter this code in the **Play this piano?** section and press submit.

![Biohazard play piano](/images/Biohazard16.png)

This will take you to a page with a gold emblem. Click on **Yes** to take it to get the key for the gold emblem. This is the answer to **Question 4** of Task 2.

![Biohazardgold_emblem](/images/Biohazard17.png)

Go back to the previous page and refresh it and input the **gold_emblem** flag you just received. You will get an answer of "Nothing happened". However if you enter the **emblem** flag from earlier, you get a different response.

![](/images/Biohazard18.png)

It appears that these paths are done. Let's go go back to our "map" and go to the next site on the list, which is **/diningRoom2F/**. This page says that there is a shining blue gem but Jill can't reach it. Let's see if there's anything in the source code on this page. Once again there's something hidden in the comments, and this appears to be encoded with either ROT13 or a Caesar cipher.

![Biohazard diningRoom2f source](/images/Biohazard19.png)

It appears that this was in Rot 13, it directs you to go to another page under the **/diningRoom/** subdirectory. This leads you to the **blue_jewel** flag, which is the answer to **Question 6** for Task 2. 

![Biohazard blue_jewel](/images/Biohazard20.png)

Let's once again go back to our "map" and go to the next page on the list, which is the **/tigerStatusRoom**. It appears you can put a gem in the tiger's eye. Use the **blue_jewel** from earlier. This gets you a note about crest 1.

![Biohazard tiger crest 1](/images/Biohazard29.png)

We're done here so let's visit the **/galleryRoom/**. There is a note that can be examined.

![Biohazard Gallery Room](/images/Biohazard21.png)

Examining the note provides you with information about crest 2, which has been encoded twice, but contains 18 letters.

![Biohazard crest2 note](/images/Biohazard22.png)

We will work on decoding this later.

I visited the **/studyRoom/, /armorRoom/** and **/attic**, and they required either the shield key or helmet key that we do not have, so in true Resident Evil fashion, I started revisiting rooms. I started with the **/diningRoom/** and used the **gold_emblem** flag which gave us yet another encoded message. 

![Biohazard vigenere cipher](/images/Biohazard23.png)

This is a Vigenere cipher and it is decoded with the key you found using the **emblem** a few rooms back. It provides you with the location of the shield key.

![Biohazard Vigenere Cipher Shield Key](/images/Biohazard24.png)

Let's navigate to this page that is mentioned, and you uncover the **shield_key**.

![Biohazard shield_key](/images/Biohazard25.png)

Next, let's head to the **/armorRoom/** as it can be unlocked with the **shield_key**. 

![ArmorRoom shield_key](/images/Biohazard26.png)

This room contains a note in it, click on the link for that note and you are given information about crest 3.

![Biohazard crest 3 armorRoom](/images/Biohazard27.png)

Next, let's go into the **/attic/** which also uses the **shield_key**

In the attic, there is a link to another note, which provides info about crest 4:

![Biohazard crest 4 attic](/images/Biohazard28.png)

At this point, we have all 4 crests, let's decode them.

**Crest 1** -  Base 64 then Base 32

**Crest 2** - Base 32 then Base 58

**Crest 3** - Base64, Binary, Hex

**Crest 4** - base 58, Hex

Afterwards, combine the results together and decode it with base64 to get the FTP credentials.

### Task 3

Next, let's connect to the site via ftp with the credentials we uncovered. There are several files present here which can be downloaded with `mget *`.

![Biohazard ftp access](/images/Biohazard30.png)

They 3 key .jpgs all look like normal images, and it appears we have the helmet_key encrypted with gpg, and a note, that we can read with `cat important.txt`. It appears it is a note from Barry, which contains access to another hidden directory. Let's go visit this page. This is the answer to **Question 1** of Task 3.

![Biohazard important.txt](/images/Biohazard31.png)

Visiting this page doesn't get us very far, as it needs the gpg key decoded from earlier.

![Biohazard hidden room helmet key](/images/Biohazard32.png)

Question 2 has a great hint. It is implying that one of the keys has a file hidden in it, another has a comment in the metadata, and I wasn't sure what the third one (walk away) meant. While I pondered that, I tried to get the other 2 sorted out.

After some trial and error, I realized that 001-key.jpg had a file hidden in it. This was extracted by running `steghide extract -sf 001-key.jpg`. I left the passphrase blank and hit enter, and **key-001.txt** was extracted. This contained part of a password.

![Biohazard key 001 steghide](/images/Biohazard33.png)

Next, I ran `exiftool 002-key.jpg` and in the Comments section, there was part of the password.

![Biohazard exiftool key 002](/images/Biohazard34.png)

For the 3rd key, use `binwalk -e 003-key.jpg` and it will extract the files to **_003-key.jpg.extracted**. Navigate to this folder with `cd _003-key.jpg.extracted` and run `ls`. There is a text file here that can be viewed with `cat key-003.txt`, which is the 3rd part of the password. 

![Biohazard binwalk key 003](/images/Biohazard35.png)

Let's combine these together. It does not appear to be a normal password, and appears to be encoded (surprise, surprise). They can be decoded with base64, and that is the answer to **Question 3** for Task 3. Now let's extract the helmet key flag with this password. This can be done with `gpg helmet_key.txt.gpg`. Enter the uncovered password from the 3 keys and then it should save in the same directory as a normal text file, which can be viewed with `cat helmet_key.txt`.

![Biohazard Helmet Key](/images/Biohazard36.png)

### Task 4

Let's go back to the study room now that we have the **helmet_key**. Once entered, you find a sealed book with a link to examine it. Upon doing so, a zip file is opened that contains a tar file inside of it which contains a file named **eagle_medal.txt**. (I was able to open bot of these files with Engrampa File Manager which is standard in Kali). Inside **eagle_medal.txt** was the ssh user. This is the answer to **Question 1** for Task 4.

![Biohazard SSH user](/images/Biohazard37.png)

Next, let's go back to the hidden room in Barry's note and enter the helmet key there as well. You end up finding Enrico, which is the answer to **Question 3** for Task 4. There are two links here. The 2nd one contains the SSH password, the answer to **Question 2** for Task 4.

![Biohazard SSH Password](/images/Biohazard38.png)

The other link on the hidden page is for MO Disk 1, which contains some encrypted text. 

![](/images/Biohazard39.png)

### Task 5

Let's connect with our newly uncovered SSH credentials and see what we can find now.

![Biohazard SSH](/images/Biohazard40.png)

There is nothing in this user's directory, so let's run `cd ..` followed by `ls` and we will see additional users of hunter and weasker. Let's navigate into weasker's folder with `cd weasker` and run `ls` again. There is a note present that can be read with `cat weasker_note.txt`. This contains the answers of who the traitor is and the ultimate life form (**Question 2/Question 4**) of Task 5.

![Biohazard traitor ultimate life form](/images/Biohazard41.png)

Let's go fully enumerate the umbrella_guest home directory including hidden files. Let's run `cd ~` followed by `ls -al`. There is a hidden directory called present (which is the answer to **Question 3** of Task 5) as chris.txt is inside of it. This note contains **MO disk 2** in it as well.

![Biohazard Chris Location](/images/Biohazard42.png)

We had an encrypted phrase (MO Disk 1 from earlier) and it appears that MO disk 2 is the key, which makes this a Vigenere cipher like we dealt with earlier. Let's decrypt these and see what we get.

![Biohazard credentials](/images/Biohazard43.png)

We now have login credentials for weasker. His password is the answer to **Question 4** of Task 5. Let's run `su weasker` and enter his password we just uncovered. Next, run `sudo -l` and it shows that this user can run anything as sudo. Let's run `sudo cat /root/root.txt` to get the final flag in this challenge.

![Biohazard root.txt](/images/Biohazard44.png)
