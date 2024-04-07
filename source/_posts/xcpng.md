---
title: XCP-ngとXen Orchestra
date: 2024-04-07T09:00:00+09:00
tags:
 - XCP-ng
categories:

---

{% asset_img title.png 1024 alt %}

<p class="onepoint">この記事で実現すること</p>
ESXi代替としての仮想環境ソフトウェアのXCP-ng、またそのオペレーションをGUIで支援するXen Orchestraの概要およびセットアップを行います。Xen Orchestraは有償ソフトウェアですが、オープンシステムとして提供されており、コンパイル、ビルドすることで無償で利用できます。

<!-- more -->

## ESXi代替としてのXCP-ng

無償版ESXiが新規で利用できなくなった現在、個人向けの仮想化基盤としての代替ソフトウェアはProxmoxが有力です。インストールも簡単でVMの作成までに迷うことが殆どありません。私個人としては、ProxmoxはあくまでPCという領域の範囲で便利なソフトウェアという認識を持っています。モジュールの更新が`apt update`であったり、バックアップ一覧がファイル名を意識させるものであったり、どこかでLinuxの延長として見てしまうところにあるのでしょうか。
個人向けであっても、仮想環境は、運用面における信頼性、保守性は重要と考えるユーザーには、もう1つの選択としてXCP-ngが候補となります。

XCP-ngはフランスのVatesという会社が提供しているプロダクトで、Citrix社のXenを引き継いで（技術提供を受けて）仮想環境の運用面と安定性を重要視して構築されているオープンシステムです。ESXiやProxmoxと比較し、CPU、メモリなどの基本的なスループットは劣ります。しかし、VM同士が互いに確実に分離され安定性が高いという意味においてはESXi同等です。KVMやProxmoxはメモリアクセスの観点では明確な分離が行われていないのでスループットは高くなります。

つまりXCP-ng、Proxmoxはそれぞれの良さがあり、選択するのはユーザー次第です。1台のみでお手軽な仮想環境を作るのであれば、Proxmox一択となるでしょう。一方で2台以上、障害時のフェールオーバーを想定したり、バックアップなどの運用を重視するのであればXCP-ngのメリットが出てきます。XCP-ngは単純に仮想マシンが動作するリソースとなるサーバーであり、それを操作するのは別途XenOrchestraというGUIツールが必要でこれは別ノードのLinux上に構築します。従い3台構成が1つの目安となります。1台はProxmoxまたはベアメタルでXenOrchestraをセットアップし、別のノードにXCP-ngをセットアップすることになります。最低構成は2台です。もちろん最終的にXenOrchestraのLinux-VMをXCP-ngにインポートすれば1台でXCP-ng+XenOrchestraを運用可能です（障害発生時はその回復に手間が掛かりますが）。

ホームユーザーとして本格的な連続稼働を前提として仮想環境を利用される場合に検討対象となります。

{% asset_img XCP-ng1.png 360 alt %}

## 現時点で未解決の事項

### Ryzen CPUと主要Linuxディストリビューション

なお、1か月ほどRyzen環境でXCP-ngを試行錯誤しましたが、主要なLinux distribution（Ubuntu,Debian,Mint）のiperf3のスループットが不十分な状況であり、解決できませんでした。インターネットに対する接続のspeedtestは4Gbps-5Gbps程度出ている状況でこちらは全く問題がなく、原因がよく分かっていません。
Ryzen5 5600G、Ryzen9 7900と2種類のPCを用意して最新のバージョン8.2.1および8.3ベータで検証しましたがいずれもiperf3では送信ネットワークスループットが2Gbps程度でした。RyzenでもCPUの種類によっては高速に動作するようですが、巷に事例としてあるのは限られたCPUとマザーボードとの組み合わせのみになるようです。例外的に、Rocky LinuxだけはRyzenでも全く問題はなくiperf3でワイヤレートの速度が出ます。Windowsに関しては検証できていません。

結局、5年ほど前に稼働していたIntel(R) Core(TM) i7-8700 CPU @ 3.20GHz（6Core 12Thread）に加え、新規に12th Gen Intel(R) Core(TM) i5-12400（6Core 12Thread）を購入して主、従の関係を構築しました。なお、XCP-ngではintelのE Coreについて強くお勧めしないとのことです。こういった情報は原則、コミュニティから収集することになります。Vates社は有償サポートで収益を上げるモデルを選択していますが、コミュニティ上での無償サポートも積極的です。

