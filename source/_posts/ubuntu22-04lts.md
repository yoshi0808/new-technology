---
title: Ubuntu22.04LTSをESXiにセットアップする
date: 2022-09-23T09:00:00+09:00
tags:
- ESXi
- Ubuntu
categories: Software
---
{% asset_img title.png 1024 alt %}

<p class="onepoint">この記事で実現すること</p>

この記事では24時間稼働させるサーバーとして、intel/AMDの**ESXi**上にUbuntuをセットアップするケースを想定しています。従来のSSHで接続するコマンドラインベースだけではなく、WindowsやmaOSから**GUIで接続するUbuntu環境**になります。長期サポートの最新バージョンであるUbuntu22.04LTSを仮想環境であるESXi7.0上に導入します。リモートデスクトップに相当するクライアントソフトウェアはESXiに付属する**VMware Remote Console**(VMRC)を使います。Ubuntu22.04LTSのEOLは2027年4月であり、十分に長い期間のサポートがあります。
<!-- more -->

## ESXiにおけるUbuntuのセットアップのポイント

サーバーとして動作させるUbuntuをESXiおよびVMRCで仮想マシンを操作する事のメリットはトラブルに強いという事でしょうか。直接ハードウェアにインストールする（いわゆるベアメタル）方式ですと、IPアドレス周りの設定変更で失敗するとSSHで繋がらなくなり、ディスプレイに本体を繋いでリカバリするなど面倒です。VMRCはESXi本体に接続し操作するため、仮想マシン上のネットワークがダウンしていても操作可能です。特に複数VLANに跨いだ環境を構築したり、ファイアウォール(ufw)を設定する場合はトラブルになりやすいため、復旧しやすい構成を目指します。

Requirements:

Ubuntu Desktop Edition
2 GHz dual core processor
4 GiB RAM (system memory)
25 GB (8.6 GB for minimal) of hard-drive space (or USB stick, memory card or external drive but see LiveCD for an alternative approach)
VGA capable of 1024x768 screen resolution
Either a CD/DVD drive or a USB port for the installer media
Internet access is helpful

> Ubuntu documentation
 <https://help.ubuntu.com/community/Installation/SystemRequirements>

実際には、動かすアプリケーションを想定し、CPU、メモリ、ストレージを増やしておくことになるでしょう。ここでは、一例として、2vCPU、4GBメモリ、64GBストレージで進めます。

また、Ubuntuのパッチ管理のために、Ubuntu Oneアカウントの申請および、ライセンス（個人利用は無償）の取得が必要となります（後述します）。

環境面の前提としては、仮想マシンからDHCPでIPアドレスおよびDNSが取得でき、インターネットに接続可能な環境とします。

## Ubuntu22.04LTSのダウンロード

最初にUbuntu22.04LTSのダウンロードを行います。日本語Remix版を利用します。

>Ubuntu 22.04 LTS 日本語Remix
 <https://www.ubuntulinux.jp/News/ubuntu2204-ja-remix>
 ファイル名は「ubuntu-ja-22.04-desktop-amd64.iso」です。

## ESXiで仮想マシンを作成する

### ESXiへのisoファイルのアップロード

ESXiのWebUIにログインします。
ESXiの左ペインメニューの{% label primary @ストレージ %}から{% label primary @データストアブラウザ %}を開き、そこにダウンロードしたUbuntuのisoファイル（ubuntu-ja-22.04-desktop-amd64.iso)をアップロードします。

### ネットワークポートグループの作成（任意）

Ubuntuのネットワークで使うESXiのポートグループを用意します。新しく作成する場合は、左ペインメニューの{% label primary @ネットワーク %}から{% label primary @ポートグループの追加 %}を選択し、該当するvSwitch上に新しいポートグループを作成します。

### 仮想マシンの作成

左ペインメニューの{% label primary @仮想マシン %}から、{% label primary @仮想マシンの作成/登録 %}をクリックし、{% label primary @新規仮想マシンの作成 %}を選択します。ここでは仮想マシンの名前と仮想マシンのバージョンによる互換性とゲストOSの種類を指定します。互換性は特に理由がなければ一番新しいものを選んでください。{% label primary @ゲストOSファミリ %}は"Linux"を、{% label primary @ゲストOSのバージョン %}は"Ubuntu Linxu(64ビット）"を選択します。
{% asset_img ubuntu1.png 800 alt %}

続いて仮想マシンを作成するストレージを選択します。
{% asset_img ubuntu1-1.png 800 alt %}


{% label primary @設定のカスタマイズ %}では、{% label primary @仮想ハードウェア %}と{% label primary @仮想マシンオプション %}があります。{% label primary @仮想ハードウェア %}のタブでは、CPU、メモリ、ディスク、ネットワークアダプタ（上記で作成したポートグループ）を指定し、CD/DVDドライブの場所でUbuntuのisoファイルを選択します。ネットワークアダプタが10GbEの場合は、{% label primary @ネットワークアダプタ1 %}のプルダウンをクリックして"VMXNET3"が選択されていることを確認してください。
{% asset_img ubuntu2.png 800 alt %}

