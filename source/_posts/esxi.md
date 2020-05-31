---
title: VMware vSphere Hypervisor（ESXi）のインストール
tags:
  - XG Firewall
  - ESXi
categories:
  - Security
date: 2020-02-29 13:23:22
---
{% note success  %}

## この記事で実現すること

　XG Firewall v18をVMware ESXi上で稼働させるために、VMware ESXi 6.7をインストールします。

{% endnote %}

<!-- more -->

## インストールの前に

 XG Firewallの導入に必須ではないですが、バックアップや異なるバージョンの同居など色々便利なので、仮想環境（ESXi）を構築しその上にXGをインストールします。このホームユーザー向け（無償版）ESXi（vSphere Hypervisor）に関するドキュメントは、[VMWareのサイト](https://www.vmware.com/jp/products/vsphere-hypervisor.html)を参照してください。
<!-- more -->

## 準備

- ESXiをインストールする予定の2つのNICを持ったPC1台と、ISOファイルをインストールするためのUSBメディアを用意してください。
- VMwareのアカウント（無償）を作成してください。
- VMwareサイトにログイン後、製品（vSphere Hypervisor v6.7）のダウンロードをしたら、ISOファイルをRufusを使ってUSBメディアに書き出します。
  
{% youtube 7gYnyIaQH9A %}

## ESXiのインストール

以下のビデオ（英語）を参考にしてください。

<iframe src='https://players.brightcove.net/1534342432001/Byh3doRJx_default/index.html?videoId=5738631329001' allowfullscreen frameborder=0></iframe>

注意点ですが、いつも使っているネットワークとは別のネットワークのIPアドレスを振ってセットアップします。いつもが`192.168.0.0/24`なら、今回は仮に`192.168.1.0/24`のネットワークに配置する予定としてESXiをセットアップする事にしましょう。これまでのネットワークにXG Firewallを挟み込む事になり、従来のネットワークはXGのWAN側とホームゲートウェイに利用され、XGのLAN側は新しいネットワークになるためです。新たにXGのLAN側と同じネットワークにESXiの管理ネットワークを構築する必要があります。なお、XGのLAN側のデフォルトIPアドレスは、`172.16.16.16`となっています。ここではXGのIPもセットアップ時に`192.168.1.0/24`のネットワークに変更する事とします。

- USBメディアをESXiをインストールするPCに挿し、USBからブートし、セットアップを開始してください。
- vCenterはホームユーザー向けには使いませんので無視してください。
- NICが2枚ある事を前提にすると、Esxiの管理画面はLAN側のNICを対象とするように設定してください。今の時点では、WANは使いません。新しく振ったIP（`192.168.1.1/24`）をESXiの管理用IPとして、セットアップします。
- 上記のビデオ（2:40前後の説明）では「冗長化のために」と説明がありますが、今回は冗長化を使いません。通常LAN側のvmnic0を管理用のNICとしてセットアップしてください。また、VLANも使いません。
- ESXi6.7では、vSphere Clientは使いません。インストールしたESXiのLAN側のIPアドレスに対してブラウザで接続し、ESXiのWeb管理画面で設定を行います。

{% asset_img setup_esxi.png alt %}

セットアップ終了後は、上記のようなネットワーク構成となります。USBメディアを抜いて再起動後、ESXiの画面にIPアドレスが表示されます。ホームゲートウェイに繋っていたPCをネットワークから外し、ESXiのLAN側のNICと繋ぎます。PCのIPを変更（例えば、`192.168.1.101/24`）し、ESXiのIPアドレスにブラウザで接続してください。ログインは、ユーザー名がroot、パスワードはセットアップで指定したものになります。
