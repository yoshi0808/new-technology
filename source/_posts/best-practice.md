---
title: XG Firewall v18の設定におけるベストプラクティス
tags:
  - XG Firewall
categories:
  - Security
date: 2020-05-09 17:55:26
---

<p class="onepoint">この記事で実現すること</p>

XG Firewall v18のWebフィルタ・アプリケーションフィルタ・IPSの高速化・SSL証明書の検証を対象に、Sophos Communityを参考に、ホームユーザーにとってベストプラクティスとなる設定を行います。

<!-- more -->

## XG v18のベストプラクティス

XG v18のレイヤ7ファイアウォールは、SSL/TLS通信をPort443に限定していません。これまでの一連の設定で実施してきましたが、そもそもファイアウォールのルール自体は非常にシンプルです。https通信を通すのは原則であり、URL・アプリケーション・データの中身をどうチェックするかがレイヤ7ファイアウォールの肝となります。Sophos Communityにおいては、過去発生したランサムウェアや情報漏洩に繋がるProxyやVPN等、様々な検討、議論が重ねられ、ベストプラクティスといえるお勧めの設定が存在します。以下の記事を参考にします。

1. [Sophos XG Firewall / Cyberoam: Application filter recommended settings for better application detection](https://community.sophos.com/products/xg-firewall/f/recommended-reads/119051/sophos-xg-firewall-cyberoam-application-filter-recommended-settings-for-better-application-detection)
2. [ランサムウェア: ソフォス製品による回避策のアドバイス](https://community.sophos.com/kb/ja-jp/124744)
3. [SFOS 16.05.0 GA IPS set maxpkts size question](https://community.sophos.com/products/xg-firewall/f/intrusion-prevention/86274/sfos-16-05-0-ga-ips-set-maxpkts-size-question?pi2151=2#pi2151=1)
4. [Sophos XG Firewall: 高リスクのアプリケーションをブロックする手順](https://community.sophos.com/kb/ja-jp/123102)　<sup>**[[1]](#note1)**</sup>
5. ["Best Practice Guide.pdf"](https://community.sophos.com/cfs-file/__key/communityserver-discussions-components-files/258/Securing-your-Sophos-XG-Firewall-_2D00_-Best-Practice-Guide.pdf)（2020-06-24追加）

最初の記事がベストプラクティスとも言える内容になっており、この記事を中心に、関連する記事も参考にしながら設定します。

## 設定する内容

設定すべき概要は以下の通りです。

1. XGのコマンドラインでIPSの設定を変更します。初期設定から変更するのはmaxpktsの値です。これは、データの先頭からアプリケーションの判定に8パケットを渡すというもので、この値はパフォーマンスや検出精度に影響するようです。100〜300パケットを設定するのがお勧めとされています。
2. アプリケーションフィルタでは、P2P/Proxy and Tunnel/DNS Multiple QNAME（DNS経由の情報漏洩）/OpenVPNを止めるべきと記載があります。また、ハイリスクアプリケーションのカテゴリ（Risk=4、High Risk=5）も止める事が推奨されるようにカテゴライズされています。
3. Webフィルタでは、以下の項目が拒否対象です。
 - IPAddress
 - None
 - Parked Domains
 - Spam URLs
 - Anonymizers
 - Command & Control
 - Phishing & Fraud
 - Spyware & Malware
 - Uncategorized
4. 個別のファイアウォールのルールでUDP443のQUICを認めない設定、不正なSSL証明書を許可しない等の設定が必要です。

## IPSの設定変更

XGの画面右上にある、{% label primary@admin▼ %}から{% label primary@コンソール %}を選択し起動します。パスワードを入力し、{% label primary@4.Device Console %}に入ります。そして、以下のコマンドを入力し、期待する設定値を合っているか確認します。

``` bash
console> show advanced-firewall
```

- Midstream Connection Pickup Off

ここはXGのv18であれば基本変更する必要はありません。次にIPSの設定です。

``` bash
console> show ips-settings
```

- maxsesbytes 0
- stream on
- maxpkts 200（推奨値100〜300）

デフォルトでは、maxpktsが8となっているので、以下のコマンドで200に変更します。ここはマシンスペックにもよるので、100から300の間で設定をチューニングしながらスループットを確認してください。これまでのCommunityでは、この値は80が推奨されていましたが、2020-06-24にSophosより公開された["Best Practice Guide"](https://community.sophos.com/cfs-file/__key/communityserver-discussions-components-files/258/Securing-your-Sophos-XG-Firewall-_2D00_-Best-Practice-Guide.pdf)ではスループットを確認しながら100〜300の間で設定する事が推奨されています。ここでは中央値の200を設定しています。

``` bash
console> set ips maxpkts 200
```

## アプリケーションフィルタの設定

とにかくアプリケーションの数が多い事と、今後もメンテナンスしていく事を留意して設定します。高リスクというカテゴリであっても、ホームユーザーが利用するアプリケーションもそれなりにあります。ここでは、リコメンドされた拒否アプリの拒否設定をしつつ、ユーザー側で許可する設定を加えていく事になります。ただし下手にアプリを個別選択するようなフィルタにしてしまうと、新しいアプリケーションが追加される都度、メンテナンスが必要となってしまいます。従い**リスクの高いアプリケーションは停止を原則とし、自分が許可するアプリの設定を加え**、以後はなるべくメンテナンスが不要となるように設定します。

XGの左メニューの{% label primary@アプリケーション %}の{% label primary@アプリケーションリスト %}の右上に"分類"というフィルタがあります。このフィルタをクリックし展開すると、新規/認証済み/許容/未認証とあります。これはクラウドアプリケーションとして登録されているものが対象となります。左ペインメニューの{% label primary@アプリケーション %}から{% label primary@クラウドアプリケーション %}で内容が確認できます。

{% asset_img filter.png alt %}

"未認証"というのは不許可の意味です。デフォルトで、”新規"か"設定なし（空白）"となっています。リスクの高低によらず、自身で"認証済み"または"許容"としたものは許可する事になります。またリスクが低くとも明らかに使わないものは”未認証”を設定すると、そのアプリケーションは直ちに拒否されるようになります。

具体的にリコメンドされた高リスクアプリケーションを止める設定をしていきます。以下の数字の順番に設定を行ってください。最後に設定したものがルールとして一番上（優先）に位置します。

| 項番 | 対象              | 内容                                                                                                                                           | 推奨   |
| ---- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1    | Risk4,5のアプリ   | ハイリスクアプリケーションは拒否する                                                                                                           | Sophos |
| 2    | P2P Proxy         | Firewallで電文が解読できない宛先は拒否する                                                                                                     | Sophos |
| 3    | DNS QNAME,OpenVPN | アプリケーション個別指定で拒否設する                                                                                                           | Sophos |
| 4    | 自身で許容        | 上記で拒否するアプリケーションであっても自身で許容して利用するアプリケーションを列挙する。ホームユーザー向けには、EXEファイル・ZIPファイルなど | 筆者   |
| 5    | 未認証            | クラウドアプリケーションで通したくないものについて拒否する                                                                                     | -      |
| 6    | 許容、認証済み    | クラウドアプリケーションで許容する或いは様子をみるものは許可する                                                                               | -      |

XGの左メニューの{% label primary@アプリケーション %}の{% label primary@アプリケーションフィルタ %}から、”追加"ボタンをクリックしてください。フィルタの名前を決めます。テンプレートは"Allow ALL"のままで構いません。ここでは、"Block High Risk Apps"と命名します。

{% asset_img application1.png alt %}

1. 以下のようにカテゴリで{% label primary@リスク %}のプルダウンからHigh、Very Highのものを選択し、アクションは"拒否"を選び保存してください。

{% asset_img application2.png alt %}

登録が完了するとリスクの高いアプリケーションが並びます。

{% asset_img application3.png alt %}

1. {% label primary@追加 %}ボタンをクリックし、フィルタを追加します。今度はカテゴリから、P2PとProxyを選び、{% label primary@アクション %}は"拒否"を選び保存します。
2. "DNS QNAME"と"OpenVPN"とをフィルタします。一番右側のプルダウンのスマートフィルタに`qname`と入力し、Enterキーを押下してください。一旦"DNS Multiple QNAME"が絞り込まれスマートフィルタの欄が空白になりますので、引き続き`openvpn`と入力し、Enterキーを押下してください。これで2つのフィルタが絞り込まれているので、"拒否"を選択し、"保存"をクリックしてください。
3. ご自身で利用しているアプリが高リスクまたはP2PとProxyに含まれる場合の除外設定です。ログビューアでアプリケーションフィルタログを見ながら拒否されてしまった対象を除外する設定が必要です。ホームユーザーには最低限度EXEファイルおよびZIPファイルは必要でしょうから、スマートフィルタを活用し`exe file`、`zip file`と入力し、許可と設定します。
4. {% label primary@分類 %}から"未認証"を選ぶと、自動で"Cloud Application"が選択されます。これを"拒否"として保存します。
5. {% label primary@分類 %}から"許容"と"認証済み"を選択し、{% label primary@アクション %}は"許可"として登録します。

クラウドアプリケーションの画面では、以下の通り、過去に通信のあったアプリケーション一覧が表示されます。既に安全と分かっているものについては、{% label primary@classify %}から分類を"認証済み"にマークできます。未認証と設定した場合は、アプリケーションフィルタで即座に通信が停止されます。

これでアプリケーションフィルタの設定は終了です。今後Sophosによりフィルタが定期的に追加されていきますが、リスクの高いアプリケーションは自動的にフィルタされる事になります。また、クラウドアプリケーションはリスクが高でも即座に拒否とはなりませんので、上記の記載のとおり、定期的にクラウドアプリケーションの利用状況を確認してください。

## Webフィルタの設定

続いてWebフィルタの設定を行います。フィルタとその内容は以下の通りです。

| 対象              | 内容                                                        |
| ----------------- | ----------------------------------------------------------- |
| IPAddress         | IPアドレスでアクセスするサイト                              |
| None              | カテゴリに該当しない通信                                    |
| Parked Domains    | ドメイン取得後放置されているドメイン                        |
| Spam URLs         | スパムメールに含まれるURL                                   |
| Anonymizers       | セキュリティと制御を回避する目的をもって運用されるProxyなど |
| Command & Control | 感染したマシン上の悪意のあるソフトウェアからのC2C通信       |
| Phishing & Fraud  | フィッシングサイト                                          |
| Spyware & Malware | スパイウェア、マルウェア                                    |
| Uncategorized     | 分類不能なサイト                                            |

XGの左ペインメニューの、{% label primary@Web %}、{% label primary@ポリシー %}から、"追加"ボタンをクリックします。
{% asset_img webfilter1.png alt %}

上記の図のとおり名前を入力します。ここでは、"Home Policy"とします。デフォルトは許可で、その上に拒否するルールを追加していきます。

以下の図のとおり拒否する対象を選択する時には"すべて表示"とし、全てのカテゴリを表示させ、選択してください。
{% asset_img webfilter2.png alt %}

登録が終わったら、画面の最下部にある、{% label primary@変更を適用 %}をクリックしてください。

最後にWebの{% label primary@全般設定 %}をクリックします。
- {% label primary@認識されていないSSLプロトコルをブロック %}にチェックします
- {% label primary@無効な証明書をブロック %}にチェックします
- {% label primary@スキャンエンジンの選択 %}は"デュアルエンジン"を選択します

{% asset_img webfilter3.png alt %}

## ルールとポリシーの設定

XGの左ペインの{% label primary@ルールとポリシー %}で設定を見直します。デフォルトポリシーとしているルールを選択します。

{% asset_img rule1.png alt %}

これまでの記事では"To Internet"というデフォルトのルールを作ってきましたので、そのルールを修正します。

- {% label primary@Webポリシー %}に、"Home Policy"を設定します。
- {% label primary@アプリケーションコントロール %}に、"Block High Risk Apps"を設定します。
- Sophos推奨の{% label primary@QUICプロトコルのブロック %}にチェックします。

IPv6を有効にされている方は、IPv4と同様にIPv6のポリシーを設定してください。

## SSL/TLSインスペクションルールの確認

いよいよ設定も最後です。XGの左ペインメニューの{% label primary@ルールとポリシー %}から{% label primary@SSL/TLSインスペクションルール %}に進み、右上の{% label primary@SSL/TLSインスペクションの設定 %}をクリックします。特に設定変更は不要ですが、以下の通りである事を確認してください。

{% asset_img ssl-inspection.png alt %}

## 除外した設定

ベストプラクティスとして記事に記載のある中で今回設定していないものがあります。以下の記載の部分です。
> Allow only HTTPS, HTTP, DNS, ICMP, SMPT. Services on LAN→WAN

これはPsiphonおよびTor（トーア）Proxyの対策で、ビジネスの現場においては、恣意的にFirewallを回避させるケースを想定しています。端的に言えば、HTTPS、DNS、メール等の通信許可するポートを最低限にせよというものです。**これを制限すると個人で利用する音楽のストリーミングやSNSなど多くのアプリケーションが動作しなくなります**。アプリケーションを全て特定し、宛先サーバーと利用ポートを全て管理するのは個人向けとしては現実的ではありません。願わくば、Torの個人利用はお控えいただいて、この設定は行わないという方法が私個人のお勧め設定です。そのうち、XGのアプリケーションフィルタで対応出来るようになる事を期待しましょう。

## 動作確認

ログビューアを開き、"ファイアウォール"、"アプリケーションフィルタ"、"Webフィルタ"を確認します。IPアドレスで接続するもの・カテゴリ無し・分類不能とされたWebフィルタは拒否されるケースが多くあります。ここは状況に応じて除外設定が必要です。

<small id="note1">**[1]**
　アプリケーションフィルタの説明で、"新しく起動またはアップグレードされたアプリケーションを自動的に次のグループに分類するアプリケーションフィルタ機能が含まれています"と記載されています。クラウドアプリケーションについてはその通りの解釈ですが、アプリケーションフィルタについては起動された場合ではなく、"Sophos社がアプリケーションフィルタを追加した場合"と解釈してください。
</small>
