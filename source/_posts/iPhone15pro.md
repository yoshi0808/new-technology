---
title: iPhone15 ProとWiFi6E
date: 2023-10-21 07:00:00
tags:
categories:
- [Hardware]
- [Network]
---

{% asset_img Title.png 1024 alt %}

<p class="onepoint">この記事で実現すること</p>
iPhone15 Proを購入しました。代表的なものはWi-Fi6Eへの対応ですが、色々なものに繋いだ所感を書いていきます。

<!-- more -->

## Wi-Fi 6E

ネットワークに興味がある方としては、iPhone15 Pro/Pro MAXがWi-Fi 6Eに対応した事が大きいですね。160MHz幅で接続可能です。 MacbookであればTimeMachineでバックアップの時間短縮できるなど明らかなメリットがあるのですが、スマホではそのメリットが感じにくいところではあります。撮影した4K動画のNASへのアップロードが短縮できることや、画面のリフレッシュ速度も向上し端末全体が高速化しているので、Webブラウジングもより快適に感じます。

- SpeedTest
{% asset_img speedtest.png 360 alt %}

- iPerf3
{% asset_img iperf3.png 360 alt %}

まずまずの速度が出ています。私の環境ではInternet向けにはFirewallが入っていることもあり、一般的にはもう少し速度が出るかもしれません。

なお、iOSに限らず、macOSでもそうなんですが、Appleデバイス全般の注意事項としては、Wi-Fi 6E単独のチャンネルでは安定せず、2.4GHz、5GHz、6GHz全てを有効にしたSSIDを作成する必要があります。

> Apple 製デバイスで Wi-Fi 6E ネットワークを利用する
 <https://support.apple.com/ja-jp/HT213433>

単独のWi-Fi6EではSpeedtestでも安定せず途中でテストが終了したり不安定です。これはMacbook Pro(2023)でも同じです。
6E単独で接続した場合は、iOSで以下の警告が表示されます。

{% asset_img ios.png 400 alt %}

制約のように見えますが、Wi-Fi6Eの電波の見つけ方の方法によってこのような挙動になります。Apple製品のように、必ずしもWi-Fi6Eのみに接続されていない5GHzの端末ともスムーズに連携するためには必要なのでしょう。

## Wi-Fi ローミング

Wi-Fiローミングというのは同一SSIDで異なるアクセスポイント（AP)に自動で切り替わることです。最近の無線ルーターではメッシュ機能を持つものが増えてきました。例えば、1階から2階に移動した時に近くにあるアクセスポイントに自動的に切り替わり、より快適に使えるようになるというものです。

このローミングについて説明しだすとかなり長くなるのでここでは簡単にiPhoneに関して説明します。
iPhoneはWi-Fiの電波が-70dBmを下回ると、他のAPにローミングしようとします（厳密には他のAPを探すという工程も含まれます）。その際、高速にローミングが行えるかどうかというのがスマホの使い勝手では重要です。

一般的にスマホがWi-Fiに繋がる場合は、無線に接続する際の認証が行われ、DHCPによってIPアドレスを割り当てるという手順が入ります。この手順をAPが変わるたびに実施していたのでは最低でも1秒程度の切断が発生します。つまり通話中にフロアを移動していると途中でパケットの再送が入りますが、IPアドレスの再取得をやっていたのでは通話、アプリが切断されることになります。これらに対処するものが高速ローミングです。

高速ローミングは認証情報がキャッシュされることが必須です。私たちが一般的に使うようなSSID毎のパスワードであったり、企業で使われるRADIUS認証によるユーザー認証情報をキャッシュし、別のAPで速やかにIPアドレス引き継ぎと高速な再認証が必要です。

このような方法によって、高速ローミングが実現し、数十ミリ〜遅くとも100ミリ程度でAPが切り替わり、その際に通話が途絶えることはありません。パケットの再送は確実に行われますが、スマホやリモート会議などでは1秒近くのバッファリングがあるので再送による遅延にユーザーが気づくことはあまりありません。

