---
title: ESXi(無償版)のセキュリティを高める
tags:
  - ESXi
categories:
  - Security
date: 2021-01-23 22:00:00
---

{% asset_img vmware.png alt %}

<p class="onepoint">この記事で実現すること</p>

VMwareから、”vSphereのセキュリティ"のドキュメンテーションがあります。350ページと膨大な量になります。この情報のうち大半はビジネスで利用するvCenter Serverを中心としたセキュリティ維持のための記載になりますが、個人向けESXiにポイントを絞り、どのようにセキュリティを高めるか確認していきます。

> vSphereのセキュリティ ESXi7.0
 <https://docs.vmware.com/jp/VMware-vSphere/7.0/vsphere-esxi-vcenter-server-70-security-guide.pdf>

> vSphereのセキュリティ ESXi8.0 Update1
<https://docs.vmware.com/jp/VMware-vSphere/8.0/vsphere-esxi-vcenter-801-security-guide.pdf>

<!-- more -->

## ホームユーザーとしての無償版ESXiのセキュリティ

まずは情報セキュリティのポイントである機密性、完全性、可用性について確認していきます。可用性についてはバックアップとして「{% post_link esxi-backup %}」の記事を紹介しています。完全性として不具合に対応するパッチの適用については「{% post_link esxi67-patch %}」で記載しています。残るは機密性です。物理的セキュリティ（つまり盗難対策など）はここでは割愛し、ESXiにおける機密性の設定内容について記載します。

前述したドキュメントを眺めると正直ビジネス向けプロダクトと個人向けとの説明が混在していて理解が難しいです。個人向けESXiでは以下は使えません。

