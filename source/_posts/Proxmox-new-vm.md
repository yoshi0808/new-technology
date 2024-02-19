---
title: ProxmoxVEのVM新規作成
date: 2024-02-19T18:04:44+09:00
tags: proxmox
categories:
---

{% asset_img Title.png alt %}

<p class="onepoint">この記事で実現すること</p>

仮想環境のProxmox VEで仮想マシン（VM）の新規作成を行います。例示としてこの記事ではUbuntuのセットアップを行います。ネットワークインターフェースと仮想マシンとの関係も見ていきます。

<!-- more -->

## Proxmox VEのネットワーク構成

新規VMのセットアップにはディスク、メモリ、ネットワークを定義することになりますが、VMの新規作成の前にネットワークインタフェースについて見ていきます。

以下は私の環境の例です。intel X710の4PortとRealtekのオンボードNIC（未使用）の５つが存在します。

{% asset_img proxmox1.png 1024 alt %}

X710の4Portは"enp1s0f0"が1Port目、"enp1s0f3"が4Port目となっています。これが物理ネットワークインタフェースです。
これに加えて、インストール直後は、vmbr0というネットワークブリッジが作成されており、ここではセットアップ時に決めたIPアドレスが設定されているはずです。vmbr1以降は私が手動で作成しています。

仮想環境においてはL2ネットワークが重要であり、VMは仮想MACアドレスを保有します。ProxmoxのインタフェースではこのネットワークブリッジがNICの物理MACアドレス以外の仮想マシンのMACアドレスも受け取ることになり、いわば、無差別モード（プロミスキャスモード）で動作します。

仮想マシンに対してL2レイヤのブリッジ（取り次ぐ）を行うために、{% label primary@Linux Bridge %}が必要となります。
Proxomoxにおいては命名規約は厳格であり、自由な名前は付けられません。ブリッジにしてもVLANにしても命名規則に従う必要があります。

ここでは仮想マシンの仮想MACアドレスは作成しません。VMを作成するタイミングで自動生成されることになります。L3レイヤ、つまりIPアドレスに関してProxmoxは意識しません。VMの中のOS任せであり、これはESXiなどの他のハイパーバイザーと考え方は同じです。

個人的には、物理ネットワークカードのMACアドレスが表示されないのは少しわかりづらく感じます。物理ネットワーク（ネットデバイス）にはコメント欄があるので、そこにMACアドレスを記入しておけば運用面はなんとかなりそうです。

## ISOの保存先

VMを新規作成する上で、OSのインストールのために予めISOファイルをコピーしておく必要があります。Proxmoxの左ペインから、{% label primary@local(ホスト名) %}を選択します（私の環境ではホスト名がpve1という名前です）。
{% asset_img proxmox2.png 800 alt %}


ここに{% label primary@ISOイメージ %}とあるので、選択します。ここで、{% label primary@アップロード %}ボタンをクリックし、ローカルの端末からISOファイルをアップロードします。今回は、Ubuntu22.04デスクトップをインストールするためにファイルアップロードします。
Ubuntuのダウンロードやセットアップの内容については、以前にESXiにUbuntuをインストールする記事を投稿しています。「{% post_link ubuntu22-04lts %}」を参照してください。

## VMの新規作成

ここでは２つのネットワークインタフェースを持つUbuntu22をセットアップします。
Proxmoxの右上にある青いボタン{% label primary@VMを作成 %}をクリックします。いよいよ仮想マシンの作成に入ります。
{% asset_img proxmox3.png 480 alt %}

ホスト名としての名前を入力します。ここでは、”xo”としました。VM IDは100から付番されていきます。また{% label primary@ブート時に起動 %}するか否かを決定します。

### OSの種類

{% asset_img proxmox4.png 480 alt %}

Linuxを選択します。UbuntuやDebianなどをバージョン毎に選ぶのかと思いましたが、種類は多くありません。{% label primary@Kernel6.x-2.6 %}または{% label primary@Kernel2.4 %}の2種類です。{% label primary@Kernel6.x-2.6 %}を選択します。今回は関係ありませんが、Windows11もインストールできるようですね。また、懐かしいSolarisも選択可能となっています。昔は Solarisでもコードを書きましたが、まだマルチスレッドが一般的に利用されておらず、スレッドセーフという言葉も当時は一般的ではなくてマニュアルには「スレッド安全」と書かれていたのが印象的です。
さて、ISOファイルを選択して次に進みます。

### システム

{% asset_img proxmox6.png 480 alt %}