お使いのAPによって挙動は変わりますが、以下は私が自宅で1階から2階に移動した時のPingの結果です。PingPlotterというアプリでGoogleまでのラウンドトリップを計測しています。最初に他のAPを探すところで第1段階の遅延、切り替わるところで第2段階の遅延が発生します。

{% asset_img plotter.png 480 alt %}

丸を2つ示していますが、左側が最初の遅延で250ミリ秒近くあります。これはAPを探している状態に入っています。このタイミングではAPー端末間の通信が保留になり遅延が発生します。本当にタイミングが悪ければパケットを取りこぼすこともあり再送が入ります。が、極めて小さな時間でありTCP/IPやアプリケーションの再送機能によって大半はカバーされます。これはやや悪いケースの計測結果であり、一旦情報がキャッシュされるなどしていて、良いケースではその半分程度まで遅延が軽減されます。
右側の丸辺りで実際にローミングしています。これは20ミリ秒程度の遅延です。スマホのWi-Fiのアンテナ表示が変わったタイミングを目視により確認しました。

なお、APを探すところで250ミリあるのは私の環境の問題にも関わっており、iPhoneがAPから離れすぎた状況（-75dBmを下回る）のためと考えられます。電波の強さと端末との距離を考えながらAPの配置を行う必要があり、これには計測とトライアンドエラーの繰り返しが必要です。ちょうど家の端の階段の辺りが電波の弱いところで、そこにAPをさらに置いても良いのですが、100ミリ秒程度の改善でそこまで対応する気にもならずそのままにしています。

iPerf3を実行しながらフロアを移動した場合、瞬間的にはAPを探すところで数十Mbpsまでに落ち込むケースもありますが、完全に0となったりエラーになることはありません。

これ以上の話は複雑なのでまた別の機会があれば触れてみたいと思いますが、リビングでTeamsやZoomなどのリモート会議をしていて、家族が帰ってきてバタバタと2階に移動する際にも相手の発言が途切れることはありません。

iPhone15Proは、以前のiPhone11やiPhone12よりも電波を掴む力は強いように感じます。5GHzの電波ではまれに公衆回線に切り替わっていたお風呂でのブラウジングが捗ります😊

## 有線バックホールとメッシュWi-Fi

APは一般的に有線で接続され、前述したようにローミング機能を提供しますが、個人向けのメーカーでは有線バックホールという名前が使われる場合があります。AP同士のコミュニケーションや通信を有線によって行うためです。一方、この有線バックホールを使わず、AP同士が無線で接続する形態をメッシュと呼んでいるようです。

このメッシュも独立したチャンネルを使う方法や端末と同一のチャンネルを使う方法など色々あり、各社のマニュアルを見ても、それについてはあまり明確に記載されていないものが多いようです。

なお、一般的にビジネスで用いられるローミング方式（有線バックホール）では、AP同士は異なる周波数（チャネル）にするのが基本です。**異なるAP**で**同じ周波数**を使っていると、昔の中継機と同じで**それぞれのAPが出す電波同士で干渉してしまい、パフォーマンスが出ません**。メッシュにすると遅くなるという感覚をお持ちの方も多いのではないでしょうか。

高速なローミングとWi-Fiの最大限のパフォーマンスを引き出すにはAP同士は異なるチャンネルを設定する必要があります。これは製品によって対応できないものもあるようですので確認をお勧めします。

有線バックホールを使わないケース、これは4LDK以上の広いフロアで物理配線が引けないなどの制約がある場合にやむなくAPをメッシュで分散配置する事については意味があります。ただそのような環境では後述するDFSを除けば、Wi-Fi6Eとなるメリットはあまり見出せないかもしれません。5GHzよりは6GHzの方が壁を通す力は落ちますから、5GHzの方がより電波は強力です。

## メッシュWi-FiとDFS

