---
title: Git配置多账号登录
date: 2016-05-09 13:06:16
tags:
- git
categories:
	Coding-Notes
---
![](https://image.kbiao.me/16-5-9/93479104.jpg)
## 问题提出
在公司里做项目，一般都是公司直接分配git账号。而我自己在GitHub上也托管了自己的博客。两边使用的账号是不同的对应的ssh key也不一样。每次都手工更改是很麻烦的，也不是程序员应有的解决方案。这里我记录下我是如何解决git多账号登录的。
<!-- more -->
## 取消git全局设置
学艺不精的我们都是跟着网上的教程进行的git设置，默认都是全局设置，比如：
```bash
git config --global user.name "your_name"

git config --global user.email  "your_email"
```
一般情况下，参与的项目都是同一个邮箱用户名是没啥问题的。但是碰到我这种情况，又不想换掉其中一个项目的用户名（我也没有这个决定权）。我就需要针对不同的项目设置不同的用户名邮箱。
```bash
cd ~/you project   #进入项目文件夹
git init           #初始化项目（如果已经是git目录了则不需要）
git config user.name "your_name"   #重新设置用户名和邮箱
git config user.email "your_email"
```
说白了，也就是进入到你的git项目相对根目录下，然后执行git config设置记录。
这时候我们打开项目中的`.git`文件夹，查看`config`文件会发现多了两行
```
[branch "master"]
	remote = origin
	merge = refs/heads/master
[user]
	name = you name
	email = youemail@host.com
```
在下一次提交的时候就优先是用项目文件中的git配置信息了。如果有必要可以执行取消全局设置的命令
```bash
git config --global --unset user.name
git config --global --unset user.email
```

## SSH配置

邮箱不同也会对应不同的SSH key，所以要针对不同的项目使用不同的key。
所以打开git全局配置文件。一般在用户目录下的`.ssh`文件夹中。比如windows用户就是：`C:\Users\用户名\.ssh`
Linux就是`～/.ssh`
找到config文件。没有就新建一个，用文本编辑器打开，添加如下配置：
```
#第一个git项目账号
Host first     #给这个项目服务器起个名字，待会用到
HostName test.com #这里需要用真实的项目检出hostname，为了项目安全，我这里随意写的
User A           #用户名
IdentityFile ~/.ssh/id_rsa_first #该项目ssh key 所在路径

#第二个git项目账号  和上面的项目配置一样
Host second
HostName test2.com
Port 1334
User B
IdentityFile ~/.ssh/id_rsa_second
```

如果还没有生成ssh key 可以用一下命令生成,不同项目起不同名字或者放到不同路径，在上面的config配置中应用不同路径即可
```
ssh-keygen -C "your_email" -t rsa
```
## 使配置生效
上面配置了ssh key时候指定了host名称，所以再次打开项目文件夹下的`.git`目录下的config文件，修改url配置，把原来的host name url 改成你上面配置的host 值比如 'first' 、'seceond'等，类似如下
```
[remote "origin"]
	url = git@first:A/proxy.git
	fetch = +refs/heads/*:refs/remotes/origin/*
```
也可以使用命令行完成配置。这里需要注意，使用.ssh目录下的host代替真实的hostname，这样才能让git识别出来
```
git remote add first git@first:A/project.git
```
如果使用的是repo，也是同样操作
```
repo init -u ssh://A@first -b branch
```
push的时候，push到对应的Host即可
```
git push fist master  #first项目中： 
```