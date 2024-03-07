---
title: UniFi Express
date: 2024-03-06T19:20:08+09:00
tags:
- UniFi
categories:
- [Hardware]
- [Network]
---

{% asset_img Title.png 1024 alt %}
<p class="onepoint">この記事で実現すること</p>

この記事ではUniFiネットワークの導入未経験の方を対象に、UniFiの新しい小型ゲートウェイUniFi Expressの具体的なセットアップおよび性能確認、機能紹介を目的としています。検証のため製品提供を受けていますのでこの記事はPR要素を含みます。
<!-- more -->

## 経緯

普段からUbiquiti製品を使っている私は、いつもUbiquitiの皆さまには製品サポートなどで大変お世話になっています。一方、FacebookのUbiquiti日本公式コミュニティではユーザーの質問などに微力ながらサポートするように心がけています。いつものようにUbiquitiのご担当者さまから製品設定についてアドバイス頂いていた折、新製品「UniFi Express」の検証はいかがですか？と打診があり、快く引き受けさせていただきました。普段はアクセスポイント（AP）、スイッチは使っていますが、他社製セキュリティゲートウェイがお気に入りでなかなかUniFiのゲートウェイを使う機会がありませんでした。

UniFiは簡単な操作で分かりやすさを目的としている一方で、パワーユーザーの高度な要求に応えていることもあり、一旦ネットワークの世界の深みに入るといきなり難易度が増す事になります。

Expressは従来の機能豊富なUniFiゲートウェイから負荷が掛かるIPSなどの処理を省き、できるだけシンプルな形でUniFiのゲートウェイをUniFi初心者にも簡単に使えるようにしたゲートウェイです。

3月となり、新生活が始まる時期でもあります。引っ越しされて新しい住環境にネットワークを敷設される場合は、小型の置き場所に困らないExpressは使い勝手が良いと思われます。

## UniFi Express

製品の説明ページは以下になります。

{% asset_img 0.png 1024 alt %}

> UniFi Express
 <https://www.ui.com/us/ja/cloud-gateways/wifi-integrated/express>

## この記事でのインターネットの構成

私はauひかりホーム（10ギガ）を導入しており、貸与されたホームゲートウェイ（HGW）があります。その後ろにExpressを配置する形式となります。

{% asset_img diaglam.drawio.png 240 alt %}

## セットアップ

Expressはスマホだけでセットアップ可能です。むしろPCのブラウザを使うよりスマホアプリで行う方が便利です。
UniFiの製品は説明書というものがありません。いや、あるにはあるのですが、セットアップ方法＝アプリを使う事となっています。

{% asset_img 1.png 480 alt %}

セットアップに関する説明書は注意書きを除けばこれが全て（That's all!）です。

製品と付属品です。本体、電源ケーブル、30cmのLANケーブルが付属します。
{% asset_img 2.png 800 alt %}

唯一の説明書通りに電源ケーブル、LANポートは2つあります（LAN、WAN）ので、WAN側（地球儀のマークがある方）に接続します。
{% asset_img 3.png 800 alt %}

私の環境ではこの壁に接続したLANの接続口の先にHGWがあります。

さて、説明書のQRコードをiPhoneのカメラで読み込み、アプリをダウンロードしましょう。
{% asset_img 4.png 360 alt %}

※上記の写真のiPhoneはWi-Fiに接続されていますがこれは既存環境のWi-Fiに接続されているものです。

{% asset_img 5.png 360 alt %}

私の場合、既にUbiquitiのアカウントを保有しアプリにログインできていることや既存のUniFiコンソールに接続されている状態ですが、スマホがBluetooth経由でExpressを見つけると画面にセットアップ開始を促します。

{% asset_img 6.png 360 alt %}
既存環境があるので選択制となっていますが、「新しいシステムを設定」を選びます。Expressが最初の1台の場合、この画面は出てこないと思われます。

また、今回の例では既に既存アカウントでアプリにログインしている状態ですが、全く新規の場合は、Ubiquitiのアカウントを新規作成します。

{% asset_img 7.png 360 alt %}

今回、唯一セットアップしたと思える場所がここだけです。SSIDは既に”UniFi"となっており（変更可能）、ここでWi-Fiパスワードを指定します。

{% asset_img 8.png 360 alt %}
ここからは眺めているだけです。

