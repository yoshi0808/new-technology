---
title: ESXi8 初期設定
date: 2025-04-27T13:01:00+09:00
tags:
  - ESXi
categories:
  - Software
---


{% asset_img title.png alt %}
<p class="onepoint">この記事で実現すること</p>

無償版ESXi8（VMware vSphere Hypervisor）が再び戻ってきたわけですが、改めてネットワークカード、セキュリティ設定などの追加設定を纏めてみました。Broadcomサイトのドキュメントを引用する形で整理しています。

<!-- more -->

## セキュアブートにするか否か

ESXiのセットアップは誰でも簡単に行えるものですが、最初に迷うところはセキュアブートでインストールするか否かです。最近はUEFIのみのBIOSのハードウェアもあるようです。セキュリティ面からすればセキュアブートにしておく方が好ましいのですが、ネットワークカード（NIC）の種類によってはレガシーブートにしておいた方が良い場合があります。

というのも、個人向けの環境で使う場合は、個々の機器間の速度差を吸収するために、スイッチやWi-Fiなどを含め、フロー制御を有効にすることをお勧めします。特にESXiなど、10GbEなどの高速ネットワークカードを搭載するケースではクライアントが遅い場合にうまく待ってくれるようにフロー制御が必須となります。これはネットワークスイッチ、端末側とそれぞれ全てにフロー制御をONにする必要があります。

セキュアブートから始まり、フロー制御と全く関係のない話をしていますが、実はESXiでは個々のNICによっては、デフォルトでフロー制御がOffになっています。私の経験上、intel X710はフロー制御Off、Nvidia(Mellanox) Connect X-4はフロー制御Onが初期値です。いつでもコマンドから仮想マシンのシャットダウン無しに変更できますが、X710を毎回起動後にコマンドを叩くのは面倒です。

こういう話から起動時のパラメータの設定の話になってくるのですが、セキュアブートだと起動時に手動で設定した構成が読み込まれません。

## SSHを有効にする

最初にSSHを有効にしましょう。
これは、管理メニューの左ペイン{% label primary @ホスト %}ー{% label primary @管理 %}から{% label primary @TSM %}および{% label primary @TSM-SSH %}の起動・停止を行います。SSHは起動したままの状況は推奨されておらず、このドキュメントでも必要な時のみ起動するように記載されています。心配な方はSSHは起動したままにしないのが無難です。利便性のためにSSHは普段から起動したまま運用するならば接続IPを絞るなど何らかの工夫は加えたいところです（後述します）。
また、マシン起動時に自動的にSSHを有効にするために、{% label primary @TSM-SSH %}から右クリックして、自動起動を有効にしておきましょう。
{% asset_img ssh.png 1024 alt %}


## フローコントロールについて

ESXiにおけるフローコントロールはNICによって設定項目が異なります。ESXiにSSHしてから以下のコマンドでNICのパラメーターが確認できます。1GbE程度のネットワークであればあまり意識する必要もありませんが、10GbEネットワークともなれば、Wi-Fi子機などとは速度差によってパケットを取りこぼすことにもなるので（もちろん、TCPの再送でカバーされます）効率が良くありません。

``` bash
[root@localhost:/etc/rc.local.d] esxcli network nic pauseParams list
NIC     Pause Params Supported  Pause RX  Pause TX  Auto Negotiation  Auto Negotiation Resolution Avail  RX Auto Negotiation Resolution  TX Auto Negotiation Resolution
------  ----------------------  --------  --------  ----------------  ---------------------------------  ------------------------------  ------------------------------
vmnic0                    true     false     false             false                              false                           false                           false
vmnic1                    true     false     false             false                              false                           false                           false
vmnic2                    true     false     false             false                              false                           false                           false
vmnic3                    true     false     false             false                              false                           false                           false
```

このように物理NICがリストされ、Pause Params　Supportedでフロー制御がサポートされているか否かがわかります。この例ではintel　X710の4Portモデルが搭載されていますが、Auto Negotiationはオフ(false)、また受信、送信のフロー制御（Pause RX/Pause TX）がオフ（false）です。この状態だとクライアントが一杯一杯でもESXi側は容赦なくデータ送信してしまい、TCPの再送が多発します（10GbEでの自宅内では本来の実力の3割程度ダウンといったところです）。

例えば、Broadcomでのフローコントロールの設定については、以下のとおり記載があります。

