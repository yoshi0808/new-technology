---
title: SynologyでESXi仮想マシンのバックアップを取得する
date: 2023-08-12T17:24:10+09:00
tags:
  - ESXi
categories:
  - Software
---
{% asset_img install.png 1024 alt %}

<p class="onepoint">この記事で実現すること</p>

Synologyより無償版ESXiの仮想マシン（VM）バックアップが可能なActive Backup for Business(ABB)という無償ソフトウェアが提供されています。Windows PC/macOSから始まり、Microsoft Hyper-V2016および2019にも対応しています。無償版ESXiのバックアップソフトは「{% post_link esxi-nakivo %}」で書いた有償のもの（1年期限の無償版）は存在します。無償バックアップソフトは無償版ESXiに対応していないという難しい状況でしたが、NASが必須という前提はあるものの、追加コストゼロでESXi仮想マシンのバックアップが可能です。エージェントレスで、ESXi本体やVMには何もインストールする必要はありません。

> Synology
 <https://www.synology.com/ja-jp/dsm/feature/active-backup-business/virtual-machine>

<!-- more -->

## 稼働条件

ABBは基本はSynologyNASのPlusモデルで、Btrfsでフォーマットされたファイルシステムが必要です。一部のPlusモデルにはBtrfsに対応しない製品もあるので事前の確認をお勧めします。

<https://www.synology.com/ja-jp/dsm/packages/ActiveBackup>

## ABBの主要な機能について

ここでは、ESXi仮想マシンのバックアップに目的を絞って説明します。

1. ESXi7.0、8.0対応
2. VMのバックアップを複数世代管理
3. ジョブスケジューリング機能
 ワンタイム、定期、日次、週次、月次を利用できます。
1. 重複排除
 VMWareのChange Block Trackingに対応。
1. 暗号化転送
2. バックアップデータの暗号化

## Synology NASの事前準備

### ABBのインストール

NASのWeb画面に管理者としてログインし、パッケージセンターから"Active Backup for Business"をインストールします。
{% asset_img install.png 1024 alt %}

上記はインストール済みの状態ですが、{% label primary@「インストール」ボタン %}をクリックしてインストールします。
NASのFirewallを利用している場合は自動的にPort5510を開けるようにFirewallにルールが追加されます。

## 可用性および機密性向上のために

- フォルダの容量制限（クォータ）についてはABBでは推奨されていません。
- ESXiに対してSSHで接続するため、root相当の専用ユーザーをESXiに新規作成されることをお勧めします。

## ESXiの事前準備

ESXiには以下の設定が必要です。

1. ABBからESXiに対しHTTPS(Port443)、SSH(Port22)を使って接続可能なようにサービスを設定します。
2. ABBがバックアップするVMは容量節約のため、CBT(Changed Block Tracking)を有効にすることをお勧めします。
3. （任意）セキュリティ向上のため、ESXi上に管理者アカウントを作成します。
4. （任意）セキュリティ向上のため、Port22,443で接続可能なIPアドレスをESXi上のFirewall設定で絞ります。

### ESXi上でHTTPS、SSHの解放

無償版ESXiを使う場合はブラウザから基本はvSphere Web Clientを使いますので、HTTPS(Pprt443)の解放は特に意識する必要はありません。ESXiのファイアウォールで接続可能なIPアドレスを絞っている場合はQNAP NASのIPアドレスから接続できるようにしておきます。

SSH(Port22)についてはESXiはデフォルトでサービス停止されている状態ですので、シェルおよびSSHのサービスを起動します。
左ペインメニューの{% label primary@ホスト %}ー{% label primary@管理 %}の{% label primary@サービスタブ %}から{% label primary@TSM %}および{% label primary@TSM-SSH %}を起動します。
 {% asset_img esxi1.png 800 alt %}
この2つのサービスは右クリックメニューの{% label primary@ポリシー %}から{% label primary@ホストと連動して起動および停止します %}をチェックしておく事でESXiの起動時に自動的にサービスが起動するようになります。

### VMのChanged Block Trackingの設定

事前にVMのデータを退避することをお勧めします。VMを停止のうえで、データストアブラウザからVMの入っているフォルダ毎別の場所にコピーしてください。もし、設定の変更でVMを壊してしまった場合は、当該フォルダの`VM名.vmx`を右クリックから「VMの登録」で再登録できます。{% post_link esxi-backup %}を参考にghettoVCBなど無償ツールでバックアップを取る事も可能です。

ESXiの機能であるChanged Block Tracking(CBT)はVMが稼働していて前回バックアップしたものから未更新のディスクブロックをスキップして差分のみバックアップする機能です。途中で別のバックアップ製品によるバックアップ、例えばghettoVCBなどでバックアップされると、次回のバックアップはフルバックアップを行います。

