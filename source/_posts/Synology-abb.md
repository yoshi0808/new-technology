---
title: Synology NASでESXi仮想マシンのバックアップを取得する
date: 2023-09-16T09:44:10+09:00
tags:
- Synology
- ESXi
- 10GbE
- 25GbE
categories:
- [Software]
- [Network]
---
{% asset_img install.png 1024 alt %}

<p class="onepoint">この記事で実現すること</p>

SynologyのNASでは無償版ESXiの仮想マシン（VM）バックアップが可能なActive Backup for Business(ABB)というソフトウェアが提供されています。Microsoft Hyper-V2016および2019にも対応しています。無償版ESXiのバックアップソフトは「{% post_link esxi-nakivo %}」で書いた有償のもの（1年期限の無償版）は存在します。無償バックアップソフトは無償版ESXiに対応していないという難しい状況でしたが、NASが必須という前提はあるものの、追加コストゼロでESXi仮想マシンのバックアップが可能です。エージェントレスで、ESXi本体やVMには何もインストールする必要はありません。

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
- ESXiに対してSSHでの接続が必要です。セキュリティ向上のためroot相当の専用ユーザーをESXiに新規作成されることをお勧めします。

## ESXiの事前準備

ESXiには以下の設定が必要です。

1. VMWare Toolsのインストールが必要です。
2. ABBからESXiに対しHTTPS(Port443)、SSH(Port22)を使って接続可能なようにサービスを設定します。
3. ABBで無償版ESXiをバックアップするためにはCBT(Changed Block Tracking)を手動で有効にする必要があります。
4. （任意）セキュリティ向上のため、ESXi上に管理者アカウントを作成します。
5. （任意）セキュリティ向上のため、Port22,443で接続可能なIPアドレスをESXi上のFirewall設定で絞ります。

## ESXi上でHTTPS、SSHの解放

無償版ESXiを使う場合はブラウザから基本はvSphere Web Clientを使いますので、HTTPS(Pprt443)の解放は特に意識する必要はありません。ESXiのファイアウォールで接続可能なIPアドレスを絞っている場合はNASのIPアドレスから接続できるようにしておきます。

SSH(Port22)についてはESXiはデフォルトでサービス停止されている状態ですので、シェルおよびSSHのサービスを起動します。
左ペインメニューの{% label primary@ホスト %}ー{% label primary@管理 %}の{% label primary@サービスタブ %}から{% label primary@TSM %}および{% label primary@TSM-SSH %}を起動します。
 {% asset_img esxi1.png 800 alt %}
この2つのサービスは右クリックメニューの{% label primary@ポリシー %}から{% label primary@ホストと連動して起動および停止します %}をチェックしておく事でESXiの起動時に自動的にサービスが起動するようになります。

## VMのChanged Block Trackingの設定

ESXiの機能であるChanged Block Tracking(CBT)はVMが稼働していて前回バックアップしたものから未更新のディスクブロックをスキップして差分のみバックアップする機能です。バックアップに必要な領域を削減できます。途中で別のバックアップ製品によるバックアップ、例えばghettoVCBなどでバックアップされると、次回のバックアップはフルバックアップを行います。

この設定にあたり、事前にVMのデータを退避することをお勧めします。VMを停止のうえで、データストアブラウザからVMの入っているフォルダ毎別の場所にコピーしてください。もし、設定の変更でVMを壊してしまった場合は、当該フォルダの`VM名.vmx`を右クリックから「VMの登録」で再登録できます。

### 設定方法
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

## （任意）管理者アカウントの作成

セキュリティの観点からrootはできるだけ使わない事をお勧めします。これは一般論でありrootがよく知られたユーザー名だからです。以下の手順で管理者アカウントを作成します。

1. 管理メニューの左ペイン{% label primary @ホスト %}ー{% label primary @管理 %}から{% label primary @セキュリティとユーザー %}に進み、{% label primary @ユーザー %}から{% label primary @ユーザーの追加 %}をクリックします。
{% asset_img esxi5.png 800 alt %}
1. ABBから接続する専用のユーザー名とパスワードを登録してユーザーの作成を終えます。
2. 管理メニューの左ペイン{% label primary @ホスト %}から{% label primary @アクション %}を選択し、プルダウンの{% label primary @権限 %}をクリックします。
3. さらに{% label primary @ユーザーの追加 %}を選択します。実際には上記で作成したユーザーと同一名のユーザー名を入力します。ロールについては"システム管理者"を選択します。
{% asset_img esxi4.png 800 alt %}