{% label primary @仮想マシンオプション %}の画面に移動し、VMWare Toolsのプルダウンを開き、{% label primary @Toolsのアップグレード %}の{% label primary @パワーオン前に毎回VMware Toolsをチェックしてアップグレード %}のチェックボックスをオンにします。また、{% label primary @起動オプション %}では{% label primary @ファームウェア %}に"EFI"を選択し、{% label primary @この仮想マシンに対してUEFIセキュア ブートを有効にするかどうかを指定します %}のチェックボックスをオンにします。セキュアブートは必須ではありませんが、セキュリティ向上のためにお勧めします。

{% asset_img ubuntu3.png 800 alt %}

完了させたら、左ペインメニューの{% label primary @仮想マシン %}から、対象の仮想マシンを起動します。もし、クライアント端末（Windows,macOS）にVMRCをダウンロードしていなければダウンロードし、クライアント上でセットアップしておきます。
{% asset_img ubuntu3-1.png 800 alt %}

{% label primary @仮想マシン %}を{% label primary @パワーオン %}し、{% label primary @リモートコンソールを起動 %}します。VMRCのセットアップが完了していれば以下のようなウィンドウがブラウザから独立して起動します。

{% asset_img ubuntu4.png 800 alt %}

{% label primary @Ubuntuをインストール %}を選択します。

### Ubuntuのセットアップ

最初は、キーボードレイアウトを選択します。下記の例ではJapanese(Macintosh)が選択されていますが、日本語キーボードのmacOSや一般的なWindowsの日本語キーボードは一番上の"Japanese"が一般的です。{% label primary @キーボード入力をここで試してください %}で実際のキー入力が確認できるのでここで試してから選択しましょう。インストール後にいつでも変更できます。

{% asset_img ubuntu5.png 800 alt %}

ここでは{% label primary @最小インストール %}を選択します。なお、ESXiの場合、サードパーティのドライバはここでは選択する必要はありません。最初の仮想マシン作成時に、VMware Toolsをインストールするように指示しましたから、"open-vm-tools"が自動的にインストールされます。
{% asset_img ubuntu6.png 800 alt %}

ここでは{% label primary @ディスクを削除してUbuntuをインストール %}を選択し"インストール"ボタンをクリックします。仮想マシン作成時に設定した64GBのディスクを初期化します。
{% asset_img ubuntu7.png 800 alt %}

住んでいる場所を指定します。

{% asset_img ubuntu8.png 800 alt %}

ホスト名、ユーザー名を設定します。ここで設定するホスト名・ユーザー名を使ってSSHで接続します。
{% asset_img ubuntu9.png 800 alt %}
{% asset_img ubuntu9-1.png 800 alt %}

インストールは完了です。再起動後、下記の画面が表示されるので、一旦Enterを押下します。
{% asset_img ubuntu9-2.png 800 alt %}

最初の起動画面です。ウェルカム画面というのでしょうか。初期案内のウィンドウが表示されます。
{% asset_img ubuntu10.png 800 alt %}
ここでは、Ubuntuシングルサインオンを行います。一旦、Ubuntuはこのままにして、クライアントのブラウザからUbuntuのOneアカウントサイトにアクセスします。
> One account for everything on Ubuntu
 <https://login.ubuntu.com>

ここでは、以下のようにアカウントを作成します。メールアドレス、フルネーム、ユーザー名、パスワードを入力します。このユーザー名はUbuntuへのログインユーザーと同じである必要はありません。
{% asset_img ubuntu12.png 800 alt %}

"Create account"ボタンをクリックし、アカウントを作成すると、登録したメールにコンファーメーションが行きますのでそこで確認のリンクをクリックしUbuntu Oneアカウントの登録は完了します。
{% asset_img ubuntu13.png 800 alt %}

続いて、再びUbuntuの画面に戻り、今作成したUbuntu Oneアカウントをここで入力します。
{% asset_img ubuntu11.png 800 alt %}

アカウントの照合がうまくいくと、キーリングの登録になります。これは第2パスワードというべき位置付けでもあり、Ubuntuにログインしていても重要な操作の前にはこのキーリングを求められます。Ubuntuをサーバーとして使うのであればGUIでログインする場合は設定変更が主な作業でしょうから、それなりの頻度で求められることになるためパスワード管理ソフトありきの長い覚えられないパスワードにすると実際の運用で大変になってしまうので注意してください。

{% asset_img ubuntu13-1.png 800 alt %}

さて、続いてUbuntuにパッチを適用する際のライセンスが必要です。Ubuntu22からはLivePatchに制限が付きます。個人アカウントは3台のUbuntuまでLivePatchが適用できます。このLivePatchが有効になっていると、可能な限りリブートなく最新パッチが自動的に更新される素晴らしい仕組みとなっています。
**UbuntuのFirefoxを起動**し、Ubuntu Advantageにアクセスします。