最初にVMがインストールされているディスクを調べ、そのSCSI-IDを確認します。
ESXi管理画面のVMを選択し右クリックして{% label primary @設定の編集 %}をクリックします。
{% asset_img esxi2.png 640 alt %}

{% label primary @ハードディスク %}の詳細を開き、{% label primary @コントローラの場所 %}でSCSI-IDを確認します（SCSI(0:0)など）。

1. VMを停止します。
2. ESXi管理画面のVMを右クリックして、{% label primary @設定の編集 %}をクリックします。
3. {% label primary @VMオプション %}タブをクリックします。
4. {% label primary @詳細 %}セクションを開き {% label primary @設定パラメータ %}の{% label primary @設定の編集 %}をクリックします。{% label primary @設定パラメータ %}ダイアログが開きます。
5. {% label primary @パラメータの追加 %}をクリックします。
6. `ctkEnabled`パラメータを追加して、その値を`true`に設定します。
7. さらに{% label primary @パラメータの追加 %}をクリックし、`scsi0:0.ctkEnabled`を追加して、その値を`true`に設定します（環境に合わせて`scsi0:0`の内容は変更してください）。
8. OKボタンをクリックし設定を完了させます。
9. VMを起動します。
10. SSHでESXiに入り、VMが配置されているディレクトリで、`VM名-ctk.vmdk`ファイルがあることを確認します。

CBTを無効にする場合はこの逆の手順、ctkEnabledの値をfalseに設定します。
VMWareによるCBTの説明は以下を参照してください。
> VMware VM上の変更ブロックのトラッキング（CBT） (1020128)
 <https://kb.vmware.com/s/article/1031873?lang=ja&queryTerm=changed+block+tracking>

### （任意）管理者アカウントの作成

セキュリティの観点からrootはできるだけ使わない事をお勧めします。これは一般論でありrootがよく知られたユーザー名だからです。以下の手順で管理者アカウントを作成します。

1. 管理メニューの左ペイン{% label primary @ホスト %}ー{% label primary @管理 %}から{% label primary @セキュリティとユーザー %}に進み、{% label primary @ユーザー %}から{% label primary @ユーザーの追加 %}をクリックします。
{% asset_img esxi5.png 800 alt %}
1. ABBから接続する専用のユーザー名とパスワードを登録してユーザーの作成を終えます。
2. 管理メニューの左ペイン{% label primary @ホスト %}から{% label primary @アクション %}を選択し、プルダウンの{% label primary @権限 %}をクリックします。
3. さらに{% label primary @ユーザーの追加 %}を選択します。実際には上記で作成したユーザーと同一名のユーザー名を入力します。ロールについては"システム管理者"を選択します。
{% asset_img esxi4.png 800 alt %}

これで新しいユーザーが作成できたので、Web管理画面からログイン可能か確認してください。rootユーザーは長めのパスワードを再設定し、パスワード管理ソフトに登録し普段は使わないようにします。普段から使わずにパスワードを封印しておけばより安全になります。

### （任意）SSH、Web Clientのために接続可能なIPアドレスを絞る

この機能はESXiではファイアウォールと呼ばれ、Linuxのiptablesやufwと同様にシンプルなものです。ホームユーザーはシンプルなLANで閉じられたアクセスですが、安全のために特にSSHは設定を検討すべきです。
Web管理画面の左ペインメニューの {% label primary @ネットワーク %}を選択し、{% label primary @ファイアウォール %}タブをクリックして見つける事ができます。デフォルトでは一切の制約なく接続可能になっていますので、ここでSSHとWeb Clientに接続可能なIPを登録できます。

{% asset_img esxi3.png alt %}

## ABBの起動

DSMからABBを起動し、管理画面を開きます。
{% asset_img hdp1.png alt %}

2要素認証を設定されている方には「2段階認証」のポップアップが表示されます。6桁のワンタイムパスワードを入力しログインします。

以下はログイン直後のメインページです。
{% asset_img hdp2.png alt %}

| ネットワーク   | 内容                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| インベントリ   | ESXiのホストおよび登録されているVMを選択します                                                             |
| リポジトリ領域 | QNAP-NASの共有フォルダを選択し、そこにバックアップデータを登録します。複数の保存先が設定できます           |
| バックアップ   | バックアップジョブを作成します。同一のVMについて周期の異なるジョブやリポジトリを変えたジョブを作成できます |
| 復元           | バックアップからESXiにVMを復元します                                                                       |
| ジョブの状態   | バックアップジョブ毎のジョブ状態を表示します                                                               |
| システム       | イベントログが表示されます                                                                                 |

## インベントリ登録

ここでは、任意の名前、ESXiのIPアドレス、ESXiにログインするユーザーおよびパスワードを指定し、登録します。
{% asset_img hdp3.png 800 alt %}

登録が無事完了するとVMの数が表示されます。

## 　バックアップリポジトリ登録

