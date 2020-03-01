---
title: VMware vSphere Hypervisor（ESXi）のインストール
tags:
  - XG Firewall
  - ESXi
categories:
  - Software
date: 2020-02-29 13:23:22
---

{% note primary no-icon %}

## インストールの前に

{% endnote %}

 　XG Firewallの導入に必須というわけではないですが、ハイスペックのマシンにXGだけというのも勿体ない気がして仮想環境（ESXi）を構築し、その上にXGをインストールする事にしました。

　この個人向け（無償版）ESXiのインストールに関するドキュメントは正直解りやすい場所に掲載されてないのですが、[VMWareのブログ](https://blogs.vmware.com/jp-cim/2014/05/vspherehypervisor.html "vmware")から辿ると良いです。
<!-- more -->

{% note primary no-icon %}

## 準備

{% endnote %}

- ESXiをインストールする予定の2つのNICを持ったPC1台と、ISOファイルをインストールするためのUSBメディアを用意してください。
- VMwareのアカウント（無償）を作成してください。
- VMwareサイトにログイン後、製品（vSphere Hypervisor v6.7）のダウンロードをしたら、ISOファイルをRufusを使ってUSBメディアに書き出します。
  
{% youtube 7gYnyIaQH9A %}

{% note primary no-icon %}

## ESXiのインストール

{% endnote %}

　以下のビデオを参考にしてください。

<iframe src='https://players.brightcove.net/1534342432001/Byh3doRJx_default/index.html?videoId=5738631329001' allowfullscreen frameborder=0></iframe>

- USBメディアをESXiをインストールするPCに挿し、USBからブートし、セットアップを開始してください。
- vCenterは個人向けには使いませんので無視してください。
- NICが2枚ある事を前提にすると、Esxiの管理画面はLAN側のNICを対象とするように設定してください。今の時点では、WANは使いません。LANの他のPCから接続できる状態でセットアップします。
- 上記のビデオ（2:40前後の説明）では「冗長化のために」と説明がありますが、今回は冗長化を使いません。通常LAN側のvmnic0を管理用のNICとしてセットアップしてください。また、VLANも使いません。
- ESXi6.7では、vSphere Clientは使いません。インストールしたESXiのLAN側のIPアドレスに対してブラウザで接続し、ESXiのWeb管理画面で設定を行います。

{% asset_img setup_esxi.png alt %}

 　セットアップ終了後は、上記のようなネットワーク構成となります。USBメディアを抜いて再起動後、ESXiの画面にIPアドレスが表示されます。同一ネットワークに接続されているPCなどから、そのIPアドレスにブラウザで接続してください。ログインは、ユーザー名がroot、パスワードはセットアップで指定したものになります。
