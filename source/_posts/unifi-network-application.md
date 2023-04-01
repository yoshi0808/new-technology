---
title: UniFi Network Applicationのセットアップ
date: 2022-09-23T10:00:00+09:00
tags:
- UniFi
categories:
- Network
---

{% asset_img unifi1.png 1024 alt %}

<p class="onepoint">この記事で実現すること</p>

米国Ubiquiti（ユビキティ）社のUniFi製品であるネットワークスイッチ、Wi-Fiアクセスポイントを利用するには、管理コンソールとしてUniFi OS ConsoleまたはUniFi Network Applicationが必要となります。UniFi Network ApplicationはUbiquitiより無償提供されており、管理・運用においてはUniFiクラウドサービスと連携します。一般的にはこのようなサービスはサブスクリプション費用が必要ですが、この費用も掛かりません。UniFi製品はネットワークの見える化に特化しているため、管理コンソールの24時間稼働が理想です。最初からハード組み込みのセキュリティ機器（UniFi Security Gateway等）やUniFi Cloud Keyを購入すればすぐにUniFi製品を使い始めることができますが、これらのハードウェアを購入しなくとも、ネットワークやLinuxの知識がある人はUniFi Network Applicationをセットアップし、使い始めることができます。
<!-- more -->

## UniFi Network Applicationのセットアップの前提

「{% post_link ubiquiti-unifi %}」ではUniFiの機能全般を説明しました。UniFi Network Applicationをセットアップする以前に製品の情報やアップデートの情報は全てUbiquitiの提供するCommunityから入手します。英語のコミュニティサイトではSOHOなどのユーザーはUDM Proなどのセキュリティゲートウェイに、スイッチ、APを組み合わせているケースが多く見られます。スイッチユーザーは、もう少し大きな規模のユーザーがネットワークアプリケーションをLinuxで構築しているユーザーが多いように見えます。実際に顧客にサービスを提供しているSIerやエンジニアの参加もあります。コミュニティの情報・不具合などの割合から見ると、ネットワークアプリケーションの機能とスイッチの情報が圧倒的に多いように見え、セキュリティゲートウェイの質問やセキュリティそのものに関する技術的な内容は少ないように見えます。

手っ取り早くUniFi機器を稼働させるには、Windows、macOSのUniFi Network Applicationをセットアップし、動作させることです。

基本的には24時間稼働させ、スイッチ/APからリアルタイムで情報を収集したり、スイッチ/APに必要な動作を指示するのがConsole/Network Applicationの役目です。Linux上（Debian/Ubuntu）にセットアップされるケースが多いようです。わざわざLinuxのセットアップをするのは手間だと思えますが、運用を継続することを考えると、Linuxへのセットアップがお勧めです。また、バックアップや設定変更で動作しなくなった時のロールバックを考えると仮想環境（ESXi）にセットアップされることをお勧めします。Ubuntuの最新バージョンであるUbuntu22.04LTSはサポート期間が2027年までと十分長い期間があります。UniFiのためのUbuntuのセットアップ記事は「{% post_link ubuntu22-04lts %}」を参照してください。

ローカル環境のみのアクセス（オンプレミス）、リモート（スマホアプリ）から管理可能なハイブリッドクラウド方式がありますが、ここではハイブリッドクラウド方式で進めます。クラウドはUbiquitが提供する無償のサービスです（※有償のUbiquitiクラウド管理の方式もあります）。基本的には機器のCPU、メモリ使用量、温度管理に加え、スマホへの通知やリモートによる機器のリスタート、アップグレード、高い利便性があります。

UniFiはAppleのiPhoneのように説明書が無くても使えることを目標にしているのでしょうか。難しいスイッチなどのコマンドラインを必要としませんが、マニュアルというものがありません。コミュニティにはUbiquitiのサポートスタッフも発言していますが、コミュニティが貴重な情報源でもあります。操作が不明な場合や不具合かなと思った場合は、まずコミュニティで検索することから始まります。

### UniFi Networkのリモートアクセス

Requirementとして以下のドキュメントがあります。

> UniFi Network - Remote Access Requirements
 <https://help.ui.com/hc/en-us/articles/115012240067-UniFi-Network-Remote-Access-Requirements>

説明は至ってシンプルです。UIシングルサインオンアカウント、インターネットに接続されているネットワークアプリケーションホストが必要とあります。
よくあるトラブルとしては、Port解放の問題、DNS、NTPへの接続が必要という項目があります。また、コミュニティのリリースポストを参照してほしいとあります。