これで新しいユーザーが作成できたので、Web管理画面からログイン可能か確認してください。

## （任意）SSH、Web Clientのために接続可能なIPアドレスを絞る

この機能はESXiではファイアウォールと呼ばれ、Linuxのiptablesやufwと同様にシンプルなものです。ホームユーザーはシンプルなLANで閉じられたアクセスですが、安全のために特にSSHは設定を検討すべきです。
Web管理画面の左ペインメニューの {% label primary @ネットワーク %}を選択し、{% label primary @ファイアウォール %}タブをクリックして見つける事ができます。デフォルトでは一切の制約なく接続可能になっていますので、ここでSSHとWeb Clientに接続可能なIPを登録できます。

{% asset_img esxi5.png alt %}

## ABBの利用について

ABBの使い方については公式のクイックガイドが提供されています。

> Active Backup for Business クィック スタート ガイド
 <https://kb.synology.com/ja-jp/DSM/tutorial/Quick_Start_Active_Backup_for_Business>

ABBでは管理者（Administratorsグループ）ユーザーのみが操作できます。

## 仮想マシンのABBへの登録

DSMからABBを起動します。
{% asset_img abb1.png alt %}

仮想マシンを対象にします。
{% asset_img abb2.png alt %}

最初にバックアップ対象となるESXiを登録します。
{% asset_img abb3.png 640 alt %}

バックアップ対象となるESXiのIPアドレス、アカウントを入力します。
{% asset_img abb4.png 640 alt %}

ESXiに有効な証明書が設定されていないとワーニングが出ますが、ここはそのまま進みます。
{% asset_img abb5.png 640 alt %}

ESXiへの接続が確認されチェックがOKであれば状態が**成功**となります。
{% asset_img abb6.png 640 alt %}

エラーとなった場合は、ESXi側の設定、またはネットワークを確認してください。

## バックアップタスクの登録

無事にESXiの情報がABBに取り込まれると、仮想マシンの情報が出力されます。
{% asset_img abb7.png 640 alt %}

現在はバックアップが取得されておらず、タスクなしとなっています。

上記の{% label primary@タスクの作成 %}ボタンをクリックします。

仮想マシンが選択されます。
{% asset_img abb8.png 640 alt %}

ここでタスク名を入力します。ここでは、ESXi8のUbuntu22のバックアップを取るのでESXi8.Ubuntu22とします。

続いてバックアップするフォルダを選択します。デフォルトでは、{% label primary@ActiveBackupforBusiness %}になります。
{% asset_img abb9.png 640 alt %}

最初のバックアップ時にフォルダの暗号化/圧縮を設定します。私の場合すでに設定済みでありここでは変更できません。
{% asset_img abb10.png 640 alt %}

バックアップオプションを選択します。Windows、Linuxのバックアップ時には{% label primary@アプリケーション対応バックアップを有効化 %}にチェックすることが推奨されます。
また、ESXiのCBTが有効である場合は{% label primary@変更ブロック　トラッキングを有効化 %}のチェックが有効になります。
{% asset_img abb11.png 640 alt %}

改めて構成チェックが行われます。
{% asset_img abb12.png 640 alt %}

続いて定期的なバックアップの設定です。
{% asset_img abb13.png 640 alt %}

保持ポリシーを選定します。これはディスクの容量やバックアップ期間などに合わせて設定します。
{% asset_img abb14.png 640 alt %}

復元を許可するユーザーを設定します。
{% asset_img abb15.png 640 alt %}

最後のサマリで確認をし完了させます。今すぐバックアップを取得することもできます。
{% asset_img abb16.png 640 alt %}

## 仮想マシンのバックアップ実行

64GBのシックプロビジョニングのUbuntu22の仮想マシンを手動でバックアップをしてみました。バックアップ速度についても計測してみます。

**環境**

ESXi8
| パーツ | 製品名                                               |
| ------ | ---------------------------------------------------- |
| CPU    | AMD Ryzen5 5600G 6コア/12スレッド 3.9-4.4GHz         |
| メモリ | 16GB(8GB×2) DDR4-3200                                |
| NVMe   | WesternDigital Blue 500GB SSD / NVMe M.2[PCIe 3.0×4] |
| NIC    | Mellanox Connect X5(MCX512A-ACAT) SFP28 2Port        |