- vCenter Server
- vShpere Client(Windowsで稼働させるクライアント。6.5から使えません）
- Host Client
- vShpere Client(HTML5)

クライアント周りが非常にややこしい事になっていますが、無償版ESXiではvSphere Web ClientおよびESXi Shell（SSH）のみ利用可能です。実はこれだけに機能を絞るとあまり与えられた選択肢はありません。

## 無償版ESXiで設定可能な項目
上記ドキュメント全体を通して、設定可能な機密性に関する項目は以下の通りです。

- ESXiに接続可能なIPを絞る
- SSHの起動、停止の実行
- SSHでログインし各種アクセスログの確認をする
- syslogで外部syslogサーバーにログを転送する
- SSHで公開鍵認証を行う（必要であれば）

ここではv6.7のドキュメントを引用しながら設定方法について説明していきます。
## 全般的な説明

個々の設定に入る前に全体的な考え方について説明します。P41からの「ESXiのセキュリティに関する一般的推奨事項」を引用します。

- ESXi ShellおよびSSHはデフォルトで無効になっています。
デフォルトでは、限られた数のファイアウォール ポートのみが開いています。特定のサービスに関連付けられている追加のファイアウォール ポートを明示的に開くことができます。
- ESXiは、その機能の管理に不可欠なサービスのみを実行します。ESXiの実行に必要な機能しか配布できません。
- デフォルトでは、ホストを管理するために必要でないポートは、すべて閉じられています。追加のサービスが必要な場合は、ポートを開きます。
- デフォルトでは、強度の低い暗号は無効になっており、クライアントからの通信はSSLで保護されます。チャネルの保護に使用するアルゴリズムは、SSLハンドシェイクによって異なります。ESXiで作成されたデフォルトの証明書は、署名アルゴリズムとして、RSA暗号化のPKCS#1 SHA-256を使用します。
- Webクライアントによるアクセスをサポートするため、内部ではESXiによってTomcat Webサービスが使用されています。このサービスは、管理と監視のためにWebクライアントで必要な機能のみを実行するように修正されています。そのため、ESXiは、さまざまな使用環境で報告されているTomcatのセキュリティ問題による脆弱性に対応できます。
- VMwareは、ESXiのセキュリティに影響する恐れのあるすべてのセキュリティ警告を監視し、必要に応じてセキュリティパッチを発行します。
FTPやTelnetなどのセキュリティ保護されていないサービスはインストールされません。これらのサービス用のポートはデフォルトで閉じられています。SSHやSFTPなど、よりセキュアなサービスを容易に使用できるため、これらの安全性の高いサービスを選択し、セキュリティ保護されていないサービスの使用は避けるようにしてください。たとえば、SSHを使用できずTelnetを使用する必要がある場合、SSLを使用したTelnetを使用して仮想シリアル ポートにアクセスします。
- セキュリティ保護されていないサービスを使用する必要があり、ホストに十分な保護を実装している場合は、明示的にポートを開くことで対応できます。
- ESXiシステムでUEFIセキュア ブートを使用することを検討します。「ESXiホストのUEFIセキュア ブート」を参照してください。

### ESXiに接続可能なIPを絞る

この機能はESXiではFirewallと呼ばれ、Linuxのiptablesやufwと同様にシンプルなものです。ホームユーザーはシンプルなLANで閉じられたアクセスですが、安全のために設定を検討すべきです。
P72に「ESXiファイアウォール設定の管理」があります。”「構成」をクリックし”と解説がありますが、いきなり見つけられません。実際にはWeb管理画面の左ペインメニューの {% label primary @ネットワーク %}を選択し、{% label primary @ファイアウォール %}タブをクリックして見つける事ができます。デフォルトではESXiの管理インタフェースにアクセス可能であれば一切の制約なく接続可能になっていますので、ここではSSHとWeb Clientに接続可能なIPを絞る事にしましょう。ご自身が使われているプライベートネットワークアドレスや端末のIPアドレスでも構いませんが設定も簡単ですしお勧めします。

{% asset_img esxi1.png alt %}

SSHで接続してバックアップを取得する場合の「SSHサーバ」、Web管理画面の「vSphere Web Client」について接続IPアドレスまたはネットワークアドレスを指定します。

### SSHの起動、停止

これは、管理メニューの左ペイン{% label primary @ホスト %}ー{% label primary @管理 %}から{% label primary @TSM %}および{% label primary @TSM-SSH %}の起動・停止を行います。SSHは起動したままの状況は推奨されておらず、このドキュメントでも必要な時のみ起動するように記載されています。心配な方はSSHは起動したままにしないのが無難です。利便性のためにSSHは普段から起動したまま運用するならば接続IPを絞るなど何らかの工夫は加えたいところです。ここは個人の考え方で大きく運用は異なりますから、ベストプラクティスを定めるのは難しいのが実態です。

### SSHのログ

P113に「ESXiログ ファイルの場所」という章があります。ここでログインした際のログが確認できます。場所は{% label primary @/var/log/auth.log %}です。わざわざSSHでログインしなくとも、Web管理画面の{% label primary @ホスト %}ー{% label primary @監視 %}からログを閲覧できます。

### syslogでログを転送する

syslogサーバをお持ちの方はログを転送して確認できます。NASなどは簡易なsyslogサービスを持っている場合があるので活用を検討してみてください。P112には以下の通り記載があります。
>vSphere Client または esxcli system syslog vCLI コマンドを使用して syslog サービスを構成できます

これも難しい記載になってますが、Web管理画面から設定できます。以下のように管理メニューの左ペイン{% label primary @ホスト %}ー{% label primary @管理 %}から{% label primary @システム %}、{% label primary @詳細設定 %}と進み、右上のフィルタリストに"Syslog.global.logHost"と入力すると設定対象の項目が表示されます。
{% asset_img esxi2.png alt %}

"Syslog.global.logHost"の行でマウスを右クリックし、{% label primary @オプションの編集 %}を選択します。ここではプロトコル、対象ホスト、ポート番号を指定します。受ける側のsyslogサーバに合わせUDPまたはTCPを選択し、`udp://192.168.x.xxx:514`のように指定します、
また、syslogサーバでSSL対応がなされていない場合は、"Syslog.global.logCheckSSLCerts"の値を`True`から`False`に変更します。

syslogではひたすらログが流れてきます。SSHにおけるログイン失敗については、ファシリティ＝auth、重要度=Errorの扱いです。また、Web Clientについては、重大度はInfoで”Invalid Login”というログが書かれるようですので、これらだけをフィルタしても良いでしょう。

### SSHで公開鍵認証を行う（必要であれば）

P48から公開鍵認証について記載があります。これも記載が専用コマンドでわかりづらい記載になっており、実際には無償版ESXIの説明にはなっていません。ESXiはOpenSSHを使っていますので、そちらの設定で動作します。また、公開鍵のみでログインする場合`/etc/ssh/sshd_config`を修正したくなりますが、これは修正しないようにと説明されています。また同じP48で紹介している公開鍵認証に関する**VMwareの説明ページ**があります。OpenSSHの秘密鍵と公開鍵の作成についてはネットの様々な場所で説明されているのでここでは割愛しますが、以下の場所に公開鍵を配置するように説明があります。
> For ESXi 5.x, 6.0, 6.5 and 6.7, the authorized_keys is located at: /etc/ssh/keys-＜username＞/authorized_keys

つまり、rootユーザーですと、`/etc/ssh`配下に`keys-root`フォルダを作り、`authorized_keys`に公開鍵を記述せよという事です。

{% note info  %}
ESXi7、ESXi8では、"keys-root"フォルダおよびauthorized_keysファイルは最初から存在します（ESXi6.7では作成する必要がありました）。
{% endnote %}

>vmware -Allowing SSH access to ESXi/ESX hosts with public/private key authentication (`1002866`)-
 <https://kb.vmware.com/s/article/1002866>

ちなみに、ESXi側でもssh-keygenを実行すると、`/etc/ssh`の配下に、公開鍵`ssh_host_rsa_key.pub`と秘密鍵`ssh_host_rsa_key`が作成されます。それと同時に`/etc/ssh/sshd_config`にも公開鍵認証である、`HostKey /etc/ssh/ssh_host_rsa_key`が挿入されるようです。これがあるとrootユーザーは公開鍵認証が必須という事になりますから、秘密鍵をダウンロードせずにそのままsshを閉じるとパスワードで接続できなくなるため注意が必要です。

また、このVMwareのKBによれば、以下の通りsshd_configを修正せよとあります。
> To disable password login, ensure that the ChallengeResponseAuthentication and PasswordAuthentication are set to no.

いったいどちらを信用すべきなんだろうと悩んでしまいますが、やるなと言われている事は敢えてやらずにsshd_configの書き換えはしない方向で進めます。一般的な方法でクライアントで秘密鍵、公開鍵のペアを作成し、ESXiの`/etc/ssh`配下に`keys-root`フォルダを作り、`authorized_keys`に公開鍵をコピーします。
1. PCからESXi(192.168.x.x)の/tmpに公開鍵をコピーします。ここではsshする前提なのでscpを使います。もちろん他の方法でも構いません。
`scp id_rsa.pub root@192.168.x.x:/tmp`
1. ESXiにて/tmpからAuthorized_keysに鍵をコピー（追記）します。
 `cat /tmp/id_rsa.pub >> /etc/ssh/keys-root/authorized_keys `

これらの作業はリスクが高いものですので、他の端末から既に接続した状態にする、或いは他のユーザー（管理者権限）をESXiに作成し接続できている状態で作業される事をお勧めします。

結局のところ、`sshd_config`を修正できないのであればパスワード認証を禁止するなどの対応はできません。しかし、普段からrootのパスワードは利用せず、公開鍵認証を利用することでパスワードの漏洩は防ぐことができます。

## ESXiに別の管理者ユーザーを作成する

”vSphereのセキュリティ"についてはこれまで説明したものが全てですが、root以外のユーザーを作成し、rootはできるだけ使わない事をお勧めします。これは一般論でありrootがよく知られたユーザー名だからです。「{% post_link esxi-backup %}」で説明したバックアップスクリプトのghettoVCBはrootユーザーを必須としているので、運用上、どうしてもrootユーザーでのログインは必要になってきます。しかし仮想マシンなどの操作がメインとなるWebクライアントについては別の管理者アカウントで操作すべきで、可能な限りrootユーザーの情報が漏洩しないようにrootを使う機会を減らすべきです。以下の手順で管理者アカウントを作成します。

1. 管理メニューの左ペイン{% label primary @ホスト %}ー{% label primary @管理 %}から{% label primary @セキュリティとユーザー %}に進み、{% label primary @ユーザー %}から{% label primary @ユーザーの追加 %}をクリックします。
{% asset_img esxi3.png 800 alt %}
2. ユーザー名とパスワードを登録してユーザーの作成を終えます。
3. 管理メニューの左ペイン{% label primary @ホスト %}から{% label primary @アクション %}を選択し、プルダウンの{% label primary @権限 %}をクリックします。
4. さらに{% label primary @ユーザーの追加 %}を選択します。実際には上記で作成したユーザーと同一名のユーザー名を入力します。ロールについては"システム管理者"を選択します。
{% asset_img esxi4.png 800 alt %}

これで新しいユーザーが作成できたので、Web管理画面からログイン可能か確認してください。rootユーザーは長めのパスワードを再設定し、パスワード管理ソフトに登録し普段は使わないようにします。普段から使わずにパスワードを封印しておけばより安全になります。

## パスワード認証と公開鍵認証について

ここからはESXiの話からは少し脱線します。一般的にパスワードより公開鍵認証の方が安全という記事をよく見かけます。それはその通りですが補足します。

パスワードは確かにインターネット上にデータとして流れますから漏洩リスクはあります。「{% post_link ssl-inspection %}」でSSLのシーケンスを記載しましたが、経路の途中で悪意あるネットワーク機器によって改竄されてユーザーがそれに気づかず情報が漏洩する可能性はあります。それに比べれば、公開鍵認証は秘密鍵で署名した情報をサーバー側に配置してある公開鍵で検証するので鍵の情報が都度流れるわけではありません。オフィスでシステムを使う場合も、公開鍵認証＋パスフレーズで運用していれば、仮にパスフレーズだけが見られたとしても鍵が漏洩しなければパスワードよりは安全です。

さらにパスワードはクリップボードからの読み取りやブラウザからの画面上の情報読み取りの機能があります。ブラウザの拡張機能は殆どがページの内容を読み取る事ができます。SSLでは全く保護できません。ブラウザの上で起きている話ですから。興味のある方はブラウザの拡張機能の権限で調べてみてください。拡張機能を使わないでという事ではなくて、信頼できる拡張機能を選んでください。

しかし、こういった漏洩はあくまでオープンなネットワークに対して発生するものです。自宅でクローズなネットワークを利用してESXiを運用している場合は、パスワード認証と公開鍵認証とであまり違いはありません。

一方、公開鍵認証は確かにパスワードの流出はありませんが、鍵は~/.ssh/id_rsaというファイルで保存されている方も多いでしょう。これは昔からの伝統ですが、現在では少し無防備ではないでしょうか。ウィルスに感染したり、ファイル共有から流出する可能性を考えるとパスワード、公開鍵認証どちらが安全という断定はできません。秘密鍵のパスフレーズを難解なものにするという方法もありますが、秘密鍵をダウンロードしじっくり解読すれば解読は十分に可能なものであり、パスワードと同様の複雑さの議論になってしまいます。結局いずれの方法を選択するにしても、対策は必要です。LAN内のログインで悩むくらいならパスワード管理ソフトからパスワードをコピー、貼り付けしてから速やかにクリップボードの内容を消す方がよほど安全ではないでしょうか。

クライアントPCの秘密鍵を盗まれた上に自宅のローカル環境のESXiにログインされるというのは非常に稀な事です。しかし公開鍵認証を使うと決めたのであれば、秘密鍵はパスワード以上に取り扱いを厳重にしたいものです。

公開鍵認証に関しては、一番先行しているのがビットコインなどの暗号資産であり、コールドウォレット（秘密鍵）の管理方法から学ぶ事は多いです。PCの管理とは全く次元の違う緊張感のあるなかで秘密鍵の保管はオフラインが大前提です。ハードウェアウォレットが推奨されており、これは一般的なITの世界では**yubico**のYubikeyによる物理セキュリティキーが相当します。取り扱う情報資産や金融資産の重要度に応じて、セキュリティに対する取り組み方が変わってきます。
> yubico
 <https://www.yubico.com>

## VMware Security Advisory

VMwareに関する脆弱性情報は以下にあります。このページから {% label primary @Sign up for Security Advisories %}をクリックし、メールアドレスを登録することでVMware製品の脆弱性情報を入手できます。

> VMware Security Advisories
 <https://www.vmware.com/security/advisories.html>