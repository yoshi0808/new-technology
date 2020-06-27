---
title: VMware ESXi6.7にパッチを適用する
tags:
  - ESXi
categories:
  - Software
date: 2020-06-14 22:19:20
---

{% note success  %}

## この記事で実現すること

無償版ESXi6.7（VMware vSphere Hypervisor6.7）について、VMwareのサイトから製品パッチに関する情報を入手し、ESXi上でパッチを適用します。

{% endnote %}

<!-- more -->

## パッチ適用に必要なもの

SSHでESXiに接続し、コマンドラインでパッチを適用します。クライアントPCからSSH接続が行えるクライアントアプリケーションを用意してください。Windowsでは昔から有名なのはTera Termですが、その他にも無償で利用可能な[Termius](https://www.termius.com)などがあります。

## VMwareのパッチ情報

ESXi6.7のパッチ情報は[こちら](https://docs.vmware.com/jp/VMware-vSphere/6.7/rn/esxi670-202006001.html)です。このリンクは現時点で最も新しいパッチ（2020年6月9日）のリンクとなっていますが、過去のパッチの情報も提供されています。内容は不具合や脆弱性など様々ですが、このページでESXiのパッチの提供情報がわかります。

## My VMwareで製品パッチの情報を入手する

ESXiのセットアップ時にMy VMwareへの登録を行い、個人向けvSphere Hypervisorのライセンス（無償）を入手されている事を前提にしています。

[My VMware](https://my.vmware.com/jp/web/vmware/login?)にサインインし、{% label @製品 %}メニューから、"製品パッチ"を選択します。

{% asset_img myvm1.png alt %}

さらに、"ESXi"とバージョンの"6.7"を選択し"検索"ボタンをクリックすると、パッチの一覧が表示されます。

{% asset_img myvm2.png alt %}

基本的にESXiは6.7のバージョンのまま修正パッチを適用する場合はこの6.7という2桁の数字は変わりません。この数字が変わる更新をアップグレードと呼びます。それ以外の小さい更新をパッチまたはアップデートと呼びます。VMwareのパッチは累積パッチとなるため、最新のパッチを適用するだけでよく、古いパッチの適用は必要ありません。ここでは最新版のパッチをダウンロードします。上記の画面では、2020年6月9日に"ESXi670-202006001"が提供されていますので、こちらをダウンロードしておきます。また作業確認後、パッチが適用された確認のためパッチのビルド番号を利用するので、ビルド番号（今回は"16316930"）を控えておいてください。

## ESXi上のパッチ適用作業

ESXiにログインし、以下の作業を行います。
1. SSHを有効にします
2. 仮想マシンを全てシャットダウンします
3. ESXiをメンテナンスモードに切り替えます
4. ダウンロードしたパッチファイル（ZIPファイル）をESXiにアップロードします
5. SSHでESXiにログインします
6. パッチ適用コマンドを入力、リブートします
7. メンテナンスモードを終了します
8. SSHを無効にします
9. 仮想マシンを起動します

- SSHを有効にする
 ESXiの左ペインの{% label @ホストー管理 %}から、"サービス"のタブをクリックし、"TSM-SSH"を選択し"起動"ボタンをクリックし、SSHを有効にします。
 {% asset_img esxi1.png alt %}

- 仮想マシンを全てシャットダウンします

- ESXiをメンテナンスモードに切り替えます
 {% asset_img esxi2.png alt %}

- パッチファイルのESXiへのアップロード
 ESXiの左ペインメニューの"ストレージ"を選択、メインのストレージ（一般的にはdatastore1）を選択し、"データストアブラウザ"をクリックします
 {% asset_img esxi3.png alt %}

 アップロードボタンをクリックし、ダウンロードしたパッチファイルをアップロードします。

- SSHでESXiにログイン
 ログイン後、パッチをアップロードしたフォルダ（*Datastore/DirectoryName*）に移動しアップロードしたパッチファイルが存在するか`ls`で確認します

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
[root@esxi:~] cd /vmfs/volumes/Datastore/DirectoryName
[root@esxi:~] ls
```

- パッチ適用コマンドを入力します
 コマンドは、esxcli software vib update -d "/vmfs/volumes/*Datastore/DirectoryName*/*patchName*.zip"となります。パッチファイルはフルパスで指定する事になります。従い、以下のコマンドを入力します。
 ``` bash
 [root@esxi:~] esxcli software vib update -d "/vmfs/volumes/Datastore/DirectoryName/ESXi670-202006001.zip"
 ```

 実行後しばらくしてから、たくさんの更新結果としての文字の羅列が一気に表示され、再びコマンドプロンプトになるので、`# reboot`としてESXiを再起動します

- 再起動完了後、ESXiにログインします。左ペインメニューの"ホスト"をクリックし、バージョンの表記に今回パッチを当てたビルド番号が表示されている事を確認してください

 {% asset_img esxi4.png alt %}

- 最後にこれまで実施してきたメンテナンス準備の反対の作業を行います。メンテナンスモードの終了・SSHの無効化・仮想マシンの起動と続けます

以上で、ESXiに対するパッチ適用の作業は完了です。

## My VMwareの通知設定

パッチが提供された場合に通知を受けられるようにMyVMwareの通知設定を行っておく事をお勧めします。