### VMのUEFI

XCP-ngの検証を始めた時にはVMのセキュアブートは設定できたと記憶しているのですが、現時点で設定可能であるものの、VMの情報からはUEFIに対応していないという表記が出ます。確かにUEFIモードで起動しているようなのですが、現時点でその影響は判明していません。特に運用上実害は出ていません。

## XCP-ngのモジュールや関連プロダクト

最新モジュールは、8.2.1です。ベータバージョンは8.3となります。8.3ベータはAMD CPU向けに色々追加されているのとIPv6の強化などが含まれています。バージョンの更新は非常にゆっくりと進んでいくので8.3ベータはこれで1年以上検証中の状態が続いています。
今後構成されるプロダクトとしてXCP-ngを簡易なGUIで操作するXO Liteというプロダクトがありますが、これはまだ機能的に不足していて使えません。また、過去利用されていたものにXCP-ng Centerというプロダクトがありますが、これも非推奨となっています。

> XCP-ng ドキュメント
 <https://docs.xcp-ng.org>

> XCP-ng フォーラム
 <https://xcp-ng.org/forum/>

## Xen Orchestra

Xen Orchestra(XOA)もVates社が製造しています。

{% asset_img xoa.png 1024 alt %}

XOAはターンキーアプライアンスという名目ですぐに使えると表現されています（車のキーを回してすぐに動く）。これは有償のソフトウェアであり、CitrixのXen Server、XCP-ngを操作するためのGUIクライアントです。セットアップも簡単でXCP-ngに対してコマンド1つでモジュールを送り込み内部でビルドされます。

これに対してホームユーザーが利用するものは同じXen Orchestraではありますが、ソースコードからコンパイルすることで無償で利用できます。これは一手間掛かりますが、公式に認められた方法であり、オープンソースという建て付けで無償で提供されているものです。
同じ、Xen Orchestraであっても、こちらはXOという表記がなされ、有償版と無償版はそれぞれ、XOA、XOと区別されます。

ここではXOの導入について説明をしていきます。XOはVMの構築、操作、バックアップ、スナップショット、マイグレーション（ノード間のVMの移動）を行います。

> Xen Orchestra ドキュメント
 <https://xen-orchestra.com/docs/>

なお、フォーラムはXCP-ngと共通です。

### XOの操作イメージ

ここで説明する環境は以下の通りです。

{% asset_img xo-xcp.drawio.png 640 alt %}

VMに対する操作はWebで行います。

{% asset_img xo1.png 1024 alt %}

これはUbuntuを動作させているところです。ネットワーク、ディスクの基本構成があります。ここでSSH　as userを選ぶとローカル端末のSSHで接続できます。スナップショットやバックアップはすぐに取得できます。ESXi同様にXCP-ng向けのVMToolを導入することで、IPアドレスの把握やXOからvmのシャットダウン、リブートが可能になります（ESXiとは異なり手動でインストールが必要です）。Advancedタグでは、メモリやCPUの上限などを可変できます。
バックアップは自動的にスナップショットを取得します。ログも確認が容易ですし、Google等を経由したメール通知もできます。
{% asset_img xo2.png 1024 alt %}

私の環境では10GbbpsのネットワークでXCP-ngからXOがデータを吸い上げ、それをNASにNFSで書き込んでいます。106MiB/sなのでお世辞にもバックアップが早いとは言えませんが、圧縮しながらなのでこんなところなのでしょうか。基本は日時指定でバックアップを取得することになるのであまり気になるような状況でもないでしょう。複数ノードを1つのジョブでバックアップできるため、ノードが多くあればその分利便性を感じられます。

XCP-ngは2種類のスナップショットの取得方法があります。通常のスナップショットはメモリの情報を保存しません。バックアップなどはこの方式が選択されます。もう一方はメモリの情報を含んだスナップショットであり、こちらは少しの間VMの応答ができません。セットアップ作業の合間にチェックポイントとして状態を保存したい場合は、後者を選択すると良いでしょう。

同じCPU（intel）同士であれば、ダウンタイムを最小にするライブマイグレーションが可能です。
{% asset_img xo3.png 1024 alt %}