既に作成してある共有フォルダを指定します。画面右上の{% label primary @バックアップリポジトリの追加 %}ボタンをクリックします。
{% asset_img hdp4.png 640 alt %}

{% label primary @選択 %}ボタンをクリックし、共有フォルダを選択します。バックアップデータを暗号化しない場合は{% label primary @データ暗号化を有効にする %}のチェックボックスが空白になっています。NASの共有フォルダを暗号化している場合はチェックボックスが選択された状態になっています。

## 　バックアップ

いよいよバックアップです。
{% asset_img hdp5.png 640 alt %}
画面右上の{% label primary @ジョブの作成 %}ボタンをクリックし、ジョブを構成します。

1. VMの選択
 VMとバックアップ先のリポジトリを設定します
 {% asset_img hdp6.png 640 alt %}

2. スケジュール
 {% label primary @スケジューラー %}、{% label primary @リンクしたジョブの後に実行 %}、{% label primary @スケジュールなし %}を選択します。
 {% asset_img hdp7.png 640 alt %}
 少し気づきづらいですが、画面上部の {% label primary @スケジュール %}の隣に{% label primary @保持 %}とあります。ここをクリックすると、以下の通りバックアップの保存期間を設定可能です。
 {% asset_img hdp8.png 640 alt %}

3. ルール
 バックアップ時のデータ転送に関する暗号化や圧縮について設定します。
 {% asset_img hdp9.png 640 alt %}
 {% label primary @全VMに対しVMware CBTを有効にする %}では以下の説明があります。
「VMware CBT (Changed Block Tracking) は、Hyper Data Protectorがバックアップを実行する時には有効になっていなければなりません」
 また、{% label primary @アプリケーションアウェア処理の有効化 %}とあります。VSSというのはWindowsのVolume Shadow Copy Serviceを指しています。スナップショットなどを取得する場合、VSSに対応したアプリケーションに対して一旦データ書き込みなどを待たせるなどの命令を出し、アプリケーションのデータ一貫性を保つ機能です。バックアップ対象がWindowsの場合に意味があります。詳しくは以下の記事を参照してください。
 > Microsoft
 https://docs.microsoft.com/ja-jp/windows-server/storage/file-server/volume-shadow-copy-service

1. 要約
 設定した内容を確認し、スケジューリングしたものを保存するか、すぐにバックアップを取得するかを選択します。
 {% asset_img hdp10.png 640 alt %}

HDPのデザインですが、以下の注意事項があります。

{% note warning %}

- ESXiのVMのバックアップはESXi上でほぼ同じサイズのコピーを作成します。従い、ESXiのデータストアはVMの分だけ空きを残している必要があります。ストレージが不足していても単にバックアップエラーとなり原因に悩みますのでご注意ください

{% endnote %}

メニューの{% label primary @ジョブの状態 %}、{% label primary @システム %}ではバックアップの状況やエラーログを確認できます。また、HDPの右上のメニューから通知の設定ができますので、スマホなどへの通知設定をお勧めします。

私の環境のバックアップ時間は、リポジトリ暗号化なし、転送時暗号化あり、圧縮なしのオプションで64GBのWindows10のバックアップに16分程度掛かりました。ESXiとNASはそれぞれ10GbEで接続され、NASはHDDとQtierと呼ばれるNVMeとの動的な組み合わせになっていますが、データ転送時は最大で2.5Gbps程度の速度です。

## 復元

復元メニューからジョブの作成を行います。まず最初に復元するジョブと復元するVMの場所を指定します。

 {% asset_img hdp11.png 640 alt %}

バックアップジョブ（リポジトリ）に含まれている対象のバックアップを選択します。

 {% asset_img hdp12.png 640 alt %}

復元先はデフォルトでバックアップしたESXiが選択されています。

{% asset_img hdp13.png 640 alt %}

{% label primary @ターゲットの編集 %}をクリックして、VMストレージ先の変更や新しい場所に（別のVMとして）復元する事も可能です。ここでも戻す際のESXi上のデータストアの容量には気をつけてください。

続いてスケジュールが必要であれば設定します。
{% label primary @ルール %}設定では、VMを上書きするか名前の変更して別名で登録するかを選びます。

{% asset_img hdp14.png 640 alt %}

復元されたVMを自動的に起動するというオプションもあります。これは上書きで戻す場合には使い勝手が良いですが、複製を作る場合はvSwitchにおける仮想NICが変わる事やIPアドレスの重複の可能性に留意する必要があります。もちろんOSのライセンス上の問題もありますので注意が必要です。

最後にジョブを作成するかすぐに復元するか選択します。

## HDPを使った感想

HDPは有償版ESXiのvStorageAPIを使ったバックアップのように高機能ではありませんが、日次・週次のバックアップなどホームユーザーが利用するための必須条件は押さえていると思います。
