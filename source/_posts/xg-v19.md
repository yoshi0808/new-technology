---
title: Sophos Firewall v19
date: 2022-04-29T09:00:00+09:00
tags:
  - XG Firewall
categories:
  - Security
---
{% asset_img title.png alt %}

## Sophos Firewall v19

Sophos Firewall v19が2022年4月21日に発表されました。
<!-- more -->

## 主なエンハンスの内容

- SD-WAN（Software Defined-Wide Area Network）の強化
- IPSecに関する高速化（Xstream FastPath acceleration）
- SSLーVPNを含むVPNのエンハンス
- Sophos Assistant機能の追加


v19の詳細な説明はSophos Communityを参照してください。
> <https://community.sophos.com/sophos-xg-firewall/b/blog/posts/sophos-firewall-os-v19-is-now-available>

## Sophos Firewallのアップデート

XGの管理画面にログイン後、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアの確認 %}ではただちに全てのユーザーにアップデートの案内が来るわけでは無いので、アップデートにはMySophosにログインし、バージョンアップの差分モジュールをダウンロードします。

1. Sophosのサイトの右上のプルダウンメニューから、{% label primary @ライセンスとアカウント %}をクリックします。
 > https://www.sophos.com/ja-jp.aspx
2. Sophos IDをお持ちでなければIDを作成します。
3. ログイン後、{% label primary @Network Protection %}をクリックします。
4. {% label primary @ファームウェアの更新 %}をクリックします。
5. 「製品名/OSを使った検索」で”ファイアーウォール”を選択し、その後現れるプルダウンは"ソフトウェア"を選択します。
6. {% label primary @選択可能なダウンロードを表示 %}ボタンをクリックします。

{% asset_img mysophos.png 800 alt %}

1. 上記画面で"SW-19.0.0_GA.SFW-317.sig"というアップデータが表示されますのでダウンロードします。
2. MY Sophosはここで終了してXGの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png 800 alt %}

アップロード＆再起動ボタンをクリックし、v19へのアップグレードを完了させます。

{% asset_img upgrade.png 800 alt %}

{% note info %}
仮想環境（ESXi）上にFirewallをインストールされている方はアップグレードの前に、「{% post_link esxi-backup %}」を参考に、バックアップを確保される事をお勧めします。
{% endnote %}

## VPNの設定

VPNも内部的にはバージョンアップはされていますが、ホームユーザーが利用するIPSec VPNやSSLーVPNについて設定ファイルの変更はなく、過去からの物がそのまま利用できます。どちらかといえば、企業向けのサービスとして、サイト間VPNの機能強化を主眼に置いたものになります。管理画面のメニューにおいても、{% label primary @リモートアクセスVPN %}と{% label primary @サイト間VPN %}とメニューが分かれるようになりました。

## Sophos Assistant

Sophos Assistantという管理画面操作のアシスタント機能が追加になりました。例えば、サーバーとしてインターネット側からの接続を受け入れる場合は、DNATという機能を使うことになりますが、以下のように「Full configuration: Create DNAT and firewall rules for web servers」という項目を選択すると、まず最初にWebサーバーのIPを定義するところから始めるように促してくれます。

{% asset_img sa1.png 640 alt %}
{% asset_img sa2.png 1024 alt %}

ある程度わかっている人が久々に操作する時には役に立つ機能と思われます。時間があるときに色々調べてみると知らなかった機能など気づきがあるかもしれません。

## Amazon Virtual Private Cloud (Amazon VPC) の対応

v19より、AWSのプライベートクラウドに接続する機能が加わっています。自宅オンプレとAWSクラウドとをシームレスにネットワークを接続するハイブリッドクラウドに興味のある方はウォッチしてみてください。

> Amazon Web Services VPC support in SFOS v19
 <https://news.sophos.com/en-us/2022/04/07/amazon-web-services-vpc-support-in-sfos-v19/>