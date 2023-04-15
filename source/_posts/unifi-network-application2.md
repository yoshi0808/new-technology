---
title: UniFi Network Applicationの運用
date: 2022-10-23T19:38:49+09:00
tags:
- UniFi
categories:
- Network
---
{% asset_img unifi1.png 1024 alt %}

<p class="onepoint">この記事で実現すること</p>

前回記事「{% post_link unifi-network-application %}」では、UniFi Network ApplicationをUbuntu上にセットアップし、UniFiネットワーク製品の登録（Adoption）までを行いました。この記事ではホームユーザーがUniFi製品を運用していくにあたり、必要な操作ができるようになることを目的としています。
<!-- more -->

## 日本語ガイド

セットアップが完了し、運用開始するにあたり、日本の公式のガイドとして以下のリソースがあります。

> UniFi - アップデート
 <https://help.jp.ui.com/articles/7605005245975/>

> 接続の課題などのFAQ
 <https://help.jp.ui.com/articles/7258465146519/>

## UniFiデバイス一覧およびアップデート

`https://UniFi Network Application Host:8443/`に接続すると左にカテゴリのアイコンが並びます。以下のように左の赤枠で囲った{% label primary @UNIFI DEVICES %}一覧では現在のAdoptされているUniFi機器の一覧が確認できます。

{% asset_img u1.png 1024 alt %}

バージョンアップの通知があれば、ここで{% label primary @Click to Update %}のように表示されますので、これをクリックしてデバイスのアップデートが行えます。
リリースの情報については本国のCommunityを参照することになります。

> UniFi リリース一覧
 <https://community.ui.com/releases/>

{% asset_img rel.png 1024 alt %}