個人向けの5GHzでは割り当てられた電波の幅によって80MHz単位で使うことが一般的ですが、5.2GHz帯のみDFSが無く、5.3GHz、5.6GHzはDFSがあります。レーダーを受信するとAPが停波してしまうことになりますから、レーダー回避のために6GHzを使うのは有効です。

## 私の環境

私の環境ではUbiquitiのUniFi製品を利用しています。
以下はUniFiのトポロジーで自動的に構成されたネットワーク図です。上流のインターネット回線は、auひかり（10GbE）を使っています。

{% asset_img unifi.png 800 alt %}

APはU6 Enterpriseという製品で、PoEで2.5GbEのLAN接続と併せてスイッチから電源を取ります。
よくよく考えてみれば、クライアントが繋がっているスイッチからいきなりローミングして別のスイッチに切り替われば、スイッチは「いきなり別のスイッチポートから同じMACアドレスの端末のデータが届きネットワークループしてるのではないか」と混乱するはずです。しかし、そこはきちんと制御され、ローミングしたクライアントについて、接続されたすべてのスイッチのMACアドレステーブルを瞬時に更新しにいくようです。

> U6 Enterpriseアクセスポイント
 <https://jp.store.ui.com/collections/unifi-network-wireless/products/u6-enterprise>

> Switch Enterprise 8 PoE スイッチ
 <https://jp.store.ui.com/collections/unifi-network-switching/products/switch-enterprise-8-poe>

UniFi製品については、このブログでも取り上げています。

- 「{% post_link ubiquiti-unifi %}」
- 「{% post_link unifi-switch %}」
- 「{% post_link unifi-ap %}」

## 公衆回線（5G）

公衆回線（5G)においては、iPhoneの実力というよりは公衆回線の環境が色濃く出ると思いますが、どうでしょうか。
海外サイトのSpeedSmartでは、5Gの速度テストにおいて、iPhone15 ProはiPhone14 Proよりも24％速いとレポートしています。

> SpeedSmart.net
 <https://speedsmart.net/blog/post/2005/iPhone-15-Pro-up-to-24-Faster-5G-Download-Speeds>

米国での5G速度は300Mbpsオーバーとの事です。
都内の某所（勤務先）で帰宅時に計測してみました。5G(5Gオート）と4Gとそれぞれ切り替えて計測してみます。

5G
{% asset_img 5G.png 360 alt %}

4G
{% asset_img 4G.png 360 alt %}

都心ではまずまずの速度です（5Gでは500Mbps超えると期待していましたが）。ビルの中に入っても100Mbps程度しか落ち込みません。

最も混雑する時間帯と言われる12時過ぎの状況は以下の通りです。

5G
{% asset_img 5G1.png 360 alt %}

4G
{% asset_img 4G1.png 360 alt %}

5Gは快適ですが、4Gは少し苦しいですね。やはりお昼時は4Gのユーザーがまだまだ多く速度が落ち込むようです。
もちろん、地下鉄では4Gですし、5G網も郊外に行くと4Gに切り替わったり途端に数十Mbps程度まで落ち込みます。また、私の計測した場所は「都内でたまたま計測した場所」ですので、ご参考に留めていただければと思います。

## USBハブに繋げてみる

iPhone15 ProはUSB-Cに対応しました。USB 3.2 Gen2に（USB3.1 Gen2と同義）対応し、10Gbpsの速度が出ます。パッケージに付属してくるUSB-CケーブルはUSB 2.0に対応（480Mbps)との事で高速通信のメリットは活かせません。

> Apple iPhone 15 の USB-C コネクタで充電および接続する
 <https://support.apple.com/ja-jp/HT213839>

「Belkin 7 in 1 USB-C 2.5Gbpsイーサネットハブ」に繋いでみます。
{% asset_img hub.png 800 alt %}

