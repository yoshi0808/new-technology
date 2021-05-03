---
title: 無償版ESXiの高度なバックアップ
tags:
  - ESXi
  - XG Firewall
categories:
  - Software
date: 2021-03-06T09:26:19+09:00
---
{% asset_img Monitor2.png alt %}

<p class="onepoint">この記事で実現すること</p>

無償版ESXi6.7（VMware vSphere Hypervisor6.7）はvStorage APIが使えないため、有名なESXiのバックアップ製品は大半が利用できません。vStorage APIを使わないGUI製品であるNakivo Backup Free Editionを用いてXG Firewallなどの仮想マシンがバックアップできます。GUIによる設定、定期的なバックアップ、差分バックアップをサポートします。

<!-- more -->

## 無償版ESXiのバックアップ環境

「{% post_link esxi-backup %}」の記事では、無償版ESXiのバックアップについて説明していますが、コマンドラインベースであることやUEFIシステムによってCronで定期的なバックアップが行えない制約がありました。一方、GUIによるバックアップ製品は多くの製品があります。「ずっと無償」などの言葉が並んでいますが、無償というのはバックアップ製品が無償という事であり、無償ESXiのバックアップは取れず、色々捜しつつもGUI製品には殆どめぐり合えないというのが実態です。昨年夏に私が利用しているNASのQNAPでも無償のESXiバックアップ製品が発表という事で少しときめいたのですが、Inventoryには仮想マシンが表示されるものの結局はvStorage APIが必要であり、バックアップは行えませんでした。

## Nakivo Backupの無償の意味