ここでは、{% label primary @Official %}または{% label primary @Release Candidate(リリース候補）%}と区分されています。Network Applicationの初期設定では、Officialのものが自動的にアップデートされる仕組みになっています。後に説明する設定画面で、Official,Release Candidate,Early Accessと3つの区分を選択可能です。

実際のリリースのポストを参照すると先頭には簡単なリリースノーツが記述されており、それ以下でユーザーによるレポートが続きます。前回も記載しましたが、マニュアルがないことや製品提供機能やUbiquitiの今後の方向性があまり見えてこないこともあり、他のプロダクトと比較しても、ユーザーからは辛辣な意見が寄せられる事が多いです。単なる不満（ユーザーのスキル不足や、製品への過剰な期待や思い込みが原因である事も多いように感じられます）の投稿によって重要な情報を見失わないようにすることが大事です。詳細な検証結果など貴重な情報を提供してくれるユーザーも存在しています。

デバイスを選択すると個々のデバイスのトラフィック状況などが確認できます。{% label primary @Settings %}に進むとバージョンアップや再起動、ファームウェアのロールバックなどが実行できます。また、デバイスをリセットする場合や他のネットワークに使う場合は、{% label primary @Forget %}を選択します。

{% asset_img u2.png 360 alt %}

ファームウェアをロールバック（ダウングレード）する場合は、該当製品のファームウェアバージョンのURLを指定します。ここで説明している使い方は、Ubiquitiクラウド連携を前提としており、UniFiネットワークアプリケーション、スイッチ共にインターネットへ接続可能である必要があります。リリース一覧は以下のURLから確認します。

> UniFi APなど
<https://www.ui.com/download/unifi/>

> UniFi スイッチ
<https://www.ui.com/download/unifi-switching-routing>

{% asset_img dl.png 1024 alt %}

左メニューのプルダウンから製品を選択すると以下のように最新バージョンが表示されます。ここから{% label primary @PAST FIRMWARE %}を選択し、具体的なバージョンを指定してから、ダウンロードを選択するとURLが示されるので、そのURLをネットワークアプリケーションのデバイスのURLに貼り付け、Updateを実行します。

{% asset_img rel1.png 800 alt %}

ここまでの作業はスマホアプリ（UniFi Network）でも同様の操作が可能です。

## 　クライアントデバイス一覧

以下のように左の赤枠で囲った{% label primary @CLIENT DEVICES %}では現在のUniFiネットワークに接続されているクライアント一覧が確認できます。

{% asset_img u3.png 1024 alt %}

ここではIPアドレス、クライアントが所属するVLAN、接続しているWi-Fiの情報、トラフィックなどが確認できます。もし、UniFiのL3スイッチがあれば、L3スイッチにDHCP機能があるので、この画面からスタティックIPアドレスを設定可能です。

この画面もスマホアプリで同様の操作と確認ができます。

## 　設定

以下のように左の赤枠で囲った{% label primary @SETTINGS %}ではUniFi製品群の全般的な設定をします。なおこの記事のUniFiの構成では、UDM Proなどのセキュリティゲートウェイを保有していない状態であり、単独のUniFi Network Applicationの設定例となります。以下の左側メニューの{% label primary @Internet %}、{% label primary @VPN %}、{% label primary @Traffic Management %}、{% label primary @Firewall & Security %}は対象外です。

{% asset_img u4.png 1024 alt %}

### WiFi

WiFi設定では名前、所属するVLAN、チャンネルなど設定します。UniFiは集中型管理であるため、個々のAP毎に設定するよりはネットワーク全体でどのように管理するかを決めるモデルとなります。

- Global AP Settings
 この設定で、複数APを立てることを想定し、全般設定を行います。

- Channel Width
 2.4GHz、5GHzそれぞれでバンド幅を設定します。ここは個人の好みによりますが、一般的なデバイスのために2.4GHzは20MHzを、5GHzでは80MHzを設定することをお勧めします。もちろん、PCなども無線でできるだけ速度を求める方は160MHzの設定が可能です。こういった場合は、AP単位にバンド幅を個別設定し、クライアント単位に接続させるAPを固定させる事ができます。

 - Transmit Power
 無線の送信出力を決めます。Auto/High/Medium/Lowが選択できます。

- AP Site Settings
 Wiress Meshingの項目がありますが、メッシュ製品（無線によるバックホール接続）は現在日本では発売されていません。

- Nightly Channel Optimization
 夜間に外部のWiFiの電波状況を見ながらUniFi側でWiFiチャネルの最適化を行います。比較的近い距離で同一のチャンネルを選択していると競合することになるのでこれは実際にテストしながら選択されることをお勧めします。

これより詳細のWiFi設定についてはまた別の機会があれば書きたいと思います。

### Networks

Networksでは主にVLANとスイッチの全般設定をします。

{% asset_img u5.png 1024 alt %}

今回の記事は概要に留めますが、VLANを構成する場合にはスイッチ単位ではなく、ネットワークアプリケーションでネットワーク全体の構成を決めることになります。もし、UniFiのL3スイッチがあり、L3ネットワークにするのであれば、L3のDHCPを有効にします。L3スイッチがない場合で単にL2のVLANを作成する場合は、{% label primary @VLAN Only Network %}としてVLANを作成し、ルーティングやDHCP機能はFirewallやルータに任せることになります。

一旦ネットワークアプリケーションでVLANを定義すると、どのスイッチからもそのVLANが利用できるようになります。

以下はFirewallを利用する場合の一例です。インターネット接続がホームゲートウェイとなる場合、もちろんFirewallとHGWとを直結しても構いませんが、トラフィックを把握するためにVLANを定義し、FirewallのWANとHGWとをスイッチに接続します。こういった場合にはUniFiスイッチではFirewallの外側（ホームゲートウェイ側）と内側（LAN）のネットワークとを分離するため、VLAN OnlyでWANのVLANを作成することになります。

{% asset_img switch.drawio.png 480 alt %}

UniFiネットワークの初期設定ではVLANが無い状態であり、”ALL”というプロファイルになります。これは全てのVLANを転送するPortになります。セグメントを分離する場合は、ALLを使わず、Defaultに加え、WAN、管理用という具合にそれぞれの独立したネットワークを作成することになります。マルチプルVLANを使う場合にはALLプロファイルを使います。一般的な個人向けのルータを使い、シンプルに一つのセグメント（例えば192.168.1.x/24）だけがある環境で、自宅用と会社用との端末の相互アクセスを禁止する場合はマルチプルVLANは便利です（この場合はルータをALLプロファイル、自宅用の端末はDefault、会社用端末はVLAN1という具合に分離します）。

ESXiなどでLAN用に複数の物理Portが存在する場合、仮想マシンを使うセグメントと仮想マシンのバックアップ用（NAS）LANとトラフィックを分離するのも一つの使い方です。

- Global Network Settings
 ネットワーク設定全般を行います。スイッチの共通設定部分になります。

- Multicast DNS
 Apple AirPlayやGoogle Chromecastのためにネットワークセグメントを超えてmDNS(Bonjour)の名前解決およびデータ配信を支援します。

- IGMP Snooping
 本来は、マルチキャストトラフィックを使っていないクライアントに対してはパケットの転送を抑制するためのものですが、スイッチでPackets Discardedのカウンタが増えるのが気になり私は無効にしています。WiFiネットワークがあるセグメントにひかりTVなど、対象セグメントに一定量のマルチキャストトラフィックを流すのが気になる場合はセグメントをVLANで分離する方がお勧めです。

- Global Switch Settings
 複数スイッチの共通設定を指定します。主には、Flow Control、Jumbo Framesがあります。また固有のスイッチだけフローコントロールを外すとか個別設定が可能なように、{% label primary @Switch Exclusion %}から該当するスイッチを選択できます。

### System

Systemでは主にネットワークアプリケーション全般設定をします。

{% asset_img u6.png 1024 alt %}

{% label primary @Network Notification %}で通知設定ができます。これはメール、スマホアプリへの通知、ネットワークアプリケーション画面上での通知が選択できます。ファームウェア通知、APのレーダー受信、クライアントの接続/切断通知など設定項目は多岐にわたります。

その他主要項目を抜粋します。

- Updates
 ここではデバイスのファームウェア情報についての設定です。ネットワークアプリケーション自身のアップデートがある場合、デバイスのアップデートがある場合は通知できます。ここで接続チャネル（Officail/Release Candidate/Early Access）が選べます。なお、ネットワークアプリケーションはインストールで実施したようにShellスクリプトで実施することになります（後述します）。

- Device Auto Updates
 デバイスを自動的にアップデートするか選択します。最新ファームウェアが公開されると時刻に関係なくアップデートされるので、ここはオフに設定し、{% label primary @Schedule Device Updates %}で週末などにアップデートする設定を追加することをお勧めします。
 {% asset_img u7.png 240 alt %}

- Backup
 ネットワークアプリケーションの設定のバックアップです。日次、週次、月次でバックアップ可能です。トラフィックログも併せてバックアップが可能です。

- System Logging
 デバイスのログをsyslogに転送できます。syslogサーバのIPアドレスとPort（一般的に514）を設定します。

- Network Device SSH Authentication
 スイッチやAPに対しSSH可能です。スイッチの詳細なカウンタを取得するために必要です。カウンタのエラーが無いか、切断回数などを確認するために使います。パスワード認証または公開鍵を設定することでUniFiデバイスへ接続可能になります。
 {% asset_img u8.png 480 alt %}

- Other Configuration
 NTPの設定、メールサーバーの設定ができます。メールサーバーはCloudを選択するとUbiquitiクラウドからメール通知が行われます。

## Network Applicationのバージョンアップ

Network ApplicationはこのGUIから更新することはできず、前回記事「{% post_link unifi-network-application %}」で説明したLinuxのシェルからアップデートスクリプトを実行することになります。Windows、macOSでお使いの方は最新モジュールをダウンロードし、セットアップを実行することになります。ここではUbuntuのアップデートの例を記載します。

スクリプトの情報は、コミュニティにあります。
<https://community.ui.com/questions/UniFi-Installation-Scripts-or-UniFi-Easy-Update-Script-or-UniFi-Lets-Encrypt-or-UniFi-Easy-Encrypt-/ccbc7530-dd61-40a7-82ec-22b17f027776>

セットアップで失敗した際にすぐに戻れるように、このタイミングでESXiのスナップショット、またはバックアップの取得をお勧めします。

実行は3ステップです。Ubuntuの{% label primary @端末 %}から、以下のコマンドを実行します。

1. 管理者になります
``` bash
$ sudo -i
```

2. 証明書などのダウンロードをします。
``` bash
$ apt-get update; apt-get install ca-certificates wget -y
```

3. ネットワークアプリケーションのアップデートを行います。
``` bash
$ rm unifi-update.sh &> /dev/null; wget https://get.glennr.nl/unifi/update/unifi-update.sh && bash unifi-update.sh
```

上記のCommunityでは、個別のバージョンのスクリプトシェルへのリンクもありますので、unifi-updates.shの代わりに、バージョンを指定したスクリプトでインストールすることもできます。ロールバックは対応していないとの情報があるので、私はESXiでのバックアップを保存するようにしています。

日本語ガイドにもアップデートに関する言及があります。

> UniFi Network - 他社製の非コンソールUniFi Networkアプリケーションをアップデートする（Linux - 高度）
 <https://help.jp.ui.com/articles/220066768/>


## リソース

以下の日本語ヘルプ、コミュニティがUniFiの構築には大いに参考になります。

> Ubiquiti コミュニティ（日本）
 <https://www.facebook.com/groups/uijapan>

> UI 日本語ヘルプ記事
 <https://help.jp.ui.com/categories/6583256751383/>

> Ubiquiti Community（米国中心）
 <https://community.ui.com/>
