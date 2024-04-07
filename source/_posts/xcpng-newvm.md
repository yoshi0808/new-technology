---
title: XCP-ngのVM新規作成
date: 2024-04-07T09:17:27+09:00
tags:
 - XCP-ng
categories:
---


{% asset_img Title.png 1024 alt %}

<p class="onepoint">この記事で実現すること</p>
ESXi代替としての仮想環境ソフトウェアのXCP-ng、またそのオペレーションをGUIで支援するXen Orchestraを利用して新規のVMを作成します。

<!-- more -->

## VMにおけるネットワークの考え方

前回の記事「{% post_link xcpng %}」では、PIFs（物理ネットワーク）とPrivate Networkを学びました。基本的にVLANを使わないのであれば、新規VMを構築する場合に物理ネットワークのPortに仮想MACアドレスが自動的に割り当てられます。ユーザーはどのPort（どのネットワーク）を使うか指定するだけです。複数のPortを持つNICがある場合は、VMの作成時にどのPortを使うのか（または複数選択）指定します。

## セットアップの前提条件

今回ここで新規VMを作成するのはXCP-ng8.3Betaであり、サーバーはRyzen9 7900となります。この操作に関しては8.2.1と違い殆どありません。今回インストールするRocky Linux 9のテンプレートも変わらず使えます。

## ISOsフォルダにisoファイルをアップロード

前回の記事では"ISOs"というISO専用フォルダをXCP-ng用に作成しました。このフォルダにインストールするISOを入れてみます。
左ペインの{% label primary@Import %}→{% label primary@Disk %}と進みます。

{% asset_img xo1.png 1024 alt %}

{% label primary@Select SR %}とあるので、対象のXCP-ngのノードに属する"ISOs"フォルダを選択します。そしてそこにISOファイルをDrag&Dropします。ここではRocky Linux（Rocky-9-Workstation...iso）をアップロードしてみます。Rocky LinuxはEnterprise向けであり長期サポートを謳っているプロダクトです。

## VMの新規構築

左ペインの{% label primary@New %}→{% label primary@VM %}と進みます。VMの新規作成画面になります。

1. 先頭のプルダウンでVMを導入するXCP-ngサーバーを選択します。2台以上のXCP-ngでPoolの設定が行われている場合はPool単位に指定します。
2. Info：VMのOSテンプレートを選択します。ここでは"Rocky Linux 9"を選択します。
3. Performance: vCPUとメモリの量を決めます。
4. Install Settings: アップロードしたISOファイルを選択します。

{% asset_img xo2.png 800 alt %}

5. Interfaces: 利用するネットワークに応じて"Pool-wide Network associate with ethx" を選択します。”Host Internel...”は選択しません。もし、2つ以上の論理NICを加える場合は、{% label primary@+ Add interface %}ボタンをクリックします。
6. Disks: 論理Diskの容量を設定します。
7. {% label primary@Show advanced settings %}ボタンをクリックします。

{% asset_img xo3.png 800 alt %}

8. 上記のように”Auto power on”（XCP-ngがBoot時にVM起動）、OSがUEFI対応の場合は、"UEFI"のトグルをONにします。なお、Max vCPUsにデフォルトで1という値が入っているので削除しています。

さて、準備ができたので、画面右下の"Create"ボタンをクリックしてVMの作成、起動を行います。

## VMの起動（Rocky Linuxのインストール）

自動起動後、XOの当該VMの{% label primary@Console %}のタブでは実際のRocky Linuxのインストール画面が見られます。

{% asset_img rocky1.png 800 alt %}

GNOMEなので、UbuntuもRocky Linuxも大きくは変わりませんが、Installしていきます。

{% asset_img rocky2.png 800 alt %}

Ubuntuライクに管理者は作成せず、新規ユーザーを管理者として設定します。
インストール終了後は自身で再起動を選択します。その後、Rocky Linuxが起動してきます。

## VMToolsのインストール

さて、Rocky Linuxが起動してきた後に、インストールで利用したマウントを解除し、代わりにVMToolsのSRをマウントします。

{% asset_img rocky2.png 800 alt %}

プルダウンから"guest-tools.iso"を選択します。その後Rocky Linuxを再起動します。

端末を起動し、Shellから、以下のコマンドを順に投入します。マウント、Toolsのインストール、アンマウントです。
``` bash
sudo mount /dev/cdrom /mnt
sudo /mnt/Linux/install.sh
sudo umount /dev/cdrom
```
これが終われば、特にリブートは不要でVMToolsのインストールが完了します。XCP-ngからリブート、シャットダウンが行え、また{% label primary@Network %}のタブではL3の情報（IPアドレス）が表示出来るようになります。

{% asset_img xo4.png 1024 alt %}

MACアドレスはVMを作成する時に自動で作成されています。ここでは"3e:2a:a8:24:12:c8"となっています。基本的にこのMACアドレスは不変ですが、バックアップから戻すときなどはまたMACアドレスが生成される事になるので、XCP-ngの管理上はクローンなのかVMの移動なのかを明確にオペレーションすることが求められます。こういう仕組みはESXiでもそうですし常識的な範囲の話ですね。

これでVMの導入については完了です。

## VMの設定変更

VMの構築後、{% label primary@Advanced %}のタブを見てみます。

{% asset_img xo5.png 1024 alt %}

Ubuntu22、Debian12のデスクトップ環境がある場合は、Video RAMの8MiBを16MiBに変更しておいた方が良いです。デフォルト値では画面操作がとても遅い状況になります。

{% label primary@NIC type %}がRealtek...となっていますが、これは気にしなくて良いそうです。基本的にはOS起動時に必要なドライバが組み込まれるので問題ありません。

{% label primary@CPU limits %}と{% label primary@Memory limits %}は、減らす方向であればOSを稼働させたままで変更可能です。起動時の最大値に戻すこともできます。なお、起動時の初期値は動作中には行えず、一度VMを停止する必要があります。

## モジュールのインストール

Debian系と異なり、Rocky Linuxでモジュールをインストールする際は`sudo dnf -y install module-name`を使います。
SSHとiperf3はまず基本セットでしょうか。SSHはConfigの設定でPort22を空けるなど多少追加設定が必要です。また、iperf3で待ち受けする場合は、Firewallの設定も必要になってきます。セキュアなOSだけに少し手間が掛かりますね。

``` bash
$ sudo dnf -y install openssh-server
$ sudo dnf -y install iperf3
```

## Ryzen9でのパフォーマンス

前回記事で記載したように、XCP-ngをRyzenで構築した場合、Ubuntuではiperf3のネットワークパフォーマンス（送信）が2Gbps程度と厳しい状況でした。しかし、Rocky Linux9に関しては、iperf3の上り/下り共に9.0Gbps/9.3Gbpsであり、Retryは、145/0と素晴らしい内容でした。今回は、XCP-ng8.3BetaをRyzen9 7900で、XCP-ng8.2.1に関してはintel CPUでそれぞれセットアップの確認をしており、どちらとも問題はありません。

個人的にはあと3年半稼働できるESXi8を中心に使いつつ、少しづつProxmoxとXCP-ngも検証を続けていければと考えています。
ProxmoxにおけるRocky Linuxのiperf3は上り下り共に9.3Gbps前後出ていますが、送信時のRetryが13,000程度と異常値が出ています。ESXiでは当たり前のように使えていたものがいざ他のものに移ろうとすると、なかなか大変である事を実感しています。
