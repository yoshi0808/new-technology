---
title: VMware ESXiにパッチを適用する
tags:
  - ESXi
categories:
  - Software
date: 2020-06-14 22:19:20
---

{% asset_img title.png alt %}
<p class="onepoint">この記事で実現すること</p>

無償版ESXi（VMware vSphere Hypervisor）について、VMwareのサイトから製品パッチに関する情報を入手し、ESXi上でパッチを適用します。この記事ではESXi7.0を対象にしています。2022年12月現在、ESXi8.0は発表されていますが、私は当面安定しているESXi7.0を稼働させる予定で、ESXi7.0のパッチ情報を記載していきます。

<!-- more -->

## ESXiの脆弱性を狙ったランサムウェアについて

JPCERT/CCより、2023-02-07にESXiの脆弱性についての情報が提供されています。

> VMware ESXiを標的としたランサムウェア攻撃について
 <https://www.jpcert.or.jp/newsflash/2023020601.html>

既知のOpenSLPのヒープオーバーフローの脆弱性（CVE-2021-21974）を悪用した攻撃とみられ、攻撃を受けるとファイルが暗号化され身代金の支払いを求めるメッセージが残されます。

上記で指摘されている脆弱性の対象（CVE-2021-21974）は、以下のとおりです。

VMware ESXi 7.0系Update 1cより前のバージョン（ESXi70U1c-17325551パッチ未適用）
VMware ESXi 6.7系ESXi670-202102001より前のバージョン（ESXi670-202102401-SGパッチ未適用）
VMware ESXi 6.5系ESXi650-202102001より前のバージョン（ESXi650-202102101-SGパッチ未適用）
VMware Cloud Foundation 4系4.2より前のバージョンに含まれるESXi
VMware Cloud Foundation 3系KB82705未適用のバージョンに含まれるESXi

随分以前のパッチのU1cが適用されていれば問題はありません。基本的にサポート切れのESXi6.7を運用することは論外としても、適宜、ESXi7.0において、パッチを適用していれば安全です。最新パッチが適用された状態で、今回問題となったOpenSLPについては未稼働であることが確認できます。

``` bash
[root@esxi2:~] esxcli system slp stats get
SLP service is not running.
```

## パッチ適用に必要なもの

SSHでESXiに接続し、コマンドラインでパッチを適用します。Windows10ではOpenSSHがサポートされていますので、{% label primary@オプション機能を追加する %}から{% label primary@OpenSSHクライアント %}を有効にし、コマンドラインから`ssh  root@ESXiのIPアドレス`で接続可能です。

## VMwareのパッチ情報

ESXiのパッチ情報は以下を参照してください。当該ページの左ペインメニューには最新パッチの情報が掲載されていますので、最新のパッチ情報を辿ってください。また、過去のパッチの情報も提供されています。

> VMware ESXi 7.0 Update 3k（2023-2-21発表）
 <https://docs.vmware.com/en/VMware-vSphere/7.0/rn/vsphere-esxi-70u3k-release-notes.html>

1月末にUpdate3jが出たばかりですが、Windows Server 2022仮想マシンにWindows Updateを実施すると起動に失敗するというケースの対応になります。

>UEFIセキュアブートを使用するWindows Server 2022仮想マシンにWindows Update KB5022842をインストールすると、そのようなVMが起動に失敗する可能性があります。Windowsアップデートパッケージは、UEFIセキュアブートが誤って拒否するEFIブートローダに新しい形式のデジタル署名を提供します。その結果、仮想マシンは起動可能なオペレーティングシステムを見つけることができず、起動しない可能性があります。

>この問題はこのリリースで解決されました。すでに問題に直面している場合は、ホストをESXi 7.0 Update 3kにパッチを当てた後、影響を受けるWindows Server 2022 VMの電源を入れるだけです。

## 製品パッチの情報を入手する

ESXiのセットアップ時にCustomer Connectへの登録を行い、個人向けvSphere Hypervisorのライセンス（無償）を入手されている事を前提にしています。

**VMware Customer Connect**にサインインし、{% label primary@製品とエンタイトルメント　アカウント %}メニューから、"製品パッチ"を選択します。
> VMware Customer Connect
 <https://customerconnect.vmware.com/jp>

{% asset_img myvm3.png alt %}

さらに、"ESXi"とバージョンの"7.0"を選択し"検索"ボタンをクリックすると、パッチの一覧が表示されます。以下は7.0U3kの画面です。