Synology 1621+
| パーツ | 製品名                                              |
| ------ | --------------------------------------------------- |
| CPU    | AMD Ryzen V1500B クアッド コア 2.2 GHz              |
| メモリ | 8GB(4GB×2)                                          |
| SSD    | Samsung 870EVO 4TB(MZ-77E4T0B/IT) / SATA x 6(RAID5) |
| NIC    | Mellanox Connect X4(MCX4121A-ACAT) SFP28 2Port      |

SFP28(25GbE)のスイッチポートにそれぞれDACケーブルで接続しています。

ログの結果も非常に詳細で分かりやすいです。ここはさすがソフトウェアが売りのSynologyですね。
{% asset_img time.png 800 alt %}

開発者が障害切り分けのために利用するログではなく、ユーザーに価値のある情報（ログ）を提供しています。これは他のメーカーとは根本的に出来が違います。

通知設定しているとメールも届きます。

>**** のバックアップタスク ESXi8.Ubuntu22 が完了しました。
 開始時間：2023-09-02 12:46
 終了時間：2023-09-02 12:47
 転送サイズ：24.7 GB
 デバイス リスト：Ubuntu22

 送信元 ****

まずは圧縮効果が出ており、64GBの仮想マシンが24.7GBとなっています。

さらに30分後、もう一度バックアップを取得してみます。今度は数秒で終了しました。通知では3.1MBとなっていました。これはESXiのCBTが有効で差分のみバックアップするためわずかの量に収まっていることになります。仮想マシンの稼働時間が長くなるとそれだけバックアップ量も増えることになります。

ちなみに、同一の環境でghettoVCBスクリプトでバックアップを取得した場合は以下の通り35秒でした。

``` bash
2023-09-03 01:27:50 -- info: ============================== ghettoVCB LOG START ==============================
2023-09-03 01:27:52 -- info: Creating Snapshot "ghettoVCB-snapshot-2023-09-03" for Ubuntu22
Destination disk format: VMFS thin-provisioned
Cloning disk '/vmfs/volumes/datastore1/Ubuntu22/Ubuntu22.vmdk'...
2023-09-03 01:28:23 -- info: Removing snapshot from Ubuntu22 ...
2023-09-03 01:28:23 -- info: Backup Duration: 31 Seconds
2023-09-03 01:28:23 -- info: Successfully completed backup for Ubuntu22!

2023-09-03 01:28:25 -- info: ###### Final status: All VMs backed up OK! ######

2023-09-03 01:28:25 -- info: ============================== ghettoVCB LOG END ================================

```

## ABBの実行内容について

ABBの実行している内容は、ghettoVCBとほぼ変わりません。ESXiのAPIでESXiのスナップショットを取得しつつ、無償版ESXiではバックアップ関係のAPIが使えないためSSHで各種操作をして仮想マシンの情報を吸い上げています。
普段私はESXiにSSHで接続する際にはrootで公開鍵認証をしています（YubiKeyに秘密鍵を入れています）。ABBでは公開鍵認証は使えないようですので、今回示したように、別アカウントでパスワードを設定しています。ESXiのパスワードは他の用途を含めてABB以外では使うことがなく操作ミスなどによるパスワード漏洩の心配も不要です。

## 復元

ABBでバックアップを取得した日時（スナップショット）毎にESXiに復元します。

ABBの左ペインのメニューから仮想マシンを選択し、さらに実際に復元する仮想マシンを選択します。

{% asset_img abb17.png 1024 alt %}

仮想マシンを選択した状態では背景が薄いグレーになりますので、ここで{% label primary@復元 %}ボタンをクリックします。

続いて、復元ポイント（バックアップを取得した日付と時刻）を選択し、{% label primary@VMWare VSphereへの復元 %}を選択し、次に進みます。
注釈で「ゲストOSファイル（Windows/Linux）の復元の場合、Active Backup for Business Portalに進んでください」とありますが、これはファイル単位で復元したい場合です。ここではスナップショット単位に戻す事を目的としていますのでこの説明は省略します。

続いて復元の仕方を選択します。
{% asset_img abb18.png 640 alt %}

