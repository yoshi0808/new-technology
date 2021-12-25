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

Sophos Firewall（旧名称はXG Firewall）を仮想環境で稼働させるために、VMware ESXiをインストールします。バージョンは6.7、または7.0を対象としています。

<!-- more -->

## ESXiについて

 無償版の仮想環境ESXiは{% label primary @vSphere Hypervisor %}という名前が付けられています。Sophos Firewallの導入に必須ではありませんが、XG自体をバックアップすることやバージョンアップの際にその状態を一時保存するスナップショットなどとても便利なので、仮想環境を構築しその上に仮想ホストとしてXGをインストールします。vSphereという製品群、その中の1つの無償版バージョンとして、"vSphere Hypervisor"があります。ESXiは製品名というよりは直接ハードウェアを制御するVMWareの仮想化ソフトウェア、これに対する一般用語としては"ハイパーバイザー"です。そして、ESXi（ハイパーバイザー）上で稼働する実際のOSをVirtual Machine（VM:仮想マシン）と呼びます。

（2021-12-25追記）
ESXiの最新Versionは7.0となっています。この記事を書いた当時はESXi6.7が最新でしたが、現在でも十分な稼働実績があり、ネットにも多くの情報があり安定しているプロダクトです。もちろん、最新版のESXi7.0でも問題なく稼働します。ESXi7.0はAIやKubernetes等のコンテナ向けの意欲的な機能が盛り込まれていますが、個人向けとしては敷居が高く、今のところあまり違いはありません。新しいバージョンでは新しいハードウェアに適合する一方、古いCPUなどは切り捨てられる傾向があります。

このホームユーザー向け（無償版）ESXi（vSphere Hypervisor）に関するドキュメントは、**VMWareのサイト**を参照してください。
> VMware vSphere Hypervisor
 <https://www.vmware.com/jp/products/vsphere-hypervisor.html>

## インストールメディアの準備

1. ESXiをインストールする予定の2つのNICを持ったPC1台と、ISOファイルをインストールするための最低8GB、推奨32GB以上のUSBメディアを用意してください。
2. ESXiのダウンロードにはVMwareのアカウント（無償）が必要です。VMWareのサイトでアカウント作成、製品（vSphere Hypervisor）をダウンロードします。
> vSphere Hypervisor 6.7
 <https://my.vmware.com/jp/web/vmware/evalcenter?p=free-esxi6>
{% linkgrid %}

vSphere Hypervisor 6.7 | https://my.vmware.com/jp/web/vmware/evalcenter?p=free-esxi6 | (https://my.vmware.com/jp/web/vmware/evalcenter?p=free-esxi6)このダウンロード センターには、技術資料、インストール デモ、および vSphere Hypervisor のトレーニングが用意されています。 | vSphere-Client.png

{% endlinkgrid %}
> vSphere Hypervisor 7.0
  <https://my.vmware.com/jp/web/vmware/evalcenter?p=free-esxi7>
{% linkgrid %}

vSphere Hypervisor 7.0 | https://my.vmware.com/jp/web/vmware/evalcenter?p=free-esxi7 | (https://my.vmware.com/jp/web/vmware/evalcenter?p=free-esxi7)このダウンロード センターには、技術資料、インストール デモ、および vSphere Hypervisor のトレーニングが用意されています。 | vSphere-Client.png

{% endlinkgrid %}

3. 以下のYouTube動画を参考にメディアを作成します。USBメディア作成に用いるRufusは64bit版のWindows OSが必要です。
 > <https://www.youtube.com/watch?v=7gYnyIaQH9A>
 {% asset_img rufus.png 800 alt %}

 > Rufus
 <https://rufus.ie/ja/>

 2021/12/25時点のRufusの最新バージョンは3.17です。

 {% asset_img rufus1.png 480 alt %}
 ESXiのインストール対象マシンがUEFIのセキュアブートに対応しているのであればこのようにGPTとUEFIを選択してください。

## ESXiのインストール

### ネットワーク構成

普段利用しているネットワークとは別のネットワークのIPアドレスを振ってセットアップします。いつもが`192.168.0.0/24`なら、今回は仮に`192.168.1.0/24`のネットワークに配置する予定としてESXiをセットアップする事にしましょう。これまでのネットワークにXG Firewallを挟み込む事になり、従来のネットワークはXGのWAN側とホームゲートウェイに利用され、XGのLAN側は新しいネットワークになるためです。新たにXGのLAN側と同じネットワークにESXiの管理ネットワークを構築する必要があります。なお、XGのLAN側のデフォルトIPアドレスは、`172.16.16.16`となっています。ここではXGのIPもセットアップ時に`192.168.1.0/24`のネットワークに変更する事とします。XGのセットアップが完了し、`192.168.1.0/24`のネットワークからXGを介してインターネットに接続できたら、今の`192.168.0.0/24`にある機器をXGのLANを経由するように移設していきます。

{% asset_img setup_esxi.drawio.png alt %}

上記の図のように、1台のハードウェアにESXiをインストールし、ESXiのインストール終了後はブラウザでESXiを制御するための別のPCが必要となります。

### USBメディアからインストール

インストールについては、以下のYouTube動画を参考にRufusでセットアップしたUSBメディアからブートしてください。インストール対象のハードウェアがUEFIブート可能である場合は、BIOSの設定でセキュアブートを有効にし、UEFI(GPT)としてESXiをセットアップされる事をお勧めします。セキュアブートによってマルウェア等からの改ざん防止としての効果が期待できます。一方、勝手にユーザー作成モジュールをインストールできないという制約も加わります。
> <https://www.youtube.com/watch?v=eiZn54GPfzI>
{% asset_img install.png 1024 alt %}

- vCenterはホームユーザー向けには使いませんので無視してください。
- NICが2枚ある事を前提にすると、ESXiの管理画面はLAN側のNICを対象とするように設定してください。今の時点では、WANは使いません。新しく振ったIP（`192.168.1.1/24`）をESXiの管理用IPとして、セットアップします。
- 上記のビデオ（2:35前後の説明）では「冗長性のためにnicを2枚以上選択することが推奨されます」と説明がありますが、今回は冗長化を使いません。先頭のvmnic0をLAN側のNIC（管理用）としてセットアップしてください。また、ここではVLANも使いません。
- ESXiでは、vSphere Clientは使いません。インストールしたESXiのLAN側のIPアドレスに対してブラウザで接続し、ESXiのWeb管理画面を利用します。

セットアップ終了後、USBメディアを抜いて再起動後、ESXiの画面にIPアドレスが表示されます。ESXiのLAN側のNICと操作用のPCとを繋ぎます。PCのIPを設定（例えば、`192.168.1.101/24`）し、ESXiのIPアドレスにブラウザで接続してください。ログインは、ユーザー名がroot、パスワードはセットアップで指定したものになります。
