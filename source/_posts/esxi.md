---
title: VMware vSphere Hypervisor（ESXi）のインストール
tags:
  - XG Firewall
  - ESXi
categories:
  - Security
date: 2020-02-29 13:23:22
---

<p class="onepoint">この記事で実現すること</p>

XG Firewall v18を仮想環境で稼働させるために、VMware ESXi 6.7をインストールします。

<!-- more -->

## ESXiについて

 無償版の仮想環境ESXiは{% label primary @vSphere Hypervisor %}という名前が付けられています。XG Firewallの導入に必須ではありませんが、XG自体をバックアップすることやバージョンアップの際にその状態を一時保存するスナップショットなどとても便利なので、仮想環境を構築しその上に仮想ホストとしてXGをインストールします。vSphereという製品群、その中の1つの無償版バージョンとして、"vSphere Hypervisor"があります。ESXiは製品名というよりは直接ハードウェアを制御するVMWareの仮想化ソフトウェア、これに対する一般用語としては"ハイパーバイザー"です。そして、ESXi（ハイパーバイザー）上で稼働する実際のOSをVirtual Machine（VM:仮想マシン）と呼びます。

（2020-10-24追記）
ESXiの最新Versionは7.0となっています。このブログのXGに関する一連の説明はESXi6.7を前提に説明しています。ESXi6.7は今年に入ってからも5回のパッチが提供されています。十分な稼働実績があり、ネットにも多くの情報があり安定しているプロダクトです。

このホームユーザー向け（無償版）ESXi（vSphere Hypervisor）に関するドキュメントは、**VMWareのサイト**を参照してください。
> VMware vSphere Hypervisor
<https://www.vmware.com/jp/products/vsphere-hypervisor.html>

## インストールメディアの準備

1. ESXiをインストールする予定の2つのNICを持ったPC1台と、ISOファイルをインストールするためのUSBメディアを用意してください。
2. ESXiのダウンロードにはVMwareのアカウント（無償）が必要です。VMWareのサイトでアカウント作成、製品（vSphere Hypervisor v6.7）をダウンロードします。
> vSphere Hypervisor 6.7
 <https://my.vmware.com/jp/web/vmware/evalcenter?p=free-esxi6>
{% linkgrid %}
vSphere Hypervisor 6.7 | https://my.vmware.com/jp/web/vmware/evalcenter?p=free-esxi6 | (https://my.vmware.com/jp/web/vmware/evalcenter?p=free-esxi6)このダウンロード センターには、技術資料、インストール デモ、および vSphere Hypervisor のトレーニングが用意されています。 | vSphere-Client.png
{% endlinkgrid %}

3. 以下のYouTube動画を参考にメディアを作成します。
> <https://www.youtube.com/watch?v=7gYnyIaQH9A>
 {% asset_img rufus.png 1024 alt %}

## ESXiのインストール

### ネットワーク構成

普段利用しているネットワークとは別のネットワークのIPアドレスを振ってセットアップします。いつもが`192.168.0.0/24`なら、今回は仮に`192.168.1.0/24`のネットワークに配置する予定としてESXiをセットアップする事にしましょう。これまでのネットワークにXG Firewallを挟み込む事になり、従来のネットワークはXGのWAN側とホームゲートウェイに利用され、XGのLAN側は新しいネットワークになるためです。新たにXGのLAN側と同じネットワークにESXiの管理ネットワークを構築する必要があります。なお、XGのLAN側のデフォルトIPアドレスは、`172.16.16.16`となっています。ここではXGのIPもセットアップ時に`192.168.1.0/24`のネットワークに変更する事とします。XGのセットアップが完了し、`192.168.1.0/24`のネットワークからXGを介してインターネットに接続できたら、今の`192.168.0.0/24`にある機器をXGのLANを経由するように移設していきます。

{% asset_img setup_esxi.drawio.png alt %}

上記の図のように、1台のハードウェアにESXiをインストールし、ESXiのインストール終了後はブラウザでESXiを制御するための別のPCが必要となります。

### USBメディアからインストール

インストールについては、以下のYouTube動画を参考にUSBメディアからブートしてください。インストール対象のハードウェアがUEFIブート可能である場合は、UEFIブートとしてESXiをセットアップされる事をお勧めします。改ざん防止としてESXiにおける制限が加わります。
> <https://www.youtube.com/watch?v=eiZn54GPfzI>
{% asset_img install.png 1024 alt %}

- vCenterはホームユーザー向けには使いませんので無視してください。
- NICが2枚ある事を前提にすると、ESXiの管理画面はLAN側のNICを対象とするように設定してください。今の時点では、WANは使いません。新しく振ったIP（`192.168.1.1/24`）をESXiの管理用IPとして、セットアップします。
- 上記のビデオ（2:35前後の説明）では「冗長性のためにnicを2枚以上選択することが推奨されます」と説明がありますが、今回は冗長化を使いません。先頭のvmnic0をLAN側のNIC（管理用）としてセットアップしてください。また、ここではVLANも使いません。
- ESXi6.7では、vSphere Clientは使いません。インストールしたESXiのLAN側のIPアドレスに対してブラウザで接続し、ESXiのWeb管理画面を利用します。

セットアップ終了後、USBメディアを抜いて再起動後、ESXiの画面にIPアドレスが表示されます。ESXiのLAN側のNICと操作用のPCとを繋ぎます。PCのIPを設定（例えば、`192.168.1.101/24`）し、ESXiのIPアドレスにブラウザで接続してください。ログインは、ユーザー名がroot、パスワードはセットアップで指定したものになります。
