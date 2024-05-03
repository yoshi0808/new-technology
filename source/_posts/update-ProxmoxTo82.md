---
title: Proxmox 8.2へのアップグレード
date: 2024-05-03T07:58:30+09:00
tags: proxmox
categories:
---

{% asset_img Title.png alt %}

<p class="onepoint">この記事で実現すること</p>

2024-04-24にProxmox VE8.2が発表されています。ここではGUIでアップグレード（中身はapt upgrade）で説明するまでもないのですが、既知の不具合があり、ちょうど私のNIC（X710DA4）ではこの不具合の影響を受けることになったため、対応策についてまとめています。

<!-- more -->

## 新機能

新機能については以下の通りです。


- Support for automated and unattended installation
- Import wizard for VMware ESXi VMs
- Modernized Firewall based on nftables
- LXC device passthrough
- Advanced Backup settings
- Support for custom ACME-enabled CAs
- UI improvements
- Debian 12.5 (Bookworm), but using a newer Linux kernel 6.8;
- New versions: QEMU 8.1, Ceph Reef 18.2, LXC 6.0, and Open ZFS 2.2;

積極的にLinux Kernelのアップデートが行われていますね。

> Proxmox VE 8.2 What's new
 <https://www.proxmox.com/en/services/videos/proxmox-virtual-environment/whats-new-in-proxmox-ve-8-2>

## 既知の不具合

不具合については以下のページでまとめられています。

> Known Issues & Breaking Changes
 <https://pve.proxmox.com/wiki/Roadmap#Proxmox_VE_8.2>

IntelのNICでX710シリーズでは以下の影響を受けます。カーネル変更を受けてインタフェース名の末尾に`P0`という文字列が加わるとのこと。

Kernel: Change in Network Interface Names
Upgrading kernels always carries the risk of network interface names changing, which can lead to invalid network configurations after a reboot. In this case, you must either update the network configuration to reflect the name changes, or pin the network interface to its name beforehand.

See the reference documentation on how to pin the interface names based on MAC Addresses.

Currently, the following models are known to be affected at higher rates:

Models using i40e. Their names can get an additional port suffix like p0 added.

その他は、以下の項目が挙げられています。
- Kernel: DKMS(it may happen that installed DKMS modules will not build anymore)
- Kernel: Split Lock Detection Slowing Down VMs
- Old Ceph Crash Reports

## アップグレード

ここでは8.1から8.2へのアップグレードを想定しています。
前述した通り、X710シリーズのNICをお持ちの方は、アップグレード後にネットワークインタフェース名の不一致によってネットワーク経由でProxmoxに到達できなくなります。従い、アップグレード後はモニタを接続し、ローカルのShellでネットワークインタフェース名を変更することになります。
GUIからは以下の通り実行します。その後再起動が必要です。

{% asset_img pve1.png alt %}

Proxmoxのノードを選択の上、「アップデート」の項目から再表示し、アップグレードを実行します。

終了後、再起動させてアップグレード処理を完了させます。

## ネットワークインタフェースの変更

私の持っているインタフェースは8.1の時は以下の通りでした。

{% asset_img pve2.png alt %}

8.2では以下になります（修正完了後）

{% asset_img pve3.png alt %}

４つのインタフェースの末尾にnp0〜np3の文字列が加えられています。

さて、物理ノードにモニターを接続し、Proxmoxを起動します。
1. ip address showで実際のインタフェース名を調べます。`ip a`
 以下のように新しいカーネルでのインタフェース名を確認します。
 ``` bash
 2: enp1s0f0np0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq master vmbr0 state UP group default qlen 1000
    link/ether 3c:fd:fe:xx:xx:xx brd ff:ff:ff:ff:ff:ff
 ```
2. /etc/network/interfacesファイルを修正します。ファイルのバックアップ取得をしてから実施をお勧めします。
 ``` bash
 root@pve1:~# cd /etc/network
 root@pve1:/etc/network# cp interfaces interfaces.bak
 root@pve1:/etc/network# vi interfaces
 ```
 viなどでinterfacesファイルの以下の項目を見つけインタフェース名を`ip a`で出力されたインタフェース名に合わせます。
 ちょうど`bridge-ports`の行です。これをインタフェースの数だけ修正します（私の場合は4Portなので４つ）。  
 ``` bash
 auto vmbr0
 iface vmbr0 inet static
        address 192.168.2.x/24
        gateway 192.168.2.x
        bridge-ports enp1s0f0
        bridge-stp off
        bridge-fd 0
 ```
3. ネットワークをリスタートします。`service networking restart`

これで対応は完了です。

## その他（古いカーネルでの起動）

その他の何らかのトラブルでが発生した場合、古いカーネルで起動したい場合は、Bootメニューに古いカーネルが選択できます（UEFIのGRUB）。
今回の8.1からのアップグレードでは、古いカーネルは、6.5.13-5、新しいカーネルは、6.8.4-2でした。

もししばらく古いカーネルで起動したいということであれば、以下のコマンドで古いカーネルにピン留めできます。
`proxmox-boot-tool kernel pin 6.5.13-5-pve`

新しいカーネルに戻す時は以下のコマンドで元に戻します。
`proxmox-boot-tool kernel pin 6.8.4-2-pve`