表示が見切れているのでわかりづらいですが、ここでは同一のリソースプール（Pool1）における、1号機（XCP-ng1）から2号機（XCP-ng2）に対するマイグレーションを実施します。

この処理は最初に1号機から2号機への、ノード間でそれぞれのストレージ同士でコピー、その後動作したメモリの差分をコピーして完了させます。

Wi-Fiに接続されたMacbookから、XCP-ng上のUbuntuにiperf3を実行し、ほぼ同時にマイグレーションを開始してみます。

``` bash
[  5] 138.01-139.00 sec   174 MBytes  1.47 Gbits/sec
[  5] 139.00-140.00 sec   178 MBytes  1.49 Gbits/sec
[  5] 140.00-141.00 sec   174 MBytes  1.47 Gbits/sec
[  5] 141.00-142.01 sec   179 MBytes  1.50 Gbits/sec
[  5] 142.01-143.01 sec  78.4 MBytes   657 Mbits/sec
[  5] 143.01-144.00 sec  0.00 Bytes  0.00 bits/sec
[  5] 144.00-145.01 sec  0.00 Bytes  0.00 bits/sec
[  5] 145.01-146.01 sec  40.4 MBytes   339 Mbits/sec
[  5] 146.01-147.00 sec  73.2 MBytes   617 Mbits/sec
[  5] 147.00-148.00 sec  97.8 MBytes   818 Mbits/sec
[  5] 148.00-149.01 sec   112 MBytes   938 Mbits/sec
[  5] 149.01-150.00 sec   125 MBytes  1.05 Gbits/sec
[  5] 150.00-151.00 sec   130 MBytes  1.09 Gbits/sec
[  5] 151.00-152.00 sec   136 MBytes  1.14 Gbits/sec
```

2分20秒程度で1号機のノードとの応答が途絶え、それから約3秒後に2号機からiperf3の応答が再開されています。TCPセッションは切断されません。
もちろん共有Diskがあればもっとマイグレーションは高速になりますが、個人向けの安価なハードウェアでも、ここまで出来るのは素晴らしいことです。

## XCP-ngのインストール

8.2のインストールイメージは以下からダウンロードします。
<https://xcp-ng.org/#easy-to-install>

8.3ベータは以下からダウンロードします。
<https://xcp-ng.org/blog/2024/02/15/xcp-ng-8-3-beta-2/>

導入にあたっては、ハードウェアサポートのページをまず参照されることをお勧めします。
<https://docs.xcp-ng.org/installation/hardware/>

ここでは、問題が少ないと思われるintelマシンに対して8.2.1をインストールすることにします。ISOファイルをダウンロードし、RufusなどでUSBメモリにブートイメージを書き込みます。Rufus上でも特殊な設定は不要でデフォルト設定のまま書き込みます。XCP-ngはUEFIブートに対応していませんのでサーバーとなるPCのセキュアブートは無効にします。なお、稼働するVMはUEFIのセキュアブートにできます。

{% asset_img usb.png 360 alt %}

ハードウェアによって異なりますが、最初にGRUBの画面が表示され、以下の選択になります。
``` bash
*install
 install with alterate kernel(kernel-alt)
 no-serial
 safe
 multipath
 shell
 ```

基本は最初の`instal`で構いませんが、セットアップ時にストレージ（NVMe）が見えずセットアップ出来ない場合は、Alt Kernel（代替カーネル）を選択してみてください。

セットアップは以下の手順で進めます。

{% asset_img xcp1.png 800 alt %}
最初にキーボードを選択します。

{% asset_img xcp2.png 800 alt %}
セットアップの注意書き（お決まり）です。基本的にはこのままOKで進めていきます。

{% asset_img xcp3.png 800 alt %}
EULAに同意します。

{% asset_img xcp4.png 800 alt %}

ストレージを選択します（ここではキャプチャ確保のためにProxmox上で動作させているのでQEMUと表示されています）。
8.2のストレージはブロックベース（LVM）がデフォルトです。8.3以降はファイルベースになるようです。

{% asset_img xcp5.png 800 alt %}

インストール元としてlocal media(USB)を選択します。

{% asset_img xcp6.png 800 alt %}

インストールメディアの検証の確認です。どちらでも構いません。

{% asset_img xcp7.png 800 alt %}

メディア検証で問題なしというダイアログです。次に進みます。

