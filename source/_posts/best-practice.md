---
title: XG Firewall V18の設定におけるベストプラクティス
tags:
  - XG Firewall
categories:
  - Security
date: 2020-05-09 17:55:26
---


{% note success  %}

## この記事で実現する内容について

　XG Firewall V18のWebフィルタ・アプリケーションフィルタ・IPSの高速化・SSL/TLS証明書の検証を対象に、Sophos Communityを参考に、ホームユーザーにとってベストプラクティスとなる設定を行います。

{% endnote %}

<!-- more -->

{% note primary no-icon %}

## XGのWebフィルターとアプリケーションフィルターのSophos Communityの情報について

{% endnote %}

　XG V18のレイヤ7ファイアウォールは、SSL/TLS通信をPort443に限定していません。これまでの一連の設定で実施してきましたが、そもそもファイアウォールのルール自体は非常にシンプルです。https通信を通すのは原則であり、URL・アプリケーション・データの中身をどうチェックするかがレイヤ7ファイアウォールの肝となります。

　Sophos Communityにおいては、過去発生したランサムウェアや情報漏洩に繋がるProxyやVPN等、様々な検討、議論が重ねられ、ベストプラクティスといえるお勧めの設定が存在します。

　以下の記事を参考にします。

1. [Sophos XG Firewall / Cyberoam: Application filter recommended settings for better application detection](https://community.sophos.com/products/xg-firewall/f/recommended-reads/119051/sophos-xg-firewall-cyberoam-application-filter-recommended-settings-for-better-application-detection)
2. [ランサムウェア: ソフォス製品による回避策のアドバイス](https://community.sophos.com/kb/ja-jp/124744)
3. [SFOS 16.05.0 GA IPS set maxpkts size question](https://community.sophos.com/products/xg-firewall/f/intrusion-prevention/86274/sfos-16-05-0-ga-ips-set-maxpkts-size-question?pi2151=2#pi2151=1)
4. [Sophos XG Firewall: 高リスクのアプリケーションをブロックする手順](https://community.sophos.com/kb/ja-jp/123102)　<sup>[1](#note1)</sup>

最初の記事がベストプラクティスとも言える内容になっており、この記事を中心に、関連する記事も参考にしながら設定していきます。

{% note primary no-icon %}

## XGのWebフィルターとアプリケーションフィルターのベストプラクティスとは

{% endnote %}

　記事の設定すべき概要について纏めます。

1. XGのコマンドラインでIPSの設定を変更します。初期設定から変更するのはmaxpktsの値です。これは、データの先頭からアプリケーションの判定に8パケットを渡すというもので、この値はパフォーマンスに影響するようです。チューニングされ、高速化に繋がるので、80パケットを設定するのがお勧めという事になっています。
2. アプリケーションフィルターでは、P2P/Proxy and Tunnel/DNS Multiple QNAME（DNS経由の情報漏洩）/OpenVPNを止めるべきと記載があります。また、ハイリスクアプリケーションのカテゴリ（Risk=4、High Risk=5）も止める事が推奨されるようにカテゴライズされています。
3. Webフィルターでは、以下の項目が拒否対象です。
    - IPAddress
    - None
    - Parked Domains
    - Spam URLs
    - Anonymizers
    - Command & Control
    - Phishing & Fraud
    - Spyware & Malware
    - Uncategorized
4. 残りは個別のファイアウォールのルールでUDP443のQUICを認めない設定、不正なSSL証明書を許可しない等の設定が必要です。

　さて、これらの設定はそれなりに大変ですが順を追って設定していきます。

{% note primary no-icon %}

## IPSの設定変更（デバイスコンソール）

{% endnote %}

　{% label info @Application filter recommended settings for better application detection %}の記事を参考に、XGの画面右上にある、{% label info @admin▼ %}から{% label info @コンソール %}を選択し起動します。パスワードを入力し、{% label info @4.Device Console %}に入ります。そして、以下のコマンドを入力し、期待する設定値を合っているか確認します。

``` bash
console> show advanced-firewall
```

- Midstream Connection Pickup Off

　ここはXGのV18であれば基本変更する必要はありません。次にIPSの設定です。

``` bash
console> show ips-settings
```

- maxsesbytes 0
- stream on
- maxpkts 80

　デフォルトでは、maxpktsが8となっているので、以下のコマンドで80に変更します。

``` bash
console> set ips maxpkts 80
```

{% note primary no-icon %}

## アプリケーションフィルタの設定

{% endnote %}

　最も面倒なアプリケーションフィルタの設定です。とにかくアプリケーションの数が多い事と、今後もメンテナンスしていかなくてはなりません。しかも高リスクというカテゴリであっても、FirefoxのUpdateやAndroidのアプリ関係もそれなりにあります。

　ここでは、リコメンドされた拒否アプリの拒否設定をしつつ、ユーザー側で許可する設定を加えていきたいとおもいます。下手にアプリを個別選択するようなフィルタにしてしまうと、新しいアプリケーションが追加される都度、何が追加されたか確認をし、メンテナンスをしなければなりません。それよりは、リスクの高いアプリケーションは停止を原則とし、自分が許可するアプリの設定を加えていくほうがメンテナンスしやすいとおもいます。

　XGの左メニューの{% label info @アプリケーション %}の{% label info @アプリケーションリスト %}の右上に{% label info @分類 %}というフィルタがあります。このフィルタをクリックし展開すると、新規/認証済み/許容/未認証とあります。これはクラウドアプリケーションとして登録されているものが対象となります。左ペインメニューの{% label info @アプリケーション %}から{% label info @クラウドアプリケーション %}で内容が確認できます。
 
{% asset_img filter.png alt %}
 
　未認証というのは不許可と理解して下さい。デフォルトで、{% label info @新規 %}か設定なし（空白）となっています。Riskが高いか低いかはともかく自分が{% label info @認証済み %}または{% label info @許容 %}としたものは通すルールを作る事になります。またリスクが低くとも明らかに使わないもので止めたいものは{% label info @未認証 %}を設定し、そのアプリケーションは拒否するように設定すると、その後の運用が楽になります。

　具体的にリコメンドされた高リスクアプリケーションを止める設定をしていきます。以下の数字の順番に設定を行ってください。最後に設定したものがルールとして一番上（優先）に位置します。

| 項番 | 対象              | 内容                                                                                                                                                            | 推奨   |
| ---- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1    | Risk4,5のアプリ   | ハイリスクアプリケーションは拒否する                                                                                                                            | Sophos |
| 2    | P2P Proxy         | Firewallで電文が解読できない宛先は拒否する                                                                                                                      | Sophos |
| 3    | DNS QNAME,OpenVPN | アプリケーション個別指定で拒否設する                                                                                                                            | Sophos |
| 4    | 自身で許容        | 上記で拒否するアプリケーションであっても自身で許容して利用するアプリケーションを列挙する。ホームユーザー向けには、EXEファイル、ZIPファイル、FirefoxのUpdateなど | 筆者   |
| 5    | 未認証            | クラウドアプリケーションで通したくないものについて拒否設定を行う                                                                                                | -      |
| 6    | 許容、認証済み    | クラウドアプリケーションで許容する或いは様子をみるものは許可する                                                                                                | -      |

XGの左メニューの{% label info @アプリケーション %}の{% label info @アプリケーションフィルタ %}から、{% label info @追加 %}ボタンをクリックして下さい。フィルタの名前を決めます。テンプレートは{% label info @Allow ALL %}のままで構いません。ここでは、{% label info @Block High Risk Apps %}とします。

{% asset_img application1.png alt %}

1. 以下のようにカテゴリで{% label info @リスク %}のプルダウンからHigh、Very Highのものを選択し、アクションは{% label info @拒否 %}を選び保存して下さい。

{% asset_img application2.png alt %}

　登録が完了すると、リスクの高いアプリケーションが並びます。

{% asset_img application3.png alt %}

　次に{% label info @追加 %}ボタンをクリックし、2番目のフィルタを追加します。今度はカテゴリから、P2PとProxyを選び、{% label info @アクション %}は{% label info @拒否 %}を選び保存します。

　3番目は、{% label info @DNS QNAME %}と{% label info @OpenVPN %}です。一番右側のプルダウンのスマートフィルタに{% label info @qname %}と入力し、Enterキーを押下して下さい。一旦{% label info @DNS Multiple QNAME %}が絞り込まれスマートフィルタの欄が空白になりますので、引き続き{% label info @openvpn %}と入力し、Enterキーを押下して下さい。これで2つのフィルタが絞り込まれているので、{% label info @拒否 %}を選択し、{% label info @保存 %}をクリックしてください。

　4番目は、ユーザーの考え方次第です。利用しているアプリが高リスクまたはP2PとProxyと判定されるケースがあります。しかしながら利用は継続必須と判断される場合は、フィルタを除外する設定を行います。{% label info @アプリケーションフィルタ %}のログを見ながら試行錯誤が必要です。私はスマートフィルタを活用し{% label info @exe file %}、{% label info @zip file %}、{% label info @firefox %}と入力し、{% label info @許可 %}と設定しました。

　5番目は、{% label info @分類 %}から{% label info @未認証 %}を選ぶと、自動で{% label info @Cloud Application %}が選択されます。これを{% label info @拒否 %}として保存します。

　最後の6番目は、{% label info @分類 %}から{% label info @許容 %}と{% label info @認証済み %}を選択し、{% label info @アクション %}は{% label info @許可 %}として登録します。

　また、クラウドアプリケーションの画面では、以下の通り、過去に通信のあったアプリケーション一覧が表示されます。既に安全と分かっているものについては、{% label info @classify %}から分類を{% label info @認証済み %}にマークできます。過去データの蓄積なので、変更してもすぐには統計データは変わりません。一方、未認証と設定した場合は、アプリケーションフィルタで即座に通信が停止される事になります。

　これでアプリケーションフィルタの設定は終了です。今後Sophosによりフィルタが定期的に追加されていきますが、リスクの高いアプリケーションは自動的にフィルタされる事になります。また、クラウドアプリケーションはリスクが高であってもいきなり止める事にはなりませんので、上記の記載のとおり、定期的にクラウドアプリケーションの利用状況を確認してください。

{% note primary no-icon %}

## Webフィルタの設定

{% endnote %}

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

　XGの左ペインメニューの、{% label info @Web %}、{% label info @ポリシー %}から、{% label info @追加 %}ボタンをクリックします。

{% asset_img webfilter1.png alt %}

　上記の図のとおり名前を入力します。ここでは、{% label info @Home Policy %}とします。デフォルトは許可で、その上に拒否するルールを追加していきます。
　以下のように拒否する対象を選択する時には{% label info @すべて表示 %}とし、全てのカテゴリを表示させ、選択して下さい。

{% asset_img webfilter2.png alt %}

 登録が終わったら、画面の最下部にある、{% label info @変更を適用 %}をクリックして下さい。

　最後にWebの{% label info @全般設定 %}をクリックします。
- {% label info @認識されていないSSLプロトコルをブロック %}にチェックします
- {% label info @無効な証明書をブロック %}にチェックします
- {% label info @スキャンエンジンの選択 %}は{% label info @デュアルエンジン %}を選択します

{% asset_img webfilter3.png alt %}

{% note primary no-icon %}

## ルールとポリシーの設定

{% endnote %}

　XGの左ペインの{% label info @ルールとポリシー %}で設定を見直します。デフォルトポリシーとしているルールを選択します。

{% asset_img rule1.png alt %}

　これまでの記事では{% label info @To Internet %}というデフォルトのルールを作ってきましたので、そのルールを修正します。

- {% label info @Webポリシー %}に、{% label info @Home Policy %}を設定します。
- {% label info @アプリケーションコントロール %}に、{% label info @Block High Risk Apps %}を設定します。
- Sophos推奨の{% label info @QUICプロトコルのブロック %}にチェックします。

　IPv6を有効にされている方は、IPv4と同様にIPv6のポリシーを設定して下さい。

{% note primary no-icon %}

## 証明書やマルウェア対策などの設定

{% endnote %}

　いよいよ設定も最後です。XGの左ペインメニューの{% label info @ルールとポリシー %}から{% label info @SSL/TLSインスペクションルール %}に進み、右上の{% label info @SSL/TLSインスペクションの設定 %}をクリックします。特に設定変更は不要ですが、以下の通りである事を確認してください。

{% asset_img ssl-inspection.png alt %}

　私の環境では、この設定で引っかかったのは、IPアドレスで接続するものとカテゴリ無しのWebフィルタです。ここは{% label danger @ブロック %}とはせず、{% label warning @警告する %}扱いに変更する、或いは固有の端末は除外するなどしてログを確認する運用にしています。

<small id="note1">[1]
　アプリケーションフィルタの説明で、{% label info @新しく起動またはアップグレードされたアプリケーションを自動的に次のグループに分類するアプリケーションフィルタ機能が含まれています %}と記載されています。クラウドアプリケーションについてはその通りの解釈ですが、アプリケーションフィルタについては起動された場合ではなく、{% label warning @Sophos社がアプリケーションフィルタを追加した場合 %}と解釈して下さい。
</small>