{% asset_img 9.png 360 alt %}
{% asset_img 10.png 360 alt %}
{% asset_img 11.png 360 alt %}

ここで「Wi-Fiネットワークに参加」ボタンをタップします。UniFiアプリはSSID「UniFi」と設定したパスワードをiOSの設定アプリに送り込み自動的にWi-Fi接続が完了します。

これだけでもうiPhoneはインターネットにアクセスできるようになっています。顧客体験を重要視するUbiquitiらしい仕掛けです。

さて、アプリの表記では、HGWのDHCPによって割り当てられた`192.168.0.2`というExpressのWAN側IPアドレス、および、LAN側のIPアドレス`192.168.1.1`が振られています。
{% asset_img 12.png 360 alt %}

Wi-Fiを見てみましょう、ExpressはWi-Fiチャンネルを含めて自動という言葉を多く見かけます。5GHzはデフォルトでは40MHzとなっていますが、80MHzに変更できるのでここで変更しておきましょう（最大160MHzにできます）。これ以外の自動は2つあって、Wi-Fiチャンネルおよび出力が自動となっています。日本のWi-Fiの電波出力の上限はざっくり説明すると200mW（23dBm）であり、その上限を超えないような設定となっています。クライアントの接続状況によって適切に電波の出力が調整され省エネにも有効です。
{% asset_img 13.png 360 alt %}

設定からコンソールを見てみましょう。
{% asset_img 14.png 360 alt %}
右下の歯車アイコンをタップ→コンソールをタップします。

ExpressはUniFi OSというOSで動作しており、その中のNetworkApplication（UNA）というアプリが動作しています。基本的にはOSをアップデートすることで内包されているUNAも自動的にアップデートされます。

{% asset_img 15.png 360 alt %}

最新のUniFiOSにアップデートします。
このExpressは、UniFi OSはv3.2.5(Official)となりました。UNAはv8.0.28です。