Nakivo backup Free Editionは無償のオープンシステムではなく、あくまでビジネス向けに収益をあげるモデルです。無償ライセンスは1年単位となっています。10以下の仮想マシンのバックアップなど制約はありますが、個人向けには十分な内容です。しかし、あくまで無償版はお試しという位置付けであり実際は個人向けでも正式なライセンスを購入してほしいようです。製品をダウンロードすると、米国の営業担当から電話がかかってきました{% emoji frowning %}。私はメールでやりとりし、とりあえず1年間はこの無償版を使いますよという事になりましたが<sup>[**[1]**](#note1)</sup>、次回は有償版のライセンスにて更新するかどうするかは少し値段の面で悩んでいるところです。ライセンス費用も公開されていますが、[マザーボードに物理接続されたCPUあたり＄99/年](https://www.acronis.com/ja-jp/support/backup/vmware/)という事です。ビジネス用途であれば極めて安価ですが、個人向けとしては悩みどころの価格帯です。また、ghettoVCBで事足りているというのもあります。

他の無償製品に目を向けてみると、[Unitrends Free](https://www.unitrends.com/landing/free-backup-vmware-hyper-v-software)で無償版ESXiの仮想マシンがバックアップ可能ですが、これはエージェントモデルで、仮想マシンそのものにエージェントをインストールし、エージェントが自分自身のOSのバックアップを取得する事になります。これはLinuxやWindowsの仮想マシンには使えますが、XG Firewallなど他のモジュールインストールを認めていない仮想マシンはバックアップする事はできません。

## Nakivo Backupの必要環境

ESXiの仮想マシンをバックアップするにあたり、スケジューリングによるバックアップがまずは期待されるところです。常時起動したままのOS、またはNASなどが適任です。対象OSは以下の通りです。なお、私のブログのテーマと関連するためESXiを前提として記事を書いていますが、Hyper-Vのバックアップも可能です。

- Windows
- Linux
- Esxiの仮想マシンとして
- NAS(ASUSTOR,NETGEAR,QNAP,Synology,WesternDigital)

私はQNAP上にインストールしています。ESXiの仮想マシン自体にインストールする事も可能ですが、バックアップデータ自体はNASをはじめとする別筐体のストレージにバックアップされる事をお勧めします。

## ダウンロードおよびインストール

[ESXi版ダウンロードサイト](https://www.nakivo.com/resources/download/free-edition/)から以下の赤枠で囲ったダウンロードボタンからダウンロードしてください。

{% asset_img nakivo1.png alt %}
ダウンロードにはビジネスで利用しているメールアドレスが必要になります。昔はgmailやicloudメールが使えましたが、現在は認められないようで会社勤めの方であれば会社のメールアカウントを入力必要です。私は会社のメアドを登録するのは躊躇して登録していませんが、エンジニアの方であれば、一般的には自己啓発という名目もあり構わないと考えられるでしょうか。
インストール自体は難しいものではありません。以下のURLから各環境に応じた手順でセットアップを行います。

[Nakivo User Guide](https://helpcenter.nakivo.com/display/NH/Installing+NAKIVO+Backup+and+Replication)

ポイントは以下の2点です。

1. ユーザー名、メールアドレスの登録を行います。ここのメアドはバックアップ結果などの通知のために使うものでダウンロード時に用いたビジネスアカウントメールとは異なります。

{% asset_img account.png alt %}

2. Transportarという複数のチャネルでバックアップを吸い上げる機能がありますが、この選択がある場合は、"Transportar only"で構いません

{% asset_img transporter.png 480 alt %}

セットアップ完了後、Nakivo BackupをインストールしたマシンのTCP4443ポートにブラウザから接続します。

## Nakivo BackupからESXiのインベントリ確認

Nakivo BackupからFree版のESXiに接続するにはESXiのHTTPS(Port443)、SSH(Port22)に接続できる必要があります。ESXiのSSHの有効化については「{% post_link esxi-backup %}」の記事を参照してください。また、SSHの認証はパスワード認証となり、公開鍵認証は使えません。

`https:nakivo-host:4443`に接続しログインします

{% asset_img nakivo2.png alt %}

ログイン後の全体像は以下のようになっています。

{% asset_img nakivo3.png alt %}

初期セットアップとして、左ペインメニューの{% label primary @Settings %}からESXiに接続し仮想マシンの一覧を取得します

{% asset_img nakivo4.png 640 alt %}

テストドライブとしてはrootで接続確認を行うでしょうけれども、恒久的にこのプロダクトを利用される場合は、「{% post_link esxi-security %}」の記事で示したように、SSHを開けたままにする事になるので、ESXiへのSSH接続可能なIPアドレスを制限する事、nakivo用の専用ユーザーアカウントをESXiに作成する事をお勧めします。接続が無事行えるとInventoryに仮想マシンの一覧が表示されます。

## Backup実行とスケジューリング

ダッシュボードからジョブの設定を行います。左ペインの{% label primary @Dashboard %}から{% label primary @VMWare backup job %}ー{% label primary @Create %}ー{% label primary @VMWare vSphere backup job %}をクリックします。

{% asset_img nakivo5.png alt %}

設定の流れとしては以下の通りです。

| 項目          | 設定内容                                                   |
| ------------- | ---------------------------------------------------------- |
| 1.Source      | 接続先のESXiから仮想マシンを選択します                     |
| 2.Destination | バックアップするリポジトリとしての場所を指定します（任意） |
| 3.Schedule    | 定期的なバックアップの指定をします                         |
| 4.Retention   | バックアップの世代管理をします                             |
| 5.Options     | ジョブ通知のメールやバックアップ形式を指定します           |

設定のポイントは以下の通りです。特に設定が難しいものはないでしょう。

"Schedule" この例では月曜日の朝6時にバックアップを開始します
{% asset_img nakivo6.png 480 alt %}

"Retention" この例では過去5世代のバックアップを確保し、月次バックアップを過去2か月確保します
{% asset_img nakivo7.png 480 alt %}

"Options" この例では差分バックアップの指定とジョブの通知メールを指定しています
{% asset_img nakivo8.png 480 alt %}

差分バックアップについてはESXiの機能であるCBT(Changed Block Tracking)の機能を使えます。バックアップのストレージと時間の圧縮効果があるので設定をお勧めします。これは次の章で説明します。

Nakivo Backupのユーザーマニュアルの詳細は[こちら](https://helpcenter.nakivo.com/display/NH/User+Guide)を参照してください。

## ESXiのChanged Block Tracking

ESXiの機能であるChanged Block Trackingは仮想マシンが稼働していて前回バックアップしたものから未更新のディスクブロックをスキップして差分のみバックアップする機能です。途中で別のバックアップ製品によるバックアップ、例えばghettoVCBなどでバックアップされると、次回のNakivo BackupによるCBTはフルバックアップを行います。

最初に仮想マシンがインストールされているディスクを調べ、そのSCSI-IDを確認します。
ESXi管理画面の仮想マシンを選択し右クリックして{% label primary @設定の編集 %}をクリックします。
{% asset_img esxi.png 640 alt %}


{% label primary @ハードディスク %}の詳細を開き、{% label primary @コントローラの場所 %}でSCSI-IDを確認します（SCSI(0:0)など）。

1. 仮想マシンを停止します。
2. ESXi管理画面の仮想マシンを右クリックして、{% label primary @設定の編集 %}をクリックします。
3. {% label primary @仮想マシンオプション %}タブをクリックします。
4. {% label primary @詳細 %}セクションを開き {% label primary @設定パラメータ %}の{% label primary @設定の編集 %}をクリックします。{% label primary @設定パラメータ %}ダイアログが開きます。
5. {% label primary @パラメータの追加 %}をクリックします。
6. ctkEnabled パラメータを追加して、その値を true に設定します。
7. {% label primary @パラメータの追加 %}をクリックし、scsi0:0.ctkEnabled を追加して、その値を true に設定します（環境に合わせてscsi0:0の内容は変更してください）。
8. OKボタンをクリックし設定を完了させます。
9. 仮想マシンを起動します。
10. SSHでESXiに入り、仮想マシンが配置されているディレクトリで、`"vm-name"-ctk.vmdk`ファイルがあることを確認します。

CBTを無効にする場合はこの逆の手順、ctkEnabledの値をfalseに設定します。
手順の詳細についてはVMWareの[ガイド](https://kb.vmware.com/s/article/1031873?lang=ja&queryTerm=changed+block+tracking)を参照してください。

## 定期的なバックアップをお勧めします

この製品もghettoVCBと同様にスナップショットをとってからバックアップに入りますので、制約はほとんど感じる事がありません。せいぜい数ヶ月に1度のESXiパッチ適用の前に手動でバックアップを取る事くらいでしょうか。不慮の事故に備えて定期的なバックアップを取得される事をお勧めします。最近はOSもIoTもパッチの自動更新機能が充実してきました。多少意識する事としてはパッチ適用による自動リブートなどと、このバックアップとの時間帯が重ならないように留意する事くらいでしょうか。それでもジョブ通知があるのでバックアップ失敗が放置される懸念もありません。

<small id="note1">**[1]**
営業担当曰く、「気に入ったら買って欲しい」との事でした。こちらはそこまでパワーユーザーじゃないからというやりとりのあと、こちらから「目的から外れるのならソフトウェアを削除するけど、そうした方が良い？」という質問には明確な回答がありませんでした。もちろん、ソフトウェアで収益を上げている事はビジネスとして当然の行為で、良いソフトウェアには適切な値段があるべきですが、できればそのあたりをWebサイトに明記されると良いのになと感じたところです。しかしホームユーザーとして悩む絶妙な価格設定{%emoji sweat_smile%}
</small>