{% asset_img xcp8.png 800 alt %}

パスワードを決めます。

{% asset_img xcp9.png 800 alt %}

IPアドレスを決めます。サーバーになるので、DHCPではなくStaticで固定IPアドレスにします。

{% asset_img xcp10.png 800 alt %}

XCP-ng自身のhostnameを決めます。hostnameの一部はランダムに命名されていますが、わかりやすいものに変えた方が良いです。DNSサーバーはご自身のDNS（ルーターまたはゲートウェイ）を指定します。

{% asset_img xcp11.png 800 alt %}

タイムゾーンは、Asia、Tokyoと指定します。

{% asset_img xcp12.png 800 alt %}
{% asset_img xcp13.png 800 alt %}

NTPを指定します。
ご自身の環境から近く、安定しているNTPサーバーを指定します。上記は指定の一例です。

{% asset_img xcp14.png 800 alt %}

最後に**Install XCP-ng**のボタンを押下します。

{% asset_img xcp15.png 800 alt %}

セットアップの進捗を示すダイアログが表示されています。

{% asset_img xcp16.png 800 alt %}

サプリメントパックをインストールするか聞かれますので、ここはNoを答えます。
その後インストールが継続します。

{% asset_img xcp17.png 800 alt %}

セットアップ完了です。USBメディアを取り外し、OKボタンを押下します。

セットアップ完了後再起動して以下の画面が表示されます。もしここまで上手く表示されない場合は、マザーボードのBIOSのアップデートをお勧めします。

{% asset_img xcp18.png 800 alt %}

XCP-ngにはインストール時に設定したマネジメントネットワークが1つ必要です。このマネジメントネットワークに対してXen Orchestraから接続され制御されることになります。
この状態でXCP-ngにはSSHできる状態になっています。または、このメニューの{% label primary@Local Command Shell %}を起動します。

VMがUEFIブートを可能とするため、以下のコマンドを入力します。
`$ secureboot-certs install`

``` bash
[11:31 xcp-ng3 ~]# secureboot-certs install
Downloading https://www.microsoft.com/pkiops/certs/MicCorKEKCA2011_2011-06-24.crt...
Downloading https://www.microsoft.com/pkiops/certs/MicCorUEFCA2011_2011-06-27.crt...
Downloading https://www.microsoft.com/pkiops/certs/MicWinProPCA2011_2011-10-19.crt...
Downloading https://uefi.org/sites/default/files/resources/dbxupdate_x64.bin...
Successfully installed certificates to the XAPI DB for pool.
[11:37 xcp-ng3 ~]#
```

ここまででXCP-ngのセットアップは一旦完了です。
NICを取り外して別のNICを取り付ける場合には、デバイス論理名（ex:eth0）とデバイスとの関連付けがずれてしまう場合があります。この際は以下のページを参考にしてください。

<https://docs.xcp-ng.org/networking/>

同じリソースプールでスムーズにVMの移動（ライブマイグレーション）を行う際は、同一の物理インタフェースが必要となります。もちろん同一製品である必要はありませんが、どのセグメントに属するか、速度タイプなどは同一にする必要があります。

## Xen Orchestraのインストール

XOのセットアップにはインターネットに接続されたLinuxが必要です。ここではXCP-ngとは別にUbuntu22を使ってXOのコンパイル、デプロイを実行していきます。
まず、ベアメタルかVMとしてのGUIのあるUbuntu Desktopを用意してください。私の例ではマネジメントネットワークに加え、バックアップのセグメント（SynologyへのNFS接続）とのvNICを2つ用意しています。1つのNICのみであってもXOのセットアップは可能です。
ここではProxmox上のUbuntuにXOをセットアップします。Proxmox上でのUbuntuのセットアップは「{% post_link Proxmox-new-vm %}」の記事を参考にしてください（XOをセットアップする想定でUbuntuを構築しています）。

クライアントからXOにブラウザで接続して使うことになるので、最初にubuntuのIPアドレスは固定IPアドレスにします。設定ーネットワークから有線設定を変更しておきます。
また、XOのセットアップ開始にあたり、最初にLinuxそのもののスナップショットを取得しておくとよいでしょう。

XOのセットアップには有志であるronivay氏が作成したXenOrchestraInstallerUpdaterを利用します。
<https://github.com/ronivay/XenOrchestraInstallerUpdater>