UniFiの環境は慣れるまでは理解するのが大変ですが、その世界観を理解できれば1つ1つは難しくありません。

### UIシングルサインオンアカウントの作成

早速、Ubiquitiのシングルサインオンアカウントを作成しましょう。アカウントの作成は無償です。

<https://account.ui.com/register>

ユーザー名、メールアドレス、パスワードが必要です。ユーザー名は他のユーザーと重複しない名前が必要です。一度決定するとこのユーザー名でローカル環境もログインする事になります。

{% asset_img unifi4.png 360 alt %}

登録が完了すると以下の画面になります。
{% asset_img unifi6.png 360 alt %}

登録したメールアドレスに”Email Verification”が行きますのでVerifyしてください。

## UniFi Consoleの要件

- 2 GHz dual core processor(2vCPU)
- 4 GiB RAM (system memory)
- 64 GB Disk

UniFi Network Applicationに対してはユーザーからのWebサービス、スイッチからネットワークアプリケーションへの接続などがあり、いくつかのサーバーPortをオープンしておく必要があります。Ubuntuと言われるとWindows上のWSL2を思い浮かべますが、WindowsOS上にPort Forwardの設定を行う必要があり、通常のUbuntuより余計な手間が掛かるためWSL2はお勧めしません。

UniFi Network ApplicationではMongoDB3.6/Java8を使います。MongoDB3.6は2021年4月で既にEOLを迎えています。Java8は古いプロダクトではありますが、2030年まではサポートされることが言及されています。これらのミドルウェアの利用はアプリケーション内部の組み込み型モジュールとして考えるべきでもあり、セキュリティの観点からは可能な限りUbuntu上の公開ポートを制限すべきです。従い、UbuntuはUniFiネットワークアプリケーション専用として利用し、必要なPort以外は閉じます。

実際のインストールは有志が作成した素晴らしいシェルスクリプトが公開されており、悩むことなくセットアップは完了します。

UniFi Network Applicationのバージョンアップはインストール同様にシェルスクリプトを動作させます。また、UniFi Network Applicationはロールバックに対応していないため、何か問題があった場合に旧環境に戻すにはアンインストール、インストールをするかESXiのレベルでスナップショットからの戻し、または仮想マシンごとのバックアップからの戻しをします。ESXiによるOSのロールバックは非常に手軽なため、万が一の際はOSレベルでのレストアが早く確実です。

> Oracle Java
 <https://www.oracle.com/jp/java/technologies/java-se-support-roadmap.html>
 オラクルは今後も、 java.comで、個人ユーザー、開発ユーザー、およびその他のユーザーに、Java SE 8の無償の公開アップデートと自動アップデートを無期限に提供します。

> MongoDB
 <https://www.mongodb.com/support-policy/lifecycles>

## Ubuntuの事前準備

ここでは「{% post_link ubuntu22-04lts %}」で記載したようにUbuntuがESXi上にセットアップされ、ESXiのUbuntuにVMware Remote Consoleで接続して操作する事を前提としています。ESXiのWebUIにログインし、Ubuntuの仮想マシンに対してVMRCで接続するか、ブラウザから、`vmrc://ユーザー名@esxiのホスト名/?moid=[仮想マシンのID]`で接続します（VMRCウィンドウが起動します）。クライアントへのVMRCのインストールはESXiのWebUIからダウンロードできます。

### Ubuntuの固定IPアドレスの設定

UniFiの機器から、或いはWeb Consoleとして常に同一のIPアドレスに接続するために固定IPアドレス、またはDHCPの配布でmacアドレスを元に常に同じIPアドレスを配布するように設定します。Ubuntu上で固定IPにするには、{% label primary @設定 %}画面の{% label primary @ネットワーク %}で固定IPを設定します。

{% asset_img unifi15.png 640 alt %}

UniFi Network Applicationでは現時点でIPv4のみを利用しIPv6は未対応と考えてください。個々のスイッチ/APはもちろんIPv6通信に対応していますが、機器本体の管理をIPv4で行います。

### ufwの設定

UniFi Consoleで最低限のPortを開けるため、UbuntuのFirewallであるufwを設定します。Ubuntuの{% label primary @端末 %}を起動します。

``` bash
$ sudo ufw status
状態: 非アクティブ
$
```

ufwを有効にします。