iPhoneの画面はUSBハブからHDMIで接続されたモニタにも映し出されますし、ネットワーク通信も可能で2.5GbEでの速度が当たり前のように出ます（ハブはUSB-PD電源に接続しています）。
{% asset_img speedtesthub.png 360 alt %}

念の為、無線を利用しないように機内モードに設定しています。

スマホの写真をNASに大量にアップロードする時などは、WiFi6Eが速いと言っても、2.5GbEの有線はレイテンシが小さいことによって高速にアップロード可能です。今回、NASにある無駄な写真や動画を一旦削除してスマホから整理済みの全ての写真・動画をSynologyのPhoto Mobileというアプリを使って再アップしたのですが、非常に高速でした。感覚的ですがWiFi6Eの2、3倍といった感じです。アプリの作りにもよりますけれども、写真または動画を1枚単位にアップロードする仕組みのアプリケーションでは、5本も6本ものスレッドで分散してアップロードはしないと思われますのでハードウェアでカバーできる一例でしょうか。こういったケースは今回のようなスマホ入れ替え時など滅多に発生しないケースですが、USB 3.2 Gen2（10GbE）となった事で非常に便利になりました。

> Belkin
 <https://www.belkin.com/jp/usb-c-7-in-1マルチポートアダプター/INC009btSGY.html>

## Macbookに繋げてみる

Macbookはテザリングの逆、iOSにネットワーク機能を提供できます。

{% asset_img mac.png 480 alt %}

実用性を考えると利用するシチュエーションはなかなか見出せませんが、Macbookが10GbEのネットワークに接続されている環境があれば、iPhone15 Proはさらに高速に通信が可能となります。

{% asset_img speedtestmac.png 360 alt %}

USB 3.2 Gen2やネットワークも10Gbpsとなればそれを基準と考え、その他周辺機器ともできるだけ速度差を無くしたいものです。例えばUSBメモリやSDカードはどうでしょうか？昔ながらにOSのセットアップなどに使ってきた経緯がありますが、技術の進歩でSDカードが大容量になったとしても速度とのバランスが悪いのではないでしょうか。今は10GbpsのUSBのSSDケース（M2.2280）が2、3千円で買えますので、廉価となったNVMeのSSDを挿して使うのはいかがでしょうか？USB3.2 Gen2であれば読み込み、書き込み共に10Gbps出ますし、NASのキャッシュ用で使っていた余りなどがあればそれを再利用するのも良いですね。

## Apple CarPlay

Apple CarPlayは既に知られたサービスでiPhone15 Proになったからといって何かが変わるわけではありません。iOS17からはSharePlayという機能が追加され、車の中で搭乗者が（iPhoneを持っていれば）Apple Musicのセッションに参加し、搭乗者の好きな音楽を運転者のiPhoneのCar Playで再生できるようになりました。仕組みとしてはこれまであったAir Playに近いものがありますね。仲間で音楽もシェアする、時代を感じさせるサービスです。Siriの機能と組み合わせてマップの到着予定時刻を家族に共有できます。
iPhoneが車載のBluetoothに接続するとiOSの集中モードが自動的に運転モードに変わり通知などを制限できるようにもできます。
CarPlayも地道なアプリケーションの改善によってかなり使い勝手の良いシステムとなっています。

{% asset_img carplay.png 1024 alt %}
個人的にはThunderbolt3ケーブルでiPhoneとカーナビとを繋いでいるという事実が感慨深いものがあります。。。

## 画面との距離

iPhone15 Proと直接関係ありませんが、iOS17からFaceIDに関連する機能追加として**画面との距離**があります。これはスマホに顔を近づけすぎると眼精疲労警告のため、画面全体が警告メッセージで覆われるというものです。これは子供の視力悪化対策に有用です。iPadでFaceIDに対応している製品は最新のiPad Proしかない（他はTouchID）ので、iOSのタブレットでこの機能を使いたければ（子供に利用させたければ）iPad Proを購入することになるのでしょうか。。。

{% asset_img screendistance.png 360 alt %}