### 事前準備

Ubuntuの{% label primary@ソフトウェアとアップデート %}を起動し、{% label primary@Ubuntuのソフトウェア %}で{% label primary@ソースコード %}のチェックをオンにします。

{% asset_img xo4.png 640 alt %}

また、{% label primary@他のソフトウェア %}の一覧で{% label primary@ソースコード %}と記載されているものにチェックをオンにします。
{% asset_img xo5.png 640 alt %}

これ以降はShellでの操作となるので、SSHでクライアントから接続してコマンドを投入していった方が簡単です（コマンドのコピペが出来るので）。SSH ServerがUbuntuに入っていない場合は、以下のコマンドでインストールします。
`$ sudo apt install openssh-server`

Ubuntu DesktopでのShell操作、或いはクライアントからsshして以降の作業を行います（`ssh username@your-host`)。UbuntuのGUIで実施する場合は、{% label primary@端末 %}を起動します。

#### rootになる

`$ sudo -i`

#### gitのインストール

リポジトリを追加し、gitをインストールします。

``` bash
$ add-apt-repository ppa:git-core/ppa
$ apt update; apt install git
```

### XenOrchestraInstallerUpdaterのダウンロード、XOのインストール

GitHubからスクリプトをダウンロードし、cfgファイルのサンプルのコピーを作成します。

``` bash
$ git clone https://github.com/ronivay/XenOrchestraInstallerUpdater.git
$ cd XenOrchestraInstallerUpdater
~/XenOrchestraInstallerUpdater$ cp sample.xo-install.cfg xo-install.cfg
```

`xo-install.cfg`ファイルをviで開き、インストールパス、XOが待ち受けるPort、SSL自己証明書を指定します。
Ubuntuでは、インストールパスは`/usr/lib/`配下とします（お好みで変えてください）。

``` bash
~/XenOrchestraInstallerUpdater$ vi xo-install.cfg
```

3箇所の修正ポイントです。以下の行を見つけます。

``` bash
# Port number where xen-orchestra service is bound
# no effect to Xen Orchestra proxy
PORT="80"
```

PORT="80"をPORT="443"に変更します。

``` bash
# Port number where xen-orchestra service is bound
# no effect to Xen Orchestra proxy
PORT="443"
```

次に以下の行を見つけます。

``` bash
# Base dir for installation and future updates
INSTALLDIR="/opt/xo"
```

INSTALLDIR="/opt/xo"をINSTALLDIR="/usr/lib/xo"に変更します。

``` bash
# Base dir for installation and future updates
INSTALLDIR="/usr/lib/xo"
```

次に以下の行を見つけます。

``` bash
# Location of pem certificate/key files. Installation will automatically configure HTTPS if these are defined. Remember to change PORT variable as well.
#PATH_TO_HTTPS_CERT=$INSTALLDIR/xo.crt
#PATH_TO_HTTPS_KEY=$INSTALLDIR/xo.key
```

証明書のパスについて2箇所コメントを外します。
``` bash
# Location of pem certificate/key files. Installation will automatically configure HTTPS if these are defined. Remember to change PORT variable as well.
PATH_TO_HTTPS_CERT=$INSTALLDIR/xo.crt
PATH_TO_HTTPS_KEY=$INSTALLDIR/xo.key
```

以上でファイルの修正は終了ですので、保存しviを終了します。

Open SSLをインストールします。

``` bash
$ apt-get install openssl
```

自己証明書を生成します。
``` bash
$ openssl req -newkey rsa:4096 \
            -x509 \
            -sha256 \
            -days 3650 \
            -nodes \
            -out /usr/lib/xo/xo.crt  \
            -keyout /usr/lib/xo/xo.key
```

証明書の設定では以下、適当なものを入力しておきます。

``` bash
Country Name (2 letter code) [AU]:JP
State or Province Name (full name) [Some-State]:anywhere
Locality Name (eg, city) []:anywhere
Organization Name (eg, company) [Internet Widgits Pty Ltd]:yoshi
Organizational Unit Name (eg, section) []:none
Common Name (e.g. server FQDN or YOUR name) []:yoshi
Email Address []:yoshi0808.blog@gmail
```

スクリプトを起動します。`$ ./xo-install.sh`