``` bash
$ sudo ufw enable
ファイアウォールはアクティブかつシステムの起動時に有効化されます。
```

再度状態確認します。

``` bash
$ sudo ufw status
状態: アクティブ
$
```

{% note danger %}
ESXiやVMRCを使わずSSHで接続しufwを有効にする場合は、SSHポート（22/TCP)を許可しておかないと新しいSSHの接続ができません。再起動などのタイミングでSSHできず面倒になるのでご注意ください。なお、UniFi Network Applicationのセットアップ途中でSSHポートを開けます。
{% endnote %}

ufwを有効化しただけでは外部へ接続する方向へは制限しませんが、UbuntuのFirefoxでInternetに接続可能な状態である事を確認します。セキュリティ機器やFirewall機器で**Outbound通信**に厳密な管理をされている方は以下の記事を参考に必要なPortを開けてください。UniFi Network ApplicationのセットアップにはInternetへの接続が必要です。Internetから内部にポート解放する必要はありません。

> UniFi - Setting Up a UniFi OS Console
 <https://help.ui.com/hc/en-us/articles/4416276882327-UniFi-Setting-Up-a-UniFi-OS-Console>

## UniFi Network Applicationのインストール

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

3. ネットワークアプリケーションのセットアップを行います。
``` bash
$ rm unifi-latest.sh &> /dev/null; wget https://get.glennr.nl/unifi/install/install_latest/unifi-latest.sh && bash unifi-latest.sh
```
必要なモジュールをインストールし、最新のUniFi Network Applicationをインストールしていきます。何回かユーザーとコマンド上の対話があります。全て”Y”を回答します。

``` bash
# Do you want to keep the script on your system after completion? (Y/n)
```
"Y"を入力しEnterを押下します。

``` bash
# Do you want to proceed with updating your system? (Y/n)
```
"Y"を入力しEnterを押下します。その後いくつかのモジュールがセットアップされていきます。

``` bash
# Preparing for MongoDB installation...

# Adding key for MongoDB 3.6...
# Successfully added key for MongoDB 3.6!

# Running apt-get update...
# Successfully ran apt-get update!

# Installing mongodb-org version 3.6...

# Preparing OpenJDK 8 installation...

# Installing openjdk-8-jre-headless...

# Installing your UniFi Network Application ( 7.2.94 )...

# Downloading the UniFi Network Application...
# Successfully downloaded application version 7.2.94!

# Installing the UniFi Network Application...

# Would you like to update the UniFi Network Application via APT?
# Do you want the script to add the source list file? (Y/n)
```

"Y"を入力しEnterを押下します。

``` bash
# Is/will your application only be used locally ( regarding device discovery )? (Y/n)
```
あなたのアプリケーションはディスカバリにおいてローカル環境だけで使いますか？という質問ですが、これはスクリプトの中身を見る限りは、”Y"を選択しないと、ufwの10001/udpを開けないので、"Y"を選択します。10001/UDPを開けないとローカル環境のUniFi機器を見つけられません。AWSなどのクラウド上にネットワークアプリケーションをセットアップする場合、ローカルのUniFi機器を直接UniFi Network Applicationに向かわせる方法もあり、その場合はクラウド上のローカルネットワークに不要なポートを公開しないための設定と考えられます。

``` bash
# Do you want to add the required ports for your UniFi Network Application? (Y/n)
```
"Y"を入力しEnterを押下します。

``` bash
# Successfully added port 3478/udp to UFW.
# Successfully added port 8080/tcp to UFW.
# Successfully added port 8443/tcp to UFW.
# Successfully added port 8880/tcp to UFW.
# Successfully added port 8843/tcp to UFW.
# Successfully added port 6789/tcp to UFW.
# Successfully added port 10001/udp to UFW.

# Your SSH port ( 22 ) doesn't seem to be in your UFW list..
# Do you want to add your SSH port to the UFW list? (Y/n)
```
UniFiに必要なポートを開け、さらにSSHも開けますか？と聞かれるので"Y"を入力しEnterを押下します。

最後に以下の表示でスクリプトは終了します。

``` bash
# UniFi Network Application 7.2.94 has been installed successfully
# Your application address: https://192.168.xxx.222:8443

# UniFi is active ( running )

# Author   |  Glenn R.
# Email    |  glennrietveld8@hotmail.nl
# Website  |  https://GlennR.nl
```

