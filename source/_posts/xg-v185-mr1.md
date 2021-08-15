---
title: XG Firewall v18.5 MR1の更新
date: 2021-08-15 06:54:17
tags:
  - XG Firewall
categories:
  - Security
---

{% asset_img XG.png alt %}

## XG Firewall v18.5 MR-1

XG Firewall v18.5 MR1が2021年8月9日に発表されました。主としてTLSインスペクションの高速化が行われています。これまでv18を利用してきたユーザーは今後発表されるであろうv18 MR-6以降へのアップデート、或いは、今回のv18.5へのアップデートとを選択する事になるようです。
<!-- more -->

## 主なエンハンスの内容

- DPI モードでの TLS トラフィックのネットワーク パフォーマンスの向上など、v18.5 GA に含まれるパフォーマンスの向上の恩恵を受けることができます。
- ソフォス DDNS (myfirewall.com) は廃止され、新しい登録はサポートされなくなります。2022年1月31日から予定されています。詳細については、[KBA-41764](https://support.sophos.com/support/s/article/KB-000041764?language=en_US&c__displayLanguage=ja)を参照してください。

なお、XGのメニューには {% label primary @ゼロデイ対策 %}という項目が加えられていますが、個別のサブスクリプションライセンスが必要です。

v18.5 MR-1の詳細な説明はSophos Communityの[こちらの記事](https://community.sophos.com/sophos-xg-firewall/b/blog/posts/sophos-firewall-v18-5-mr1-is-now-available)を参照してください。可能な限り迅速にアップグレードするように推奨されています。

{% cq %}
**Upgrade as soon as possible**

While we always encourage you to keep your firewalls up to date with the latest firmware, over the next few months we are recommending you rapidly apply maintenance releases to ensure you have all the important security, performance, and feature enhancements applied as soon as possible.

ファイアウォールを最新のファームウェアで最新の状態に保つことを常に推奨していますが、今後数ヶ月間は、重要なセキュリティ、パフォーマンス、機能強化のすべてを可能な限り早く適用できるように、メンテナンスリリースを迅速に適用することをお勧めします。

{% endcq %}

## XGのアップデート

XGのv17からのアップデートは、 v17.5 MR14以降から可能です。XGv18はMR-3以降から可能です。
XGの管理画面にログイン後、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアの確認 %}ではただちに全てのユーザーにアップデートの案内が来るわけでは無いようなので、アップデートにはMySophosにログインし、バージョンアップの差分モジュールをダウンロードします。

1. [Sophosのサイト](https://www.sophos.com/ja-jp.aspx)の右上のプルダウンメニューから、{% label primary @ライセンスポータル %}をクリックします。
2. Sophos IDをお持ちでなければIDを作成します。
3. ログイン後、{% label primary @Network Protection %}をクリックします。
4. {% label primary @ファームウェアの更新 %}をクリックします。
5. 「製品名/OSを使った検索」で”ファイアーウォール”を選択し、その後現れるプルダウンは"ソフトウェア"を選択します。
6. {% label primary @選択可能なダウンロードを表示 %}ボタンをクリックします。

{% asset_img mysophos.png 800 alt %}

7. 上記画面で"SFOS 18.5.1 MR1-Build326"というアップデータが表示されますのでダウンロードします。
8. MY Sophosはここで終了してXGの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png 800 alt %}

アップロード＆再起動ボタンをクリックし、v18.5へのアップグレードを完了させます。

{% asset_img upgrade.png 800 alt %}

## SophosダイナミックDNSの提供終了

残念ながらmyfirewall.coのDDNSは2022年1月末をもってサービス提供終了となります。また、このv18.5から新たに"myfirewall.co"でDDNSを新規登録できないようになっています。一旦myfirewall.coのDDNSを削除してしまうと追加できない事になります。代替のDDNSは以下の通りです。

- DynDNS
- ZoneEdit
- EasyDNS
- DynAccess
- No-IP
- DNS-O-Matic
- Google DNS
- Namecheap
- FreeDNS

{% asset_img ddns.png 800 alt %}

No-IPの無償ユーザーで確認してみましたが定期的にDNSの更新が行われています。No-IPの無償ユーザーは毎月ユーザーが実際にNo-IPのサイトにログインして利用継続を確認する必要があります。XGのVPN(IP-Sec,SSL-VPN)については設定ファイルのホスト名を修正できます。例えばNASをお持ちの方であればDDNSが提供されているケースもあり、NASのメーカーが提供するDDNS名に置き換え、XG上のDDNSは使わないという方法もあります。

## TLS/SSLインスペクションのパフォーマンス

体感的には通販サイトなど細かな画像ファイルが多く読み込まれるケースで高速化したかな？と感じてはいます。SSLインスペクション、IPS、アプリケーションフィルタ、Webフィルタを有効にした状態で下記のスループットとなっており、十分高速ではあります。

ネット回線： auひかり5Gbps
- XGのマシンスペック： Core i7メモリ16Gbyte
- 仮想環境： ESXi6.7
- ネットワークカード： intel X550-T2
- クライアントPC： CeleronG3900という5年前の一般的なクライアントに5GbpsのNIC(Aquantia AQtion 5G Network Adapter)を組み込んだもの

{% asset_img pc-speedtest.png 480 alt %}

- iPhone11(iOS14.7.1)、Wi-Fi6(11ax)

{% asset_img ios-speedtest.png 480 alt %}


{% note info %}
仮想環境（ESXi）上にXGをインストールされている方はアップグレードの前に、「{% post_link esxi-backup %}」を参考に、XGのバックアップを確保される事をお勧めします。
{% endnote %}