{% asset_img myvm2.png alt %}

基本的にESXiは7.0のバージョンのまま修正パッチを適用する場合はこの7.0という2桁の数字は変わりません。この数字が変わる更新をアップグレードと呼びます。それ以外の小さい更新をパッチまたはアップデートと呼びます。但し、ESXi7.0の場合はUpdate2,Update3というグループがあり、さらにUpdate3j、Update3kという具合にグループ単位でパッチ毎に末尾の英字が大きくなっていきます。VMwareのパッチは累積パッチとなるため、最新のパッチを適用するだけでよく、古いパッチの適用は必要ありません。ここでは最新版のパッチをダウンロードします。

## パッチ適用作業

ESXiにログインし、以下の作業を行います。
- SSHを有効にします
- 仮想マシンを全てシャットダウンします
- ESXiをメンテナンスモードに切り替えます
- ダウンロードしたパッチファイル（ZIPファイル）をESXiにアップロードします
- SSHでESXiにログインします
- パッチ適用コマンドを入力、リブートします
- メンテナンスモードを終了します
- SSHを無効にします
- 仮想マシンを起動します

1. SSHを有効にする
 ESXiの左ペインの{% label primary@ホストー管理 %}から、"サービス"のタブをクリックし、"TSM-SSH"を選択し"起動"ボタンをクリックし、SSHを有効にします。
 {% asset_img esxi1.png alt %}

2. 仮想マシンを全てシャットダウンします

3. ESXiをメンテナンスモードに切り替えます
 {% asset_img esxi2.png alt %}

4. パッチファイルのESXiへのアップロード
 ESXiの左ペインメニューの"ストレージ"を選択、メインのストレージ（一般的にはdatastore1）を選択し、"データストアブラウザ"をクリックします
 {% asset_img esxi3.png alt %}
 {% label primary@アップロード %}ボタンをクリックし、ダウンロードしたパッチファイルをZIPのままアップロードします。ここの例では{% label primary@ディレクトリの作成 %}ボタンでupdateフォルダを作成し、そこにアップロードします。

5. SSHでESXiにログイン
 ログイン後、パッチをアップロードしたフォルダ（datastore1/update）に移動しアップロードしたパッチファイルが存在するか`ls`で確認します
 ``` bash
  The time and date of this login have been sent to the system logs.

  WARNING:
    All commands run on the ESXi shell are logged and may be included in
    support bundles. Do not provide passwords directly on the command line.
    Most tools can prompt for secrets or accept them from standard input.

  VMware offers supported, powerful system administration tools.  Please
  see www.vmware.com/go/sysadmintools for details.

  The ESXi Shell can be disabled by an administrative user. See the
  vSphere Security documentation for more information.
  [root@esxi:~] cd /vmfs/volumes/datastore1/update
  [root@esxi:~] ls
 ```

6. パッチ適用コマンドを入力します
 新しいドライバやバグフィックス、セキュリティパッチなど含めたprofileとして整合性が取れたvibのアップデートはprofile updateを実行します。ここでは、ESXi7.0Update3iからUpdate3jにアップデートすることを例にします。

 現在の実行中のprofileを確認します。`esxcli software profile get`
 ``` bash
[root@esxi2:] esxcli software profile get
(Updated) ESXi-7.0U3j-21053776-standard
   Name: (Updated) ESXi-7.0U3j-21053776-standard
   Vendor: VMware, Inc.
   Creation Time: 2023-02-06T21:55:51
   Modification Time: 2023-02-23T08:28:20
   Stateless Ready: True
 ```

 一般的にはバージョンの最後に"-standard"の文字が付いています。standard版がインストールされている事を示します。
 次に、パッチファイルに登録されているprofileを確認します（パッチはフルパス指定が必要です）。
 ``` bash
[root@esxi2] esxcli software sources profile list -d /vmfs/volumes/datastore1/update/VMware-ESXi-7.0U3k-21313628-depot.zip
Name                           Vendor        Acceptance Level  Creation Time        Modification Time
-----------------------------  ------------  ----------------  -------------------  -----------------
ESXi-7.0U3k-21313628-standard  VMware, Inc.  PartnerSupported  2023-02-21T00:00:00  2023-02-21T00:00:00
ESXi-7.0U3k-21313628-no-tools  VMware, Inc.  PartnerSupported  2023-02-21T00:00:00  2023-02-18T08:57:33
 ```

