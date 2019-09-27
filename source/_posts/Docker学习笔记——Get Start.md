---
title:  Docker学习笔记———Get Start
date: 2017-03-12 09:30:01
tags:
  Docker
categories:
  Coding-Notes
permalink: Docker-Learning-Notes-Get-Start

---
![](https://image.kbiao.me/2017-03-12-14892908756333.jpg)

> 做程序员最可怕的事情是不是自己学习的速度还不如这些工具产品版本号更新的快？

搁置了一个假期的docker学习计划，重新启动docker时候发现版本号已经跳到`17.03`。恍惚记得上一次用它还是`1.12`来着，版本号跳的恍如隔世。倒也给我提了醒，**学习不能拖拉，不然总是被牵着鼻子跑**。

<!-- more -->

## Docker 发布重大更新，宣布企业版到来

*3 月 2 日，Docker 官方发布了一篇博客 ，宣布企业版到来。版本也从 1.13.x 一跃到 17.03。之后，Docker 会每月发布一个 edge 版本(17.03, 17.04, 17.05...)，每三个月发布一个 stable 版本(17.03, 17.06, 17.09...)，企业版(EE) 和 stable 版本号保持一致，但每个版本提供一年维护。*

也就是说只是换了一种版本号的，叫法成了 yy.mm格式，最新版也就是17年3月的版本。还好能跟得上节奏，上一个版本也就是1.13而已。

![](https://image.kbiao.me/2017-03-12-14892819650098.jpg)


Docker 的 Linux 发行版的软件仓库也从以前的https://apt.dockerproject.org / https://yum.dockerproject.org 变更为目前的 https://download.docker.com/。软件包名变更为 docker-ce(社区版) 和 docker-ee(企业版)。
旧的仓库和包名(docker-engine)依旧可以使用，但不确定什么时候会被废弃，docker-engine 的版本号也变成了 17.03.0~ce-0 这种的版本号。

这个新的企业版本中主要是针对企业用户的需求，增加了一些安全认证，审计，镜像仓库，数据中心（多租户）管理等方面的功能，方便企业部署应用，而且提供更长的支持周期，收费情况的话感觉还好（反正我也买不起，只是感觉和Oracle的产品定价比起来确实好多了）。
![](https://image.kbiao.me/2017-03-12-14892831046889.jpg)
还好这个版本区分并不会影响我学习Docker。

## 安装Docker-CE并运行hello-world
作为学习我们当然是安装社区版就足够啦。

### Mac / Windows 下使用Docker
在新版本的Mac或者Windows中都可以直接安装运行Docker应用程序。Windows 要求 win 10 pro 并且开启 Hyper-V虚拟化，Mac要求OS X 10 以上，但是会与Virtual Box有冲突。

* Windows下载  https://download.docker.com/win/stable/InstallDocker.msi
* Mac OS 下载  https://download.docker.com/mac/stable/Docker.dmg

不符合以上条件的可以去官网下载Docker-Tool-Box，来模拟Docker 的运行环境，也是可以学习的。Docker 是一个基于Linux内核的工具，新版中也针对其他操作系统的虚拟化技术做了兼容，配置一个学习环境还是比较容易的。
下载安装启动小鲸鱼以后，就可以在系统终端中执行Docker 命令了。

### Cent OS 中安装Docker
系统官方推荐是要`7.3`，系统必须64位的.
由于新版本的Docker更换了发行版的仓库，以及包名，安装也和以前不太一样，最好是卸载旧版本。
#### 卸载旧版本

旧版本的Docker的软件包名为`docker`或`docker-engine`。如果以前安装过就要卸载：

```
$ sudo yum remove docker \
                  docker-common \
                  container-selinux \
                  docker-selinux \
                  docker-engine
```
另外原来`/var/lib/docker/`目录下的镜像，容器，数据卷，网络等都会保留，新安装的docker任然可以使用这些内容。

#### 使用 repository 安装

第一次安装新版本需要配置一下新版 docker 的 repository 

##### **设置存储库**

*repository 设置对于Docker CE和 Docker EE来说有些不一样。*

* 安装yum-utils，它提供yum-config-manager可以用来配置repo：

```
$ sudo yum install -y yum-utils
```

* 使用以下命令设置稳定版 repository ：

```
$ sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo
```

* 如果需要的话可以开启edge版本的更新，这个 repository 包含在上面的repo文件中，但默认情况下禁用。可以用下面的命令开启：

```
$ sudo yum-config-manager --enable docker-ce-edge
```
要禁用edge更新：

```
$ sudo yum-config-manager --disable docker-ce-edge
```

##### **正式安装DOCKER**

* 更新yum包索引。

```
$ sudo yum makecache fast
```


* 安装最新版本docker

 Docker CE	`sudo yum install docker-ce`
 Docker EE	`sudo yum install docker-ee`
 如果这是在添加Docker存储库之后第一次刷新包索引，会提示接受GPG密钥，并且将显示密钥的指纹。验证指纹是否正确，如果是，请接受密钥。
 
 ```
 从 https://download.docker.com/linux/centos/gpg 检索密钥
导入 GPG key 0x621E9F35:
 用户ID     : "Docker Release (CE rpm) <docker@docker.com>"
 指纹       : 060a 61c5 1b55 8a7f 742b 77aa c52f eb6b 621e 9f35
 来自       : https://download.docker.com/linux/centos/gpg
是否继续？[y/N]：y
```

* 安装特定版本的docker
生产系统中不可能总是用最新版本，需要安装特定版本的话也是比较简单的。`yum list`命令列出可用版本：

```
$ yum list docker-ce  --showduplicates |sort -r
```
 列出并按版本号排序。
  然后选择需要的版本安装：
  Docker CE： `sudo yum install docker-ce-<VERSION>`
  Docker EE： `sudo yum install docker-ee-<VERSION>`

* 启动Docker

```
$ sudo systemctl start docker
```
docker通过运行hello-world 验证是否已正确安装。

```
$ sudo docker run hello-world
```
被墙掉的小伙伴可能会报错，要不先试试 docker version 命令的输出：

```
Client:
 Version:      17.03.0-ce
 API version:  1.26
 Go version:   go1.7.5
 Git commit:   3a232c8
 Built:        Tue Feb 28 08:10:07 2017
 OS/Arch:      linux/amd64

Server:
 Version:      17.03.0-ce
 API version:  1.26 (minimum version 1.12)
 Go version:   go1.7.5
 Git commit:   3a232c8
 Built:        Tue Feb 28 08:10:07 2017
 OS/Arch:      linux/amd64
 Experimental: false
```
也基本证明了安装正确。
或者注册一个daoCloud的账号，配置一下[docker加速器](https://www.daocloud.io/mirror)国内访问也就没什么问题了。

* 升级docker 

  这种方式安装之后如果需要升级，只需要再次更新下yum包索引。`$ sudo yum makecache fast` 然后继续选择需要安装的版本即可。
* 卸载docker
Docker CE	 :  `sudo yum remove docker-ce`
Docker EE	 :  `sudo yum remove docker-ee`
不会自动删除主机上的镜像，容器，数据卷或自定义配置文件。要删除所有镜像，容器和卷：

```
$ sudo rm -rf /var/lib/docker
```
#### 下载软件包安装

* Docker CE：
访问 https://download.docker.com/linux/centos/7/x86_64/stable/Packages/ 并下载.rpm要安装的Docker版本的文件。
* 安装Docker，将下面的路径更改为您下载Docker包的路径。
```
$ sudo yum install /path/to/package.rpm
```