``` bash
Xen Orchestra configuration will be stored to /root/.config/xo-server/config.toml, if you don't want it to be replaced with every update, set CONFIGUPDATE to false in xo-install.cfg
Xen Orchestra Proxy configuration will be stored to /root/.config/xo-proxy/config.toml. Config won't be overwritten during update, ever
-----------------------------------------

1. Install
2. Update
3. Rollback
4. Install proxy
5. Update proxy
6. Exit

：
```

Installの1を入力してEnterを押下します。必要なモジュール、ソースコードをダウンロードし、コンパイルに入ります。

``` bash
[info] xo-server and xo-web build takes quite a while. Grab a cup of coffee and lay back
```

ということで、コーヒーを淹れに行き、3分程度待ちます😊。
以下の表示が出たところで、rebootします。事後にはLinixのアプリケーションファイアウォールであるufwを有効にして443のみを開けると良いでしょう（GUIもあります）。

``` bash
[info] Starting xo-server...
 waiting for port to be open

       WebUI started in port 443. Make sure you have firewall rules in place to allow access.
       Default username: admin@admin.net password: admin

[info] Installation successful. Enabling xo-server service to start on reboot

root@xo:~/XenOrchestraInstallerUpdater# reboot
```

再起動してインストールは終了です。
上記のコメントにある通り、XOの画面からはユーザー:admin@admin.net、パスワード：adminでログインします。

### XOの初期設定

Ubuntuが再起動してきたら、ブラウザから`https://XOのIPアドレス/`としてXOのGUIに接続します。
ブラウザからは自己証明書の警告が表示されますが気にせず継続します。
無事、以下のログイン画面が表示されればインストールは成功です。

{% asset_img xo6.png 360 alt %}

デフォルトアカウントでログインします。
{% asset_img xo7.png 800 alt %}

ソースコードから作成されたものというダイアログが表示されます。OKをクリックして閉じます。また、画面上部には、"This version is not bundled with any support nor updates. Use it with caution. Why do I see this message?"と表示されていますが、これもサポートなしと理解して使っているので閉じます。そして、左ペインにXOA❓マークがありますが、これをクリックすると、Update❓という表示がされています。この？アイコンは削除できません。XOAはここからアップデートなどの処理が行えますが、これはXOAではなく、XOなのでこのサブメニューは使いません。無視して大丈夫です。

### ユーザーの作成とデフォルトアカウントの削除

左ペインの{% label primary@Settings %}から、{% label primary@Users %}を選択します。

{% asset_img xo8.png 1024 alt %}

上記画面から、ユーザー名、ユーザーの権限は"Admin"を選択、パスワードを入力して{% label primary@Create %}ボタンをクリックして管理者を作成します。

無事作成できたら、左ペインの一番下にあるサインアウトをクリックして、新しい管理者アカウントで入りなおします。
ログインできたら、デフォルトのアカウントを右側のゴミ箱アイコンをクリックして削除します。

任意の作業ですが、最初に仮想環境でスナップショットを取得していれば、ここまでは1つの区切りです。もう一度Linux全体のスナップショットを撮り直す、またはスナップショットは削除して再作成するなどしても良いでしょう。

## Xen OrchestraからXCP-ngへの接続

左ペインの{% label primary@Settings %}から{% label primary@Servers %}を選択します。

{% asset_img xo9.png 1024 alt %}

ここでXCP-ngのインストール時に決めたユーザー：root、パスワードをセットします。トグルスイッチの{% label primary@Unauthorized Certificate %}は今回作成した自己証明書なのでオンにします。先頭のLabelは自分のメモとしてサーバー名を入力しておきます。

{% label primary@Connect %}ボタンをクリックして接続します。うまくXCP-ngに接続できると{% label primary@Status %}がEnableの表示となります。

さて、この状態になると、恐らく左ペインの{% label primary@Home %}には、！マークが付いていると思われます。
{% label primary@ Home %}→{% label primary@Hosts %}と進むとサーバー名が表示されているのでこれをクリックします。

{% asset_img xo10.png 1024 alt %}

{% label primary@ Patches %}の部分に恐らく数十の数字が書かれていることと思われます。これはXCP-ngでまだ適用されていないパッチの数を示します。{% label primary@ Patches %}の項目をクリックして、{% label primary@ Install all patches %}ボタンをクリックしてパッチを適用します。適用後は、リブートが必要となります。画面右上のリサイクルマークのようなアイコンが再起動となるのでそれをクリックしてパッチの適用を完了させます。