とても素晴らしいシェルスクリプトです。Glenn R氏に深謝です。
最後の”Your application address:”にあるように、クライアントのブラウザから`https://UbuntuのIPアドレス:8443`に接続します。

## UniFi ネットワークアプリケーションのセットアップ

ここからはしばらくUbuntuは操作しません。WindowsやmacOS、スマホなどのクライアントから`https://UbuntuのIPアドレス:8443`に接続します。独自証明書のため、ブラウザのエラーが表示されますが、「危険を理解して進む」などをクリックして画面を開きます。UniFi Network ApplicationのSSL対応は別の機会に記事を書きます。

以下では規約に同意するチェックを入れ、"Next"で進みます。
{% asset_img unifi7.png 480 alt %}

ここでは、{% label primary @Switch to Advanced Setup  %}をクリックします。
{% asset_img unifi8.png 480 alt %}

{% label primary @Advanced remote and local access  %}では、以下のようにリモートアクセスとUIシングルサインオンアカウントのトグルスイッチをOnにした状態で"Next"で進みます。
{% asset_img unifi8-1.png 480 alt %}
UIシングルサインオンアカウントでログインします。
{% asset_img unifi8-2.png 480 alt %}

ここではバックアップを有効にします。
{% asset_img unifi8-3.png 480 alt %}

デバイスセットアップです。ここで新しいUniFiのハードウェアがネットワークアプリケーションのサブネット内で接続状態であれば、自動的に検出します。ただし、ネットワークアプリケーションで最初にネットワークアドレスを設定する必要があり、ここではデバイスのセットアップをせずに、"Next"で進みます。
{% asset_img unifi9.png 640 alt %}

WiFiセットアップです。UniFiのAPがある場合はここでWiFiセットアップが可能ですが、スキップし"Next"で進みます。
{% asset_img unifi10.png 640 alt %}

確認画面です。所在地である日本を選択し、"Finish"で完了します。
{% asset_img unifi11.png 800 alt %}

ここまで完了すると初期画面が表示されます。
{% asset_img unifi12.png 800 alt %}

## UniFi ネットワークアプリケーションの初期設定

最初にUniFiネットワークアプリケーションのネットワークアドレスと動作モードを設定します。
ネットワークアプリケーションの左下の歯車アイコンをクリックし、{% label primary @Networks %}を選択します。
{% asset_img unifi13.png 800 alt %}

最初のネットワークアドレスは"192.168.1.0/24"となっていますのでこれを修正します。
{% asset_img unifi13-1.png 480 alt %}

{% label primary @Auto Scale Network %}のチェックを外し、実際のルーターのLAN側IPアドレスを入力します。
{% asset_img unifi13-2.png 480 alt %}

続いて{% label primary @Advanced Configuration %}では、今回のようにセキュリティゲートウェイなどのUniFi Consoleがありませんが、デフォルトではセキュリティゲートウェイがDHCPを提供するDHCPサーバーモードとなっています。
{% asset_img unifi13-3.png 480 alt %}

ここでは、DHCPモードを"無し"にし、"Apply Changes"で変更を完了させます。
{% asset_img unifi13-4.png 480 alt %}

左側の丸い二重丸のアイコン（UniFiAPのシンボルです）からは、新しいUniFi機器のAdoptが可能な状態になっています。
{% asset_img unifi14.png 480 alt %}

Ubuntuを再起動後してみてください。再度ブラウザでUniFi管理画面にログインできること、UbuntuにSSH可能である事を確認しましょう。

これでUniFiネットワークアプリケーションの設定は一旦完了です。もちろんこの段階で検出したスイッチを採用（Adopt）できますが、管理の主体はスマホアプリで可能なため、スマホアプリをインストールしていきましょう。

## UniFi ネットワーク スマホアプリ

UniFiの使い勝手の良さはスマホアプリにあります。スマホアプリからUniFiネットワークアプリケーションを制御します。普段はスマホアプリがあれば大抵は事足ります。アプリストアから"UniFi Network/Ubiquiti Inc"を見つけスマホにアプリをインストールします。

- Apple iOS
 {% qrcode "https://apps.apple.com/jp/app/unifi-network/id1057750338" alt:"UniFi Network" title:"" UniFi Network %}
 <https://apps.apple.com/jp/app/unifi-network/id1057750338>

- Android
 {% qrcode "https://play.google.com/store/apps/details?id=com.ubnt.easyunifi&hl=en_US&gl=US" alt:"UniFi Network" title:"" UniFi Network %}
 <https://play.google.com/store/apps/details?id=com.ubnt.easyunifi&hl=en_US&gl=US>

