---
title: "CKS Challenge 1"
date: 2023-11-23
layout: "writeup"
difficulty: "Medium"
excerpt: "Walkthrough for CKS Challenge 1 on KodeKloud"
os: "K8s"
platform: "Kode Kloud"
tags: [KodeKloud, CKS]
comments: false
---

# CKS Challenge 1

<a href="https://kodekloud.com/courses/cks-challenges/">CKS Challenge 1</a> is a "set of complex challenges that will assist you in mastering Kubernetes Security concepts and getting ready for the coveted Certified Kubernetes Security Specialist Certification". This particular challenge required the completion of several steps, which are outlined below. The overall requirements for this challenge are as follows.

![CKS Challenge 1 - Summary](/images/CKS-Challenge1-1.png)

First, I utilized `crictl image` to list the images present in this Kubernetes environment. Since we know we're using Nginx based on the container name in the provided deployment file, we know we can narrow the results below to run Trivy on to the Nginx images.

![CKS Challenge 1 - critctl image](/images/CKS-Challenge1-2.png)

Next, to run Trivy and parse the data for viewing the total number of critical vulnerabiltiies, run commands similar to the one below:

```bash
trivy -s CRITICAL image <image name>|grep CRITICAL:
```

Doing this against all of the nginx images reveals that the `nginx:alpine` image is the one with the least amount of critical vulnerabilities (0).

![CKS Challenge 1 - trivy](/images/CKS-Challenge1-3.png)

With this information, we can start editing the provided `alpha-xyz.yaml` deployment file and we can update the container image name to `nginx:alpine` as shown below:

![CKS Challenge 1 - update deployment - update image](/images/CKS-Challenge1-4.png)

Next, we need to implement the provided apparmor custom profile named `usr.sbin.nginx`. First, we need to copy this into the /etc/apparmor.d folder, and then utilize `apparmor_parser` to load this profile:

![CKS Challenge 1 - load apparmor profile](/images/CKS-Challenge1-5.png)

Next, we will need to adjust the deployment file by adding in an annotation under the metadata section that is underneath the container template. Apparmor is enforced at the container level, so it will not work if it is listed under the general metadata area for the entire deployment. This should look like the following:

![CKS Challenge 1 - update deployment - add apparmor](/images/CKS-Challenge1-6.png)

While clicking on the individual components, you will notice that there is a PersistentVolume and a PersistentVolumeClaim. Upon review of these, the PersistentVolume is setup as `RWX`, which stands for ReadWriteMany. Reviewing the configuration of the PersistentVolumeClaim shows that is is configured as `ReadWriteOnce`, which would make these incompatible with each other. These are also looking for a Storage Class named `local-storage`, which currently does not exist.

![CKS Challenge 1 - review pv/pvc/storageclass configuration](/images/CKS-Challenge1-7.png)

First, let's create the Storage Class which should be configured as shown below:

![CKS Challenge 1 - configure storageclass](/images/CKS-Challenge1-8.png)

In this case, I saved this as storageclass.yaml and then I loaded it into kubernetes by running

```bash
kubectl apply -f storageclass.yaml
```

kubectl is using an alias of 'k' in the screenshot below:

![CKS Challenge 1 - implement storageclass](/images/CKS-Challenge1-9.png)

Next, I recreated the Persistent Volume Claim. First, I copied the existing configuration to a YAML file with:

```bash
k get pvc -A -o yaml > pvc.yaml
```

Next, I modified the output to adjust the Access Mode and clean up some of the other information that was not required. The final Persistent Volume Claim YAML file is shown below:

![CKS Challenge 1 - updated pvc configuration](/images/CKS-Challenge1-10.png)


I then deleted the existing improperly configured Persistent Volume Claim and recreated it with:

```bash
kubectl delete pvc -n alpha alpha-pvc
kubectl apply -f pvc.yaml
```

![CKS Challenge 1 - recreate pvc](/images/CKS-Challenge1-11.png)

Next, we need to ensure that the PVC is mounted on the pod in the deployment. This is done by updating the deployment configuration file to add in a Volume (which uses the Persisttent Volume Claim we just reconfigured) and Volume Mount as shown below:

![CKS Challenge 1 - update deployment - add in volume/volumemount](/images/CKS-Challenge1-12.png)

Once updated, we can now create this deployment by running:

```bash
kubectl apply -f alpha-xyz.yaml
```

![CKS Challenge 1 - create deployment](/images/CKS-Challenge1-13.png)

Next, we need to create a Network Policy to limit what can access resources in the alpha namespace. This is done by creating an Ingress Network Policy that uses podSelector labels to only allow the "middleware" pod to communicate with other resources in the alpha namespace. The final configuration of the network policy is shown below:

![CKS Challenge 1 - create networkpolicy](/images/CKS-Challenge1-14.png)

Next, we will need to apply this policy like we have done with previous YAML files, which is done with:

```bash
kubectl apply -f networkpolicy.yaml
```

The final task to complete this challenge is to create a service named `alpha-svc` and expose it as a ClusterIP service over port 80 with a target port of 80 as well. This can be done by running the following:

```bash
k expose deployment/alpha-xyz --namespace alpha --port=80 --target-port=80 --protocol=TCP --name=alpha-svc --type=ClusterIP
```


![CKS Challenge 1 - expose deployment](/images/CKS-Challenge1-15.png)

This will expose the deployment as requested using a ClusterIP over port 80. At this point, you should be able to run a final check, which should return the challenge as completed!

![CKS Challenge 1 - completion](/images/CKS-Challenge1-16.png)

<hr class="terminal-divider">

Below are the final configurations of the YAML files utilized during this challenge:


### storageclass.yaml
```
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
```

### pvc.yaml
```
apiVersion: v1
items:
- apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: alpha-pvc
    namespace: alpha
  spec:
    accessModes:
    - ReadWriteMany
    resources:
      requests:
        storage: 1Gi
    storageClassName: local-storage
    volumeMode: Filesystem
kind: List
metadata:
  resourceVersion: ""
  selfLink: ""
```


### alpha-xyz.yaml
```
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: alpha-xyz
  name: alpha-xyz
  namespace: alpha
spec:
  replicas: 1
  selector:
    matchLabels:
      app: alpha-xyz
  strategy: {}
  template:
    metadata:
      annotations:
        container.apparmor.security.beta.kubernetes.io/nginx: localhost/custom-nginx
      creationTimestamp: null
      labels:
        app: alpha-xyz
    spec:
      containers:
      - image: nginx:alpine
        name: nginx
        volumeMounts:
          - name: data-volume
            mountPath: '/usr/share/nginx/html'
      volumes:
      - name: data-volume
        persistentVolumeClaim:
          claimName: alpha-pvc
```

### networkpolicy.yaml
```
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: restrict-inbound
  namespace: alpha
spec:
  podSelector:
    matchLabels:
      app: alpha-xyz
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: middleware
      ports:
        - protocol: TCP
          port: 80
```