今回は初回操作なので手動でアップデートすることにしましたが、毎日夜中3時に自動でアップデートチェックが行われ、自動でアップデートされます。また、Release Channelについては、"Official"(通常）、"Release Candidate"（リリース候補）、あとはUIアカウントのページから"Early Access"(ベータ版）を有効にすれば、3つのバージョンを選択できます。

> UI Account
 <https://account.ui.com/profile>

慣れるまではOfficialにしておくのがお勧めです。
Early Accessは事前確認する利用条件にある通り、守秘義務が存在します。許可なくその内容を第三者に開示してはいけません。安定しない場合も多く、広くユーザーに互換性を確認してもらうためのものです。

さて、ここまでで初期セットアップは完了です。

## 速度チェック

気になるSpeedtestです。まずはiPhoneでWi-Fiのテストです。
{% asset_img 16.png 360 alt %}

MTUも何も調整することなく、全くノーマルな状態での実行ですが、十分過ぎる速度です。本体の発熱も少なく、ほんのり暖かい程度です。
5GHzで160MHzの帯域を使うのであれば、以下の速度が出ます。
{% asset_img 16-1.png 360 alt %}

有線とWi-Fiとは一般的に速度差があるので、ネットワーク機器はフローコントロールを有効にするのが普通で、遅いWi-Fiに合わせて有線側を”待たせる”仕組みが必要ですが、ここまで有線とWi-Fiとの速度差が無いとフローコントロールを有効にする必要がありません。
実際問題、フローコントロール無しでパケットのドロップが少ないのであればそれが一番効率よく通信でき、速度が出ます。
上記のSpeedtestはフローコントロール無しでの結果です。

Zero wait DFSという機能があり、DFSを回避できる機能もあるようですが、私の環境でタイミング良くレーダーが発生するわけでもなく、この検証は行えませんでした。

続いてLANケーブルでPCに繋いでみます。MinisforumのUM790Proは最近人気のミニPCですが、Expressはそれより1回り小さいです。
{% asset_img 17.png 640 alt %}

1Gbpsの帯域をしっかりと使えています。小型ながら性能は大したものです。

## セットアップの補足

私の環境（auひかり）ではとても簡単にセットアップが完了しました。なお、Expressは現在、Officialリリースにおいてインターネットマルチフィード社が提供するtransix IPv4接続 (DS-Lite) への対応はされていますが、その他のIPv4 over IPv6の対応は現時点でサポート外となっています。

日本国内の大半がIPv4 over IPv6というわけでもなく、CATVやマンションが提供するLANなども鑑みると、シンプルにExpressを活用できる場所はたくさんあります。

Expressに関するガイドを以下に記載します。

- ネットワークが不安定、Lineなどでやり取りができなくなる。
 以下のガイドにMSS Clampingの設定で解決するという投稿がありますので確認ください。
 Facebook Ubiquiti日本公式コミュニティ
 <https://www.facebook.com/groups/uijapan/learning_content/?filter=167949146143924&post=3507234616157550>
 この設定についてはExpressにブラウザでログインし、WANのMSS Clampingの値をCustomの1414等に設定する必要があります。具体的な設定はISPにより異なります。

- IPv6 IPoE transix IPv4 (DS-Lite)の設定手順｜Ubiquiti UniFi
 <https://note.com/ui_japan/n/n3154ff641db5>

インターネットマルチフィードのDS-Liteは以下のISPが対象となります。

- 株式会社インターネットイニシアティブ
 IIJ IPv6 FiberAccess/Fサービス タイプIPoE
- 株式会社インターネットイニシアティブ
 IIJmioひかり
- 株式会社インターネットイニシアティブ
 IIJmio FiberAccess/NF
- 株式会社インターリンク
 ZOOT NATIVE
- エキサイト株式会社
 excite MEC光
- エキサイト株式会社
 BB.excite光Fit
- エキサイト株式会社
 BB.exciteコネクトIPoE接続プラン
- スターティア株式会社
 マネージドゲート2
- メディアウェイブシステムズ株式会社
 Hybrid64 (ハイブリッド・ろくよん）
- メディアウェイブシステムズ株式会社
 メディアひかり

（引用： <https://www.mfeed.ad.jp/transix/customers/>）

PPPoEやIPv4 over IPv6など、既存インフラの課題を頑張って解決する接続方式よりも、普通にIPv4、IPv6それぞれデュアルスタックで接続できるISPを選択するのが一番シンプルだと個人的には思います。PPPoEで、MTUからTCPヘッダおよびIPヘッダを除いたMSS1460バイトを1414バイトに詰め直すというのは、CPU負荷を高める原因となります。また、IPv4 over IPv6の接続では、IPアドレスとポートを他のユーザーと共有するため、固定IPアドレスが使用できず、割り当てられたポートしか開放できません。

## auひかりのIPv6

### HGWの設定

さて、いくらExpressが簡単と言っても、Ubiquiti製品を選びたいというユーザーはやはりIPv6は使いたいと思われているでしょう。グローバルの一般的なIPv6の割り当て方法がUniFiにはあります。auひかりのユーザーはとても簡単にIPv6に接続できます。ここは少しだけ設定が必要です。なお、ここでのHGWの設定はあくまで戸建向けの光回線での実例です。

auひかりのHGWにブラウザでログインし{% label primary @DHCPv6サーバ設定 %}をタップします。
{% asset_img 18.png 360 alt %}

続いて、IPv6アドレスの割り当て方法を選択します。
{% asset_img 19.png 360 alt %}

Express向けにはいくつかの組み合わせが可能ですが、設定が3つあるうち設定2または3を選びます。
設定2ではIPv6アドレス＋DNSをDHCPv6で、PrefixをRAおよびDHCPv6で配布する方法です。DNS情報はDHCPv6で渡すのでRAオプションのDNSアドレス通知は使いません。設定3はPrefixをDHCPv6で配布します。デフォルトゲートウェイはRAの送信元から導きます。ここでは詳細の説明は割愛します。

最後に画面上部にある保存ボタンをタップして設定を保存してから、HGWはログアウトします。

### Express WANの設定

スマホアプリの右下の鍵マークアイコンの設定から{% label primary @インターネット %}→{% label primary @Primary(WAN1) %}→{% label primary @高度な設定 %}→{% label primary @手動 %}→{% label primary @IPv6接続先 %}のトグルを有効に、{% label primary @DHCPv6 %}を選択し、{% label primary @プレフィックス委任サイズ %}を**64**にします。

{% asset_img 20.png 360 alt %}

{% asset_img 21.png 360 alt %}

あれ？と思った方、そうなんです。auひかりの委任は64ビット（サブネット1つだけ）なんです（ひかり電話を契約していても）。実はExpress以前に自分の使っている他社製ゲートウェイで確認したところ、/64しか委任で貰えないようなんです。その製品のサポート担当者からは64ビットのような特殊な委任はサポート外と一刀両断されました。そりゃそうですよね。委任するというくらいなんだから最低でも60ビット（/64を15個）など複数のサブネットがあるのが普通です。auひかりには「複数のIPv6サブネットの委任をできるようにお願いします」とは昨年秋に伝えましたが。。。

いずれにしても今回はExpressの世界、本格的な複数サブネット（VLAN）はまた今度にするとして、まずはシンプルなネットワークを作ることに専念しましょう。

ちなみに、HGWのLAN側IPv6アドレスは以下が割り当てられていました。
{% asset_img 21-1.png 360 alt %}

`240f:xxxx:xxxx:1::/64`ではない別のPrefix1つが割り当てられることになります。

### Express LANの設定
ExpressのLANのIPv6設定はブラウザ経由でなくてはなりません。
EXpressにブラウザでログインします。
`https://unifi/` または`https://192.168.1.1`
{% asset_img 22.png 360 alt %}

ログイン後、画面右上の歯車アイコンをタップし、LANの設定に入ります。
スマホのキャプチャでは視認性が悪いので、ここではPC画面で項目の説明をします。
{% asset_img 23.png 640 alt %}

IPv6のタブを選択し、{% label primary @Prefix Delegation %}を選びます。
基本的には上記の画面キャプチャの通り、{% label primary @WAN1 %}インタフェースを選択します。
{% label primary @Client Address Assignment %}は趣味の範疇ですが、Expressが決定するアドレスにするならDHCPv6を、クライアントに任せるならSLAACを選びます。最近はSLAACでもMACアドレスベースに生成するのではなく、一時アドレスとしてクライアント側がIPアドレスを都度生成するので、IPアドレスを追跡できなくなりセキュリティ上は良いと言われています。但し、自身の管理としてログからは端末を判別しづらくなります。

これで設定はOKです。

### 接続テスト

IPv6確認テストサイトで確認しましょう。

{% asset_img 24.png 800 alt %}

問題なくIPv6で到達できているようです。HGWのPrefixは`240f:xxx:xxx:1::/64`でしたが、今回のPrefixは`240f:xxx:xxx:2::/64`となっており、パブリックIPv6アドレスがExpressに委任され、Expressからクライアントに配布されています。

> test-ipv6
 <https://test-ipv6.com>

これで一通りのセットアップは完了しました。UniFiスマホアプリは外出時に公衆回線からUbiquitiのクラウド経由でExpressに接続可能です。HGWのポート開放は必要ありません。後述するTeleportの技術を使っていてUbiquitiクラウドが接続管理、認証、通知などの役割を担ってくれます。これは無償のハイブリッドクラウド環境ですが、これこそがUbiqiutiが好まれる理由の1つです。

## Expressの機能/設定

必要な機能をPickupして見ていきます（多機能でとても全ては紹介しきれません）。トラフィック識別や、広告ブロックのフィルタリング状況はネットワークの見える化としてUbiquiti製品の特徴です。説明不要でグラフィカルで分かりやすいでしょうから、ここでは説明を割愛します。

管理画面ログイン後、左上のOSセッティングから{% label primary @Console Settings %}に進みます。
{% asset_img 25.png 800 alt %}

詳細の確認やトラブル対応の対策にSSHは事前に有効にしておきましょう。UNAにもSSHの設定がありますが、そちらはExpressが管理する配下のデバイスが対象であり今回は設定しません。

サポートとのやり取りで「サポートファイルが必要」となれば、画面最下部の{% label primary @Download Support File %}から詳細ログをダウンロードし、UI Japanに送ることになります。

### プッシュ通知

任意設定ですが、アプリの歯車アイコンから{% label primary @プッシュ通知 %}を有効にしておくといくつかの通知を受けられます。
{% asset_img 27.png 360 alt %}

障害などの重要なものはデフォルトで含まれています。それ以外にも、VPNの接続があったら通知する、レーダーを受信すると通知するなどいくつかの追加選択が可能です。

### 広告ブロック

UNAの設定（歯車アイコン）から、{% label primary @セキュリティ %}を選択します。
ここでは{% label primary @広告ブロック %}にチェックしておきます。広告ブロックはExpressにおいては、1つのネットワークのみ選択可能です。IPv6を有効にしていても広告は綺麗に消えますのでかなり有効です。
DNSシールドはDNSによる名前解決時にDoH（DNS over HTTPS）を使い、GoogleまたはCloudflareで名前解決するものです。TLS/SSLで暗号化されているので、プロバイダや途中の経路において、どこにアクセスしているのか判らないようにする目的があります。日本のISPはDDoS対策のために独自のDNSフィルタを実施していることや、その情報を売却するなどの行為が厳しいために日本においてはDNSシールドの重要性はあまり無いものと考えられます。
なお、このDNSフィルタを使っていても、広告ブロックは有効です。Expressは広告ドメインを対象にDNSで排除します。

通常は、以下のクエリを返します。
``` bash
$ nslookup www.googleadservices.com
Server:		240f:xxxx:xxxx:2::1
Address:	240f:xxxx:xxxx:2::1#53

Non-authoritative answer:
Name:	www.googleadservices.com
Address: 172.217.xxx.xxx
```

DNSフィルタを有効にすると。。。
``` bash
$ nslookup www.googleadservices.com.
Server:		240f:xxxx:xxxx:2::1
Address:	240f:xxxx:xxxx:2::1#53

Name:	www.googleadservices.com
Address: 0.0.0.0

```

0.0.0.0を返すのでアクセスできなくなります。
控えめな広告であれば私は許容できるのですが、日本特有というか酷い内容の広告は徹底して除外したいものです。今のところExpressは綺麗に広告をカットしてくれています。

## Teleport(VPN)

まず、UniFiアプリでTeleportを有効にします。招待のリンクを生成します。
{% asset_img 28-1.png 360 alt %}

UniFiアプリの設定（歯車アイコン）からWiFimanをインストールし、起動すると右下にTeleportというアイコンがあります。それをタップします。
{% asset_img 28.png 360 alt %}

上記画面が表示されたら**On**をタップし接続開始するだけです。接続開始するまで10秒強掛かりますが、ポート開放無しにここまで自動でやってくれます。Teleport経由のSpeedtestは40Mbps弱で速いとは言えませんが、とてもお手軽です。

### Local DNS

さて、上記で自宅にVPNで接続できるようになりました。自宅に接続するというのは、そもそもNASやサーバーがある事が前提です。自宅内はローカルのDNS、hosts、NetBIOSでの名前解決を、外からはパブリックのIPをダイナミックDNSで管理し運用されていらっしゃる方も多いでしょう。
例えば私はSynologyのDDNSを取り敢えず利用する事にはしていますが、実際に公衆回線からパブリックIPを通して接続はしていません。単純にローカルDNSで、xxxx.synology.meというSynologyから与えられたホスト名＋ドメイン名（FQDN）で自宅ではアクセスしています（Synologyのスマホアプリもその名前（FQDN）を使います）。これはTLS/SSL証明書とも関係ありますし、あまり自由な名前にできません。アプリのプッシュ通知による2要素認証もありますし、証明書のエラーになっていては自宅に接続できても使い物になりません。
UniFiには、Local DNS機能が存在しており、固定IPと名前とをセットで登録できます。

{% asset_img 29.png 1024 alt %}

上記の右の赤枠のように、FQDNとプライベートの固定IPアドレスを設定しておきます。NASがDHCPでExpressにIPを要求すると、この固定IPアドレスとローカルDNSへの登録が自動で行われます。

{% asset_img 30.png 360 alt %}

自宅、外出時のFQDNを統一できることで2要素認証のプッシュ通知、パスワードマネージャーからのID/パスワード入力も極めてスムーズです。
Express1台でここまで便利に使えるようになります。

{% asset_img 31.png 1024 alt %}
> UI Japan Store Express 
https://jp.store.ui.com/collections/unifi-network-unifi-os-consoles/products/ux

価格は26,900円です。

## 補足説明

私のHGWはBL3000HMという機種です。
- {% post_link bl3000hm %}

> Ubiquiti Japan ホームページ
 <https://note.com/ui_japan>

> Ubiquiti ヘルプセンター
 <https://help.jp.ui.com/categories/6583256751383/>

> Ubiquiti コミュニティ（日本）
 <https://www.facebook.com/groups/uijapan>

> Ubiquiti Community（米国中心）
 <https://community.ui.com/>


（製品提供：Ubiquiti Japan株式会社）