> Ubuntu Advantage
 <https://ubuntu.com/advantage>

Ubuntu Oneアカウントでログインします。

{% asset_img ubuntu15.png 800 alt %}

{% label primary @Free for personal use %}の"Register"をクリックします。

{% asset_img ubuntu16.png 800 alt %}

これで、パーソナルトークンが作成されました。{% label primary @Token %}に記載のある文字列をマウスで選択し、右クリックからコピーを選びます。

ウェルカム画面でUbuntu Oneのシングルサインオン完了後に次の画面に進むと、{% label primary @LivePatchのセットアップ %}に進みます。別の方法として、"ソフトウェアの更新"アプリケーションから{% label primary @設定 %}をクリックし、{% label primary @LivePatch %}のタブを選択することでも可能です。

{% asset_img ubuntu20.png 800 alt %}

{% asset_img ubuntu21.png 800 alt %}

{% label primary @LivePatchは再起動することなく。.. %}の表示とトグルスイッチがありますので、これをオンにします。
{% asset_img ubuntu22.png 800 alt %}

Ubuntu Advantageのトークンを貼り付けします。Ubuntu Advantageの更新は少しタイムラグがあるようで、Tokenの作成直後は登録がうまく行かない場合があるので、その場合は数時間待ってください。

{% asset_img ubuntu19.png 800 alt %}


### Open SSH Serverのインストール

UbuntuにSSHするために必ず必要なモジュールです。GUIでコマンドを扱うには{% label primary @端末 %}というアプリケーションを起動します。 そこからopensshをインストールします。

``` bash
$ sudo apt update
$ sudo apt install openssh-server

パッケージリストを読み込んでいます... 完了
依存関係ツリーを作成しています... 完了
状態情報を読み取っています... 完了
以下の追加パッケージがインストールされます:
  ncurses-term openssh-sftp-server ssh-import-id
提案パッケージ:
  molly-guard monkeysphere ssh-askpass
以下のパッケージが新たにインストールされます:
  ncurses-term openssh-server openssh-sftp-server ssh-import-id
アップグレード: 0 個、新規インストール: 4 個、削除: 0 個、保留: 0 個。
751 kB のアーカイブを取得する必要があります。
この操作後に追加で 6,046 kB のディスク容量が消費されます。
続行しますか? [Y/n] Y
```

Ubuntuで{% label primary @端末 %}アプリケーションを起動する場合、キーボードショートカットによる起動が便利です。セットアップ時のキーボードの選択によって内容は変わりますが、Widnowsは"Ctrl"+"Alt"+"T"で起動します。macOSでは"option"+"control"+"T"で起動します。

## 任意設定

### VMRCとクライアントとのCopy -Paseteを連携する

WindowsやmacOSでブラウザで検索した結果をUbuntu上で貼り付けたい場合があります。この場合は仮想マシンをシャットダウンし、仮想マシンのオプションから以下のパラメータを設定します。


``` bash
 isolation.tools.copy.disable          FALSE
 isolation.tools.paste.disable         FALSE
 isolation.tools.setGUIOptions.enable  TRUE

```

{% asset_img ubuntu25.png 800 alt %}

> Copy & Pasetを有効にする
 <https://kb.vmware.com/s/article/57122>

### フォルダのパスを英語に変更する

``` bash
$ LANG=C xdg-user-dirs-gtk-update
```

{% asset_img ubuntu24.png 480 alt %}

{% label primary @Don't ask me this again %}をチェックし、"Update Names"をクリックします。

## VMRCの便利な起動方法

ESXiで該当する仮想マシンを開き、URLを確認すると、URLの末尾に仮想マシンNoとも言える2桁の番号が振られています。

{% asset_img esxi1.png 640 alt %}

この数字を使って以下のURLをブラウザのお気に入りに登録しておくことによって、ESXiの画面にログインしてから仮想マシンにアクセスすることなく、直接VMRCを起動し仮想マシンにアクセスできます。

`vmrc://[ユーザー名]@[ESXiのホスト名]/?moid=[仮想マシンNo]`
例：
`vmrc://root@192.168.1.1/?moid=20`

### セットアップ完了

ESXiにおけるUbuntu22.04LTSのセットアップは完了です。最後に、仮想マシンのバックアップを取得されることをお勧めします。Linuxには個人ユーザー向けの有力なウィルス対策ソフトが存在しないため、色々なサイトをブラウジングするには多少抵抗がありますが、限られたパッケージシステムのみをインストールし、自宅内のサーバーとして利用するにはESXiとの組み合わせは最適です。バックアップやスナップショットを活用し、トラブル時には迅速にロールバックできる環境はとても便利です。

- {% post_link esxi-backup %}
- {% post_link esxi-nakivo %}