VMWare Toolsを含まないProfileであるno-tools、VMWare Tools付きのstandard版となります。
VMWare Toolsを使う一般的なユーザーはNo Tools版を選択しないので除外します。

以下のようにパッチファイルのzipをフルパスで指定し、VMwareのパッチ情報にあるプロファイル名を指定しパッチを適用します。ここではstandardを指定します。
 ``` bash
  [root@esxi:~] esxcli software profile update -d /vmfs/volumes/datastore1/update/VMware-ESXi-7.0U3k-21313628-depot.zip -p ESXi-7.0U3k-21313628-standard
 ```
 1. `esxcli software profile update`の実行後しばらくしてから、結果が表示されます。
 ```
Update Result
   Message: The update completed successfully, but the system needs to be rebooted for the changes to be effective.
   Reboot Required: true
 ```

1. コマンドプロンプトから、`reboot`としてESXiを再起動します。

2. 再起動完了後、ESXiにログインします。左ペインメニューの"ホスト"をクリックし、バージョンの表記に今回パッチを当てたビルド番号が表示されている事を確認してください。今回はU3kとなっているはずです。

 - ESXi7.0
  {% asset_img esxi5.png alt %}

  または、sshでESXiに接続し、`vmware -v`を実行し確認します。

 ``` bash
[root@esxi2:~] vmware -v
VMware ESXi 7.0.3 build-21313628
 ```

4. 最後にこれまで実施してきたメンテナンス準備とは反対の作業をします。メンテナンスモードの終了・SSHの無効化・仮想マシンの起動と続けます。

## パッチのロールバック

あまり考えたくはありませんが、パッチ適用後、うまく動作しないなどの場合にはロールバックします。ESXiはひとつ前のバージョンに戻せます（アップグレードの場合は戻せない場合があります）。
ESXiホストを再起動し、起動中にShift+’R'キーを押します。

> VMware ESXi を前のバージョンに戻す (1033604)
 <https://kb.vmware.com/s/article/1033604?lang=ja>

 >Hypervisor のプログレス バーの読み込みが開始されたら、Shift+R を押します。(これはバーが表示されたロード後ではなく、ロード中に実行する必要があります。コマンドを実行するタイミングを逃さないよう、"system is preparing to boot" 表示中に Shift+R を繰り返し押すことをお勧めいたします)。

 以下の通り、今動いているビルド番号と前のビルド番号が表示されます。

{% asset_img rollback.png 1024 alt %}

ここでロールバックを選択します。

## 構成情報のバックアップ（任意）

今後、パッチ適用を重ねていきますが、ある時点にロールバックしたいと思った時に、ホスト構成バックアップから戻す必要が出てきます。パッチを当てる度に構成情報のバックアップを取得されることをお勧めします。

参考にするドキュメントはこちらです。

> ESXi ホストの構成のバックアップ方法 (2042141)
 <https://kb.vmware.com/s/article/2042141?lang=ja>

1. SSHでESXiに接続します。
2. ストレージの確実な同期のためのコマンド`vim-cmd hostsvc/firmware/sync_config`を実行します。
3. バックアップコマンド`vim-cmd hostsvc/firmware/backup_config`を実行します。
4. 画面にダウンロードパスが表示されるのでそのURLにブラウザから接続し構成情報をダウンロードします。

``` bash
[root@esxi:~] vim-cmd hostsvc/firmware/sync_config
[root@esxi:~] vim-cmd hostsvc/firmware/backup_config
Bundle can be downloaded at : http://*/downloads/52ce000f-cad4-20c0-078d-a111fa1ad82x/configBundle-esxi.local.tgz
[root@esxi:~]
```

先頭に`http://*/`とありますが、ここはESXiのホスト名またはIPアドレスを指定しブラウザからアクセスします。例えば、`http://192.168.1.1/downloads〜`という具合です。万が一レストアが必要になってしまった場合はバックアップを取得したバージョンのパッチを適用の上、メンテナンスモードに移行してから`vim-cmd hostsvc/firmware/restore_config /your_backup_location/configBundle-esxi.local.tgz`で戻します。バックアップを取得してから既にハードウェア構成が変わっていたりする場合は戻せない場合があります。仮想マシンはデータストアブラウザから再登録する必要があります。詳細は上記VMwareのドキュメントを参照してください。