{% label primary@仮想マシンの完全復元 %}と{% label primary@即時復元 %}との2種類があります。ここでは完全復元の例について記載します。
なお、即時復元はNAS上で重複排除されてバックアップされたそのままの情報がESXiから見えるようになります。そこで仮想マシンを登録するなどすれば、すぐに仮想マシンを起動しその内容にアクセス可能となります。ただし、仮想マシンの実態はNAS上にあるのでパフォーマンスは落ちます。

復元モードを選択します。
{% asset_img abb19.png 640 alt %}

{% label primary@元の場所に復元 %}と{% label primary@新しい場所に復元、或いは異なる設定で復元 %}との2種類があります。

一般的にはMACアドレスはESXi上で動的に生成されますが、元の場所、つまりこれまでの仮想マシン同様のIPアドレス、構成で戻すのであればIPアドレスの引き継ぎなども鑑み、元のMACアドレスで戻すことになります。新しい場所、つまり新しい仮想マシンとして複製するのであれば、後者を選択します。

なお、MACアドレスが静的な場合のオプションもありますがここでは割愛します。

この例では元の場所に戻します（仮想マシンの稼働中に復元します）。

最後に構成の最終確認をして実行します。
{% asset_img abb20.png 640 alt %}

対象のデータストア、ネットワーク（VLAN）を念のため確認してください。
{% label primary@復元後、自動的にVMの電源をオンにします %}のチェックは手前が省けるのでオンで良いでしょう。構成を変更したい場合は外すなど状況に合わせて選択します。

ちなみに、私の構成では、`vmfs/volumes/datastore1`にUbuntu22というフォルダが作成され、その中に仮想マシンの関連ファイルが登録されています（新規に仮想マシンを作成した一般的な構成です）。

ESXiの稼働中の画面は以下の通りです。
{% asset_img esxi6.png 1024 alt %}

さて、実行中のアラートが表示されますがOKで続行します。
{% asset_img abb21.png 360 alt %}

実行結果です。
{% asset_img time2.png 800 alt %}

普通にUbuntuにESXi管理コンソール経由で接続でき、SSHも問題ありません。仮想MACアドレスは同一のもので復元されておりIPアドレスも前回と同じものでした。
復元動作は完璧です。

さて、復元では留意する点として、仮想マシンのESXi上の管理IDが変わる事が挙げられます。

復元後のフォルダ構成を確認しましたが、特にフォルダパスも変更はなく、復元前とは変更されたようには見受けられません。復元のログではテンポラリのフォルダを作成しているように見えますが、最終的には`vmfs/volumes/datastore1`にUbuntu22というフォルダにて復元されています。

ESXiの管理IDは特に意識しない場合も多いのですが、ブラウザからESXiの管理コンソールを起動せずにいきなり仮想マシンを起動する場合は、`vmrc://ユーザーID@ホスト名/?moid=管理ID`　ですぐに仮想マシン（GUI）にアクセスできますが、このIDが変更されているので、ESXi管理コンソールで新しいIDを確認する必要があります。

なお、これによってABBでバックアップしていた構成も変わることになるので、これまでタスク化されているバックアップは失敗することになりますので改めて仮想マシンの登録情報を編集しておく必要があります。

> 警告,2023-09-03 12:42:22,前回のバージョンからのディスク [[datastore1] Ubuntu22/Ubuntu22.vmdk] が見つかりません。それは削除されたか、あるいはパススルー、RDM、あるいは独立したディスクへ変更された可能性があります。バックアップ タスクはディスクをバックアップしません。

このエラーは構成情報の変更を検知したという事でしょう。私はこの対策として、旧環境でのバックアップの定期的な実行を取りやめる設定に変更し、新しいバックアップタスクを改めて作成するようにしています。それでしばらく時間が経過してから古いバックアップファイルを削除することにしています。

## まとめ

非常に簡単なGUI操作で後は殆ど気にすることなく定期的な仮想マシンのバックアップが行えます。速度も必要十分で特に指摘する点は見つかりません。仮想マシンの一部のファイルを取り出したいなどのニーズにも応えられますし、本格的なバックアップソフトウェアです。小規模なビジネスやホームユーザーには十分すぎる機能を持ち合わせていると言えるでしょう。

仮想環境としてESXiを選定するメリットとして、第一に使いやすさと安定性、セキュリティレベルが高いということが挙げられますが、こういったスタンダードなNASがESXiのバックアップをサポートしている事も大きなメリットではないでしょうか。