{% asset_img xo11.png 360 alt %}

今はXCP-ngが1台だけですが、複数台を運用することになり、1つのリソースプールに存在する複数台のサーバーに順にパッチを適用する事になります。その際は、常にMasterとなっているサーバーを先にパッチ適用する必要があります。
XCP-ngの再起動が完了するとXOは自動的にXCP-ngに接続します。

## XCP-ngネットワークの確認

XCP-ngへの接続が完了したら、まず{% label primary@Home %}→{% label primary@Hosts %}と進みます。XCP-ngサーバーをクリックし、CPU/メモリ/ネットワークを確認しましょう。

{% asset_img xo14.png 1024 alt %}

ここで、{% label primary@PIFs %}というのはPhysical Interfaces（物理インタフェース）の意味です。Private Networkを作成すると、物理Portを指定してそこにVLANを定義するなどできます。そのようにすることで物理インタフェースにVLANタグの付いたパケットが流れます。XCP-ngがスイッチからタグ付きパケットを受け取り、VMにはPrivate Network（論理Port）経由でタグを剥がしてパケットをVMに渡します。またその逆でVMからタグなしのPrivate Network経由でパケットを受け取り、XCP-ngは該当の物理Portにタグ付きでパケットをスイッチに向けて送信します。

## ISOファイルを配置するSRの設定

VMを作成する前に、OSのISOファイルをアップロードするフォルダが必要です。これはXCP-ng上に作成します。つまりサーバー毎に必要です。大量に利用するなら、NASなどのNFSを用意してそこにマウントできます。ここではとりあえずXCP-ngのローカル上にSR(Storage Repository)を作成します。

以下のVates社のブログを元に構成します。
<https://xcp-ng.org/blog/2022/05/05/how-to-create-a-local-iso-repository-in-xcp-ng/>

ちょうどこの記事を見ていただくと、このブログの最後に記事を書いた方の情報があります。Olivier Lambert氏、Vates社の起業者でありCEOです。Forumにも頻繁にコメントされています。

{% asset_img xo12.png 480 alt %}
このようにStorage TypeはISO SRのlocalとして作成します。パスは/media固定です。

次に左ペインの{% label primary@Import %}→{% label primary@Disk %}をクリック、対象のXCP-ngサーバーの指定フォルダ（上記では"ISOs"）を選びます。その画面上でクライアント端末からISOファイルをDrag&Dropできます。

お疲れ様でした！これでXCP-ngとXEN Orchestraの基本設定は完了です。
次の記事で、**New VM**でVMの新規作成を行います。

この段階でXOがインストールされたUbuntuのOS毎のスナップショットは削除し、一度UbuntuのOSそのもののバックアップを取得されることをお勧めします。

## XOのアップデート

左ペインの{% label primary@About %}からXOのモジュールについてアップデート状況が確認できます。現時点ではコンパイルしたばかりなので、”Your Xen Orchestra is up to date ”という表示になっているはずです。
しばらく時間が経過するとこの表記はGitのMasterブランチに対して遅れを取っていきます。"You are not up to date with master. xx commits behind "という表記に変わります。かなり細かい単位でコミットされていきますが、Communityの情報を見ながら適宜アップデートする事になります。この際もコンパイルが必要です。最初にXenOrchestraInstallerUpdaterでInstallを選びましたが、再びスクリプトからUpdateを実行することで常にXOは最新モジュールとなります。

``` bash
$ sudo -i
$ cd XenOrchestraInstallerUpdater
$ git pull origin master
$ ./xo-install.sh
```

ここで`2.Update`を選択して更新します。

 GitHub上のXenOrchestraInstallerUpdaterを見る限りは数ヶ月に1度くらいの頻度で更新されているので、毎回`git pull 〜`は必要ありません。これはGitHubのページなどで情報を確認しながら、適宜アップデートしてください。

 ## XCP-ngの独自用語

 XCP-ngのホストそのものはXenの世界でdom0と呼ばれます。色々コミュニティを見ていてdom0は何ぞや？と思われる方もいらっしゃると思うので補足です。dom0には色々なツールなどをインストールすることは避けた方が良さそうです(iperf3など)。