ここではiPhoneで操作します。"Set up a New Device"をタップします
{% asset_img app1.png 280 alt %}

ネットワークを検索しに行きます
{% asset_img app2.png 280 alt %}

UniFi OS Consoleは存在していないので見つけられません。"Set up a connection by IP address"でUniFi Network ApplicationのIPアドレスを指定します。
{% asset_img app3.png 280 alt %}

UniFi Network ApplicationのIPアドレス、UIシングルサインオンアカウントのIDとパスワードを指定します。
{% asset_img app4.png 280 alt %}

しばらく経ってから、UniFi Network Applicationを見つけるので、"Proceed"をタップします。
{% asset_img app5.png 280 alt %}

無事ログインが完了し、早速Adopt可能なデバイスが表示されます。Adoptしてみます。"Set Up"をタップします。
{% asset_img app6.png 280 alt %}

"Next"をタップします。
{% asset_img app7.png 280 alt %}

デバイスを採用中です。しばらく待ちます。少し時間が掛かります。ここではデバイスの採用と最新ファームウェアのダウンロード、適用が行われます。
{% asset_img app8.png 280 alt %}

デバイスの採用が完了すると、以下の画面になります。"Go to Dashboard"をタップします。
{% asset_img app9.png 280 alt %}

Top画面です
{% asset_img app10.png 280 alt %}

UniFiデバイスの画面をタップすると、採用されたスイッチが見えます。
{% asset_img app11.png 280 alt %}

スイッチのPortの状況です。GbEでアップリンク（上流のネットワーク）に接続されています。
{% asset_img app12.png 280 alt %}

アプリの歯車アイコン（System）から"Network Application Configuration"を選択します。以下のHostname/IPとなっている場所にネットワークアプリケーションのIPアドレスを設定しておきます。
{% asset_img app12-1.png 280 alt %}

## UniFiネットワーク経由のログイン

UniFiスマホアプリを終了し、Wi-Fiをオフにしてから再びアプリを起動します。今度は"Log in to Your UI Account"をタップし、UIシングルサインオンアカウントでログインします。
{% asset_img app13.png 280 alt %}

接続に少し時間が掛かりますが、Ubiquitiのクラウド経由でローカルのUniFiネットワークアプリケーションに接続され、スイッチや接続されたクライアントの状態が把握可能となります。厳密にはUbiquitiクラウドからスマホのパブリックIPアドレスを取得し、UniFi Network Applicationからスマホアプリへの直接接続を行うようです。

## 2要素認証

ハイブリッドクラウドで外部からログインができるようになったので、2要素認証を設定します。ブラウザで`<https://account.ui.com/>`に接続します。

"My Security"をタップします。
{% asset_img verify1.png 280 alt %}

Multi Factor Authentication(MFA)をEnableにします。
{% asset_img verify2.png 280 alt %}

”UI Verify”アプリを選択します。
{% asset_img verify3.png 280 alt %}

UI VerifyアプリをダウンロードしAppを構成します。
{% asset_img verify4.png 280 alt %}

2要素認証が完了し、アプリが使えない場合のメールアドレスへの通知が2要素認証のバックアップとして利用されます。
{% asset_img verify5.png 280 alt %}

これで2要素認証が必須となり、UniFi Networkスマホアプリでは初回の認証時にUI Verifyアプリへのプッシュ通知が行われます。ユーザーが確認の応答を実施しログインが完了します。ローカル環境でブラウザなどからネットワークアプリケーションにログインする際や、UIアカウントサイトにログインする場合も2要素認証が求められ、UI Verifyアプリで応答する必要があります。

{% asset_img verify6.png 280 alt %}

## ufwのGUI

Ubuntuで今回設定したufwの設定を追加する場合、GUIによるツールを導入しておくと便利です。{% label primary @Ubuntu Software %}から"gufw"を探し、インストールします。
{% asset_img ubuntu1.png 640 alt %}

## セットアップの完了

ここまででUniFiのセットアップは完了です。ESXiのスナップショットを取得していらした方はスナップショットの管理から「すべて削除」し、一旦、Ubuntu全体のバックアップを取得される事をお勧めします。次の記事「{% post_link unifi-network-application2 %}」で、UniFi Network Applicationの運用全般（設定のバックアップ、アップデート、通知）を紹介します。
