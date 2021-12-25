---
title: PC（ハードウェア）の準備
date: 2020-02-25 19:33:05
tags:
 - XG Firewall
categories:
 - Security
#comments: false
---
## ネットワーク構成

XG Firewall(以下、XG)を導入した場合のネットワーク構成は以下の図のようになります。一般的にはプロバイダーから貸与されるホームゲートウェイ（外側の光モデム等は省略）に直接PCを繋ぐか、ホームゲートウェイの無線機能でPCやスマホを接続する事になります。XGを導入する場合は、ホームゲートウェイとPCの間にXGを挟み込む形になります。
<!-- more -->
 {% asset_img network.drawio.png alt %}

この構成はXGのWAN側とXGのLAN側と2つのネットワークを持つ事になり、XGには2枚のネットワークカード（以下、NIC）あるいは、2つ以上のPortを持っているNICを1枚用意する事になります。XGのWAN側のインタフェースは、ホームゲートウェイからDHCPでプライベートIPアドレスやDNSを割り当てられます。そして、LAN側のPCやスマホのために、XGはあらかじめユーザが決めたプライベートネットワークアドレスを割り当てます。XGはこのIP割り当てのためのDHCP機能やDNS機能を持っています。また、スマホのネット接続のために無線ルータを別途用意する必要があり、この場合は無線ルータをブリッジモードでセットアップする事になります。

## ハードウェア構成の検討

上記の構成のために、2つのネットワークPortを持ったPCが1台必要になります。XGの制約としては、6Gbyteのメモリ上限とCPUが4coreまでとなります。物理サーバにそのままXGをインストールしても良いし、ESXi等の仮想ソフトの上にVMを構築しても良いです。ESXiの場合は、ハードウェア互換が厳しいため、本質的には互換リストを元にハードウェアの互換性を事前に確認します。
> VMware Compatibility Guide
 <https://www.vmware.com/resources/compatibility/search.php>

ネットワークカードを検索する場合は、検索カテゴリに{% label primary @I/Oデバイス %}、I/Oデバイスタイプに{% label primary @Network %}を選択します。お目当ての製品がある場合は製品名を入力し検索すると良いでしょう。

ただし、法人向けの要素が強く個人が利用するデバイスがあまりリストされていません。CPUおよびネットワークカードはintel製が比較的認識しやすいという傾向があります。一般的には、以下のものが安全策で好まれるようで、私も昔はこのNICを2枚差してXGを使っていました。また、ストレージについてはESXi6.7からはsataのSSDで認識しないというのは少ないようですが、M2.NVMeはintel以外認識しないケースがあるようです。私はsataについては、Transcend、CrucialをESXiで使っています。

> インテル® ギガビット CT デスクトップ・アダプター
 <https://www.intel.co.jp/content/www/jp/ja/products/details/ethernet/gigabit-network-adapters/gigabit-ct-desktop-adapters.html>
 {% asset_img ct-desktop.png 800 alt %}

今は、プロバイダーをauひかりにし、5Gbpsの契約になっているため、10GbpsのNICをESXiで使っています。

> インテル® イーサネット・コンバージド・ネットワーク・アダプター X550
 <https://www.intel.co.jp/content/www/jp/ja/products/details/ethernet/gigabit-network-adapters/gigabit-ct-desktop-adapters.html>
 {% asset_img x550.png 800 alt %}

このNICだと、1つのPCI Expressバスにこのカード1枚を刺し、WanとLanのインタフェースを用意できます。