ここでは、旧ブートのBIOS（SeaBIOS）かUEFIを選択します。UbuntuはUEFIに対応しているのでよほどのことがなければUEFIを選びます。{% label primary@TPM追加 %}は好みで選んでください。また、{% label primary@Qemuエージェント %}のチェックボックスは最初、Offのままにしておきます（後で設定します）。ゲストにインストールするヘルパーデーモンであり、稼働状況をホストが把握するためや、ホストから安全にシャットダウンするなどのアクションができるようになります。ESXiではVMWareToolsに相当するモジュールです。

### ディスク

{% asset_img proxmox7.png 480 alt %}

ディスクサイズを設定します。追加のボリュームを加える場合もここで設定します。

### CPU

{% asset_img proxmox8.png 480 alt %}

CPUの種別、CPUのコア数を指定します。Extra CPU Flagsとしていくつかの脆弱性に対応させるためのチェックがあります。私はRyzen５5600GにProxmoxをインストールしているので下記のオプションとしました。
CPUの種別は特定されたものがあればそれを、無ければ一般的に{% label primary@x86-64-v2-AES %}を選びます。Intel/AMDをクラスタで混在させないならそのCPUの最も古いものに合わせておくのが良いようです。詳細はヘルプのCPU TYPEを確認してください。

> If you don’t care about live migration or have a homogeneous cluster where all nodes have the same CPU and same microcode version, set the CPU type to host, as in theory this will give your guests maximum performance.

> If you care about live migration and security, and you have only Intel CPUs or only AMD CPUs, choose the lowest generation CPU model of your cluster.

> If you care about live migration without security, or have mixed Intel/AMD cluster, choose the lowest compatible virtual QEMU CPU type.

### メモリ

{% asset_img proxmox9.png 480 alt %}

VMで利用するメモリの量を設定します。

### ネットワーク

{% asset_img proxmox10.png 480 alt %}

特に変更することはなく、NICのモデルは、{% label primary@VirtIO(準仮想化) %}を選んでおきます。おっと、ここではNICを追加することができませんね。後で2枚目のNICを追加することになるのでしょうか。まずはメインの{% label primary@vmbr0 %}ブリッジを選択しておきます。

### 確認

最後に確認画面で完了します。

## （任意）仮想マシンでネットワークの追加

2枚目のNICをVMに追加する場合、仮想マシンが作成されたら、以下のようにハードウェアからネットワークの追加を行います。

{% asset_img proxmox12.png 1024 alt %}

## VMの起動

左ペインでVMを選択した状態で、画面上部の{% label primary@▶︎開始 %}をクリックします。

さて、無事にコンソールから起動してきました。
{% asset_img proxmox13.png 1024 alt %}

前述した通り、この記事ではUbuntuのセットアップ手順については省略します。キーボードを含め、特に問題が発生するようなところは無いと思われます。ProxoxのVMの{% label primary@コンソール %}のプルダウンから、{% label primary@VNC %}を選ぶと大きな画面でセットアップを進められます。

> {% post_link ubuntu22-04lts %}

セットアップしているところでVMのサマリー画面を見ていると結構面白いですね。1vCPUと2GBのメモリでは少々足りないようです。
{% asset_img proxmox14.png 1024 alt %}

もちろん後からCPUとメモリは変更できます。4vCPU/4GBのメモリでもFirefoxを起動し、Fast.comに接続すると結構しんどそうです（1.5Gbps）。Ryzen7 5700GのESXiでは2vCPU/2GBで2.4Gbps、XCP-ngでは古いCore i7-8700@3.20GHzで2vCPU/2GBで2.8Gbpsなので最適化という意味では若干改善の余地があるような気もします。これがCLIベースのSpeedtestだと3者共に殆ど結果が変わらないので何か描画などに関してオーバーヘッドがあるのかなという気がしています。

また、ゲストエージェントが未設定という表示もされています。

## VMの確認と後工程

Ubuntuのセットアップが終了して再起動後、さらにUbuntuモジュールの更新処理が行われていきます。
それがひと段落したら、ゲストエージェントをインストールします。Ubuntu上の端末アプリケーションを起動し、以下のコマンドを入力します。
``` bash
$ sudo apt install qemu-guest-agent
```

これでゲストエージェントのインストールは完了です。一旦、VMをシャットダウンします。
続いて、VMのオプションから、{% label primary@QEMU Guest Agent %}を有効にします。
{% asset_img proxmox15.png 1024 alt %}

再度、Ubuntuを起動し、サマリ情報を参照すると、以下のようにIPアドレスの情報が取得できています。当たり前ですが、IPv6も確認できます。
{% asset_img proxmox16.png 800 alt %}

{% label primary@More %}ボタンをクリックすると、2枚目のNICのIPアドレスも確認できます。

これでProxmoxに関して、一通りセットアップからVMの作成までを終えました。CPUタイプのあたりは少し最適化に向けて試行錯誤は必要そうですが、とても簡単にVMが作成できることがわかりました。