> Configuring flow control using driver module options
 - Set pause parameters for a NIC

  esxcli network nic pauseParams set

 Cmd options:
 -a|--auto=<bool> Enable/disable auto negotiation.
 -n|--nic-name=<str> Name of NIC whose pause parameters should be set. (required)
 -r|--rx=<bool> Enable/disable pause RX flow control.
 -t|--tx=<bool> Enable/disable pause TX flow control.

 <https://knowledge.broadcom.com/external/article/324551/configuring-flow-control-on-vmware-esxi.html>

なお、intel X710にはオートネゴシエーションの機能は無いようです（無くても問題ありません）。
``` bash
# esxcli network nic pauseParams set -n vmnic0 -a true
Unable to complete Sysinfo operation.  Please see the VMkernel log file for more details.: Not supported: VSI node (234:VSI_NODE_net_pNics_firmware_pauseParams)
```

ということで、vmnic0にフロー制御（送信・受信）を有効にするためには以下のコマンドを投入します。

``` bash
esxcli network nic pauseParams set -n vmnic0 -t t -r t
```

## 非セキュアブートでの起動時の設定

これらを毎回ホスト起動時に自動設定するには、`/etc/rc.local.d/`にある、`local.sh `を修正します。
ESXiにSSHしてからviなどで`local.sh`を開き、NICパラメータコマンドを物理インタフェース毎に追加します。
私の場合は、4Portなので4つの設定を加えます。

``` bash
#!/bin/sh ++group=host/vim/vmvisor/boot

# local configuration options

# Note: modify at your own risk!  If you do/use anything in this
# script that is not part of a stable API (relying on files to be in
# specific places, specific tools, specific output, etc) there is a
# possibility you will end up with a broken system after patching or
# upgrading.  Changes are not supported unless under direction of
# VMware support.

# Note: This script will not be run when UEFI secure boot is enabled.
esxcli network nic pauseParams set -n vmnic0 -t t -r t
esxcli network nic pauseParams set -n vmnic1 -t t -r t
esxcli network nic pauseParams set -n vmnic2 -t t -r t
esxcli network nic pauseParams set -n vmnic3 -t t -r t

exit 0
```

これでESXiのブート時も自動的にフロー制御が有効になります。

Broadcomのドキュメントは以下で記載されています。
> Modifying the rc.local or local.sh file in VMware vSphere ESXi to execute commands while booting
 <https://knowledge.broadcom.com/external/article?articleNumber=324525>

というわけでセキュアブートをオフにしてセットアップした方が良いケースを紹介しました。

## 公開鍵認証

セキュリティと利便性とを同時に実現できることとしてログインパスワードではなく公開鍵認証方式があります。これはESXi6.7の頃から全く変わらない方法で簡単に対応できます。一応Broadcomのマニュアルに沿って対応します。

基本的な事ですが、公開鍵認証はクライアントで鍵を作り、それをサーバー管理者に安全な方法で渡してサーバーに自分の公開鍵を登録してもらい、自端末には秘密鍵を保持しておき、公開鍵認証を行います。パスワードレスにもできますし、ネットワーク内をパスワードが流れないので安全です。

ここでは公開鍵ペアの作成については割愛します。クライアントで鍵を作成していれば、Windows11やmacOSではユーザールートの下の`.ssh`フォルダにパブリックキー`id_rsa.pub`が存在しているはずです。それをESXiのauthorized_keyファイルに追記します。

以下はmacOSの例ですが、Windowsであっても、scpなどを使えるのでそれでESXiの`/tmp`にコピーする方法でも実現できます。`scp id_rsa.pub root@esxi.host.IP.Address:/tmp`

``` bash
[yoshi@mbp23:~]
$ cat .ssh/id_rsa.pub | ssh root@192.168.2.5 'cat >> /etc/ssh/keys-root/authorized_keys'
```

なお、Broadcomのマニュアルでは、以下の通り、`/etc/ssh/sshd_config`ファイルを修正せよとあります。セキュリティのためには設定しておくべきですが、設定をミスするとパスワードで入れなくなり詰みますので、SSHのセッションを2つ作成しておき、もう一方で確認することをお勧めします（公開鍵認証が失敗したらもう一方のセッションで一旦sshd_configを戻してください）。

> To allow root access, change PermitRootLogin no to PermitRootLogin yes in the /etc/ssh/sshd_config file.
To disable password login, ensure that the ChallengeResponseAuthentication and PasswordAuthentication are set to no.
 <https://knowledge.broadcom.com/external/article/313767/allowing-ssh-access-to-vmware-vsphere-es.html>

最後に、SSHサーバーをリスタートします。`/etc/init.d/SSH restart`（既存セッションは切断されません）

