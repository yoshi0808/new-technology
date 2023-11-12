---
title:  Sophos Firewall v20
date: 2023-11-12T13:01:00+09:00
tags:
  - XG Firewall
categories:
  - Security
---

{% asset_img Title.png alt %}

## Sophos Firewall v20

Sophos Firewall v20が2023年11月06日に発表されました。個人向けとしては、IPv6 DHCP Prefix Delegationのサポートがなされています。
<!-- more -->

## 主なエンハンスの内容

- IPv6 DHCP Prefix Delegation
- IPv6 BGPv6
- Synchronized Securityの強化
- VPN管理の強化


v20の詳細な説明はSophos Communityを参照してください。
> <https://community.sophos.com/sophos-xg-firewall/b/blog/posts/sophos-firewall-v20-is-now-available>

リリースノートはこちらです
> <https://docs.sophos.com/releasenotes/index.html?productGroupID=nsg&productID=xg&versionID=20.0>

## Sophos Firewallのアップデート

XGの管理画面にログイン後、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアの確認 %}でアップデートの案内が順次来ます。個別にバージョンアップのファイルを入手するには、以下のURLからダウンロードします。

<https://support.sophos.com/support/s/article/KB-000043162?language=ja>

1. 上記画面で{% label primary @ファームウェア %}の{% label primary @ソフトウェア %}のLinkをクリックします。
2. "SW-20.0.0_GA.SFW-222.sig"をダウンロードします。
3. Sophos Firewallの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png 800 alt %}

ダウンロードしたファームウェアを指定します。
{% asset_img update.png 480 alt %}

アップロード＆再起動ボタンをクリックし、v20へのアップグレードを完了させます。

## auひかりのIPv6 DHCP Prefix　Delegation

ようやくIPv6のPrefix委任が使えるようになりました。これは日本だけではなく、世界のホームユーザーからしても待ち望んでいた対応です。これでSophos FirewallのIPv6での苦肉の策である、ULAからIPv6NATという方式から解放されます。ただ個人的には、私の利用しているauひかりの場合残念ながらPrefix Delegationが使えません。いや、正確には64ビットのサブネットが1つだけ割り振られるようではあるのですが、本来、Prefix Delegationは60ビットや56ビットなどの複数のサブネットを受け取り、個々のネットワークに割り当てることになりますから、1つだけあるというのは正規のDelegationという意味合いも少し違います。

とはいえ、auひかり以外のユーザーのために中身を確認していきます。

ネットワークの設定からWANを選び、モードは{% label primary @手動 %}にして{% label primary @DHCPプレフィックスの委任 %}を選択します。

{% asset_img ipv6-1.png 480 alt %}

{% label primary @優先する委任プレフィックス %}はホームユーザーは固定IPで予め指定されたPrefixがあるわけでは無いので設定せずOFFのままで構いません。法人の場合など、固定IPv6を保有する場合、Prefixと委任されるレングスとを入力しますが、デフォルトでは空です。私の場合、4バイト目でauひかりから1を貰っていたので、16ビット分のサブネットが使えるかもしれないと試行錯誤で設定しましたが、その情報が消せずに残っています。

続いて、LANの設定です。

{% asset_img ipv6-2.png 640 alt %}

ここでは、{% label primary @IPの割り当て %}に{% label primary @委任 %}を選びます。続いて、{% label primary @アップストリームのインターフェース %}として、WANであるPort2を選びます。
auひかりでは、ISP は、IPv6 プレフィックスを委任していませんと警告メッセージが表示されてしまいますが、NTT系などでは56ビットのPrefix委任が行われ設定が可能となるはずです。この中でLANに任意の64ビットのネットワークを割り当てることになります。

余談ですが、Sophos Firewallv20のEarly Accessプログラムで私は事前検証していたのですが、Sophos Firewallでは/48, /52, /56, そして /60がサポートされ、それ以外はサポートされないというSophos側からの回答でした。

実はEarly Accessのv20ではもう少し挙動が異なり、64ビットは受け取れていました。Sophosの話ではありませんが、Ubiquiti関係のコミュニティでもauひかりからIPv6のDHCPv6-PDは**出来ない事もない**という情報共有もあり64ビット１つは割り当て可能という事実は認識していました。

{% asset_img ea.png 480 alt %}

auひかりのWANのPrefixの4バイト目は"1"であり、LANのDelegationで確認したPrefix4バイト目は"2"でした。せめてサブネット１つだけでもIPv6 Delegationが出来ればと思いましたが、残念ながら製品版では、エラーチェックが強化された上で/64は排除されてしまいました。

いっそのこと気前よく/48くらい割り当てて貰えないかなと思いつつ、一応auひかりのサポート窓口にDHCPv6 Delegationに対応してほしいという要望は出しておきました。

## アクティブな脅威対応

Firewallの左ペインメニューでは{% label primary @アクティブな脅威対応 %}というメニューがあります。
ここでは2種類の脅威対応があります。１つは名称変更でATP (Advanced Threat Protection) という旧機能がSophos X-Ops 脅威フィードに名称が変更されています。過去、ログを見ても殆どこのATPに関するログは見ることはありませんでした。

もう1つは、MDR脅威フィードという機能です。外部の MDR アナリストがネットワークの脅威フィードを特定し、自動的にファイアウォールにプッシュし、複数のファイアウォールモジュールが、これらのフィードに基づいてトラフィックをブロックするとのことです。

この２つの機能はログでもアクティブな脅威対応という項目で確認できます。

{% note info %}
仮想環境（ESXi）上にFirewallをインストールされている方はアップグレードの前に、「{% post_link esxi-backup %}」を参考に、バックアップを確保される事をお勧めします。
{% endnote %}

