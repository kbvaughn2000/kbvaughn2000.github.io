---
layout: post
title: "CyberHeroes"
date: 2022-06-02
ctf: true
excerpt: "Walkthrough for CyberHeroes on Try Hack Me"
tags: [authentication bypass, Try Hack Me]
comments: false
---

# CyberHeroes

CyberHeroes is an easy rated buffer overflow box on [Try Hack Me](https://tryhackme.com/room/cyberheroes).

<details><summary><strong>Room Hints</strong></summary>
<ul>
    <li>Have you reviewed the source code?
</ul>
</details>



## Walkthrough

<details><summary><strong>Full Walkthrough</strong></summary>

### Task 1 - Uncover the Flag

First, let's enumerate the open ports with:

`threader3000`

![CyberHeroes threader3000](/assets/img/CyberHeroes1.png)

Once complete, let it complete it's recommended nmap scan.

![CyberHeroes nmap](/assets/img/CyberHeroes2.png)

It appears that the only thing hosted is a website on port 80, let's take a look at it.

![CyberHeroes website](/assets/img/CyberHeroes3.png)

The login page presents us with a screen similar to the following:


![CyberHeroes website](/assets/img/CyberHeroes4.png)

I looked at the source code, and it appears that the login is calling the authenticate() function from a script in the source code. This code has the login credentials present in plain text in them (although the password has to be reversed).

![CyberHeroes website source code](/assets/img/CyberHeroes5.png)

Now that we have the credentials, let's login:

![CyberHeroes website login](/assets/img/CyberHeroes6.png)

We should now see the flag for this challenge!

![CyberHeroes website flag](/assets/img/CyberHeroes7.png)